import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { WorkspaceJsonV4 } from '@workspacejson/spec';
import {
  AgentsMdParser,
  RepoScanner,
  RuleEngine,
  WorkspaceJsonValidator,
  computeHygieneScore,
  missingFileReference,
  patternZeroMatch,
  frameworkDrift,
  sectionStaleness,
  conventionMismatch,
} from '@workspacejson/rules';
import type { RuleContext } from '@workspacejson/rules';
import { DEFAULT_PRODUCER_CONFIG, detectCiProvider, type ProducerConfig } from './config.js';
import { findAgentsMdPath, readTextOrEmpty } from './fs.js';

const _require = createRequire(import.meta.url);

// Resolve this package's own manifest by walking up from the current module
// rather than by a fixed relative path.
//
// A fixed path is depth-dependent, and source depth does not match bundled
// depth: this module lives at `src/producer/generate.ts` but tsup emits it into
// `dist/`, so `../../package.json` is correct for the source tree and wrong for
// the build output. That mismatch is invisible to this package's own tests
// (which run against source) and only fails for a consumer importing `dist`.
function readOwnManifest(): { name: string; version: string } {
  let directory = dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 10; depth += 1) {
    const candidate = resolve(directory, 'package.json');
    if (existsSync(candidate)) {
      return _require(candidate) as { name: string; version: string };
    }
    const parent = dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  throw new Error('Unable to locate the producer package manifest from ' + import.meta.url);
}

const { name: pkgName, version: pkgVersion } = readOwnManifest();

/**
 * Identity written to `generated.by` — the provenance of *which producer ran*.
 *
 * It defaults to this package. `agents-audit` passes its own identity so that
 * `agents-audit generate` keeps stamping artifacts exactly as it always has,
 * which is what its compatibility guarantee requires (META-247). `by` is
 * excluded from the material projection, so this never affects drift detection.
 */
export interface ProducerIdentity {
  name: string;
  version: string;
}

export const THIS_PRODUCER: ProducerIdentity = { name: pkgName, version: pkgVersion };

export interface GenerateResult {
  path: string;
  written: boolean;
  skipped: boolean;
  drift: boolean;
  preservedManual: boolean;
  invalidFileMoved?: string;
  content: WorkspaceJsonV4;
}

export class GenerateRefusalError extends Error {}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(',')}}`;
  return JSON.stringify(value);
}

function generatedProjection(generated: Record<string, unknown>): string {
  const { generatedAt: _generatedAt, by: _by, ...rest } = generated;
  return stable(rest);
}

function isMateriallyCurrent(existing: WorkspaceJsonV4, next: WorkspaceJsonV4): boolean {
  return (
    generatedProjection(existing.generated as Record<string, unknown>) ===
      generatedProjection(next.generated as Record<string, unknown>) &&
    stable(existing.agents) === stable(next.agents) &&
    stable(existing.health) === stable(next.health)
  );
}

// Refusal messages name the command the user actually ran. Before META-247
// these hardcoded `agents-audit`, which was correct when that was the only
// binary — in the neutral producer it would tell a `workspacejson` user to run
// a different tool. The caller supplies its own name; `agents-audit` passes its
// historical one so its messages stay byte-identical.
function invalidArtifactMessage(outputPath: string, errors: string[], check: boolean, commandName: string): string {
  const detail = errors.length > 0 ? `\nValidation errors:\n${errors.map((error) => `  - ${error}`).join('\n')}` : '';
  if (check) {
    return `${commandName} generate --check: ${outputPath} is invalid.\nGenerated sections are not current; manual evidence is untouched.${detail}`;
  }
  return `${commandName} generate: refusing to overwrite ${outputPath}\nThe existing file is invalid and may contain hand-authored manual evidence.${detail}\nTo recover while preserving the invalid file:\n  ${commandName} generate . --force`;
}

async function moveInvalidArtifact(outputPath: string): Promise<string> {
  const movedPath = `${outputPath}.invalid.${new Date().toISOString().replace(/[:.]/g, '-')}`;
  await rename(outputPath, movedPath);
  return movedPath;
}

export async function writeWorkspaceAtomically(outputPath: string, content: WorkspaceJsonV4): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  const temporary = resolve(dirname(outputPath), `.${randomUUID()}.workspace.json.tmp`);
  try {
    await writeFile(temporary, JSON.stringify(content, null, 2) + '\n', 'utf8');
    await rename(temporary, outputPath);
  } catch (error) {
    await unlink(temporary).catch(() => {});
    throw error;
  }
}

export async function generateWorkspaceJson(
  repoRoot: string,
  config: Partial<ProducerConfig> = {},
  options: { dryRun?: boolean; check?: boolean; force?: boolean; producer?: ProducerIdentity; commandName?: string } = {},
): Promise<GenerateResult> {
  const resolvedRoot = resolve(repoRoot);
  const fullConfig: ProducerConfig = { ...DEFAULT_PRODUCER_CONFIG, ...config };
  const producer: ProducerIdentity = options.producer ?? THIS_PRODUCER;
  const commandName = options.commandName ?? 'workspacejson';

  const scanner = new RepoScanner();
  const parser = new AgentsMdParser();
  const engine = new RuleEngine();
  engine.register(missingFileReference);
  engine.register(patternZeroMatch);
  engine.register(frameworkDrift);
  engine.register(sectionStaleness);
  engine.register(conventionMismatch);

  const agentsMdPath = await findAgentsMdPath(resolvedRoot);
  const agentsMdContent = await readTextOrEmpty(agentsMdPath);
  const agentsMd = await parser.parse(agentsMdPath, agentsMdContent);
  const repo = await scanner.scan(resolvedRoot);
  repo.gitHistory.agentsMdLastModified = agentsMd.lastModified;

  const ctx: RuleContext = {
    repo: { root: repo.root, files: repo.files, isMonorepo: repo.isMonorepo },
    workspace: {
      topology: repo.isMonorepo ? 'monorepo' : 'single-package',
      ciProvider: detectCiProvider(repo.files),
      manifests: {},
      packages: repo.packages,
      agentFiles: { agentsMd: agentsMd.filePath },
    },
    config: fullConfig as unknown as Record<string, unknown>,
    file: { path: agentsMd.filePath, language: 'unknown', content: agentsMd.raw },
    git: {
      recentCommits: async () => [],
      fileAge: async () => 0,
      churnScore: async () => 0,
      lastModified: async () => new Date(),
      authorCount: async () => 0,
      commitsBetween: async () => [],
      modificationVelocity: async () => 0,
    },
    findings: { findingsFor: () => [], hasFinding: () => false, confidence: () => null },
    emit: () => {},
  };
  Object.assign(ctx, { agentsMd, repo, config: fullConfig });

  const run = await engine.run(ctx);
  const score = computeHygieneScore(run.findings);
  const now = new Date().toISOString();

  const agentsMdRelative = existsSync(agentsMd.filePath)
    ? relative(resolvedRoot, agentsMd.filePath)
    : undefined;

  const outputPath = resolve(resolvedRoot, '.agents/workspace.json');
  let existing: WorkspaceJsonV4 | undefined;
  let invalidFileMoved: string | undefined;
  if (existsSync(outputPath)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await readFile(outputPath, 'utf8'));
    } catch {
      const message = invalidArtifactMessage(outputPath, ['JSON could not be parsed'], options.check === true, commandName);
      if (!options.force || options.dryRun || options.check) throw new GenerateRefusalError(message);
      invalidFileMoved = await moveInvalidArtifact(outputPath);
    }

    if (parsed !== undefined) {
      const validation = new WorkspaceJsonValidator().validate(parsed);
      if (!validation.valid) {
        const message = invalidArtifactMessage(outputPath, validation.errors, options.check === true, commandName);
        if (!options.force || options.dryRun || options.check) throw new GenerateRefusalError(message);
        invalidFileMoved = await moveInvalidArtifact(outputPath);
      } else {
        existing = parsed as WorkspaceJsonV4;
      }
    }
  }
  const workspace: WorkspaceJsonV4 = {
    manual: existing?.manual ?? {},
    generated: {
      specVersion: '0.4',
      generatedAt: now,
      by: { name: producer.name, version: producer.version },
      frameworkManifest: agentsMd.frameworkTokens.map((name) => ({ name, confidence: 0.5 })),
      // Restored from the expression a3fa85a deleted (META-203). Sorted by
      // source line because `conventions` sits INSIDE the material projection
      // and `stable()` preserves array order — unsorted output would make every
      // run report drift and break `generate --check` as a CI gate.
      conventions: agentsMd.conventions
        .slice()
        .sort((a, b) => a.lineNumber - b.lineNumber)
        .map((c) => ({ raw: c.raw, type: c.type, canonical: c.canonical })),
      fileIndex: {},
      topology: {
        packageCount: repo.packages.length,
        type: repo.isMonorepo ? 'monorepo' : 'single-package',
        ciProvider: detectCiProvider(repo.files),
        ...(agentsMdRelative !== undefined
          ? {
              agentFiles: {
                agentsMd: agentsMdRelative,
                workspaceJson: '.agents/workspace.json',
              },
            }
          : { agentFiles: { workspaceJson: '.agents/workspace.json' } }),
      },
      hygiene: {
        score: score.value,
        grade: score.grade,
        failCount: score.breakdown.failCount,
        warnCount: score.breakdown.warnCount,
        scannedAt:
          (existing?.generated.hygiene as { scannedAt?: string } | undefined)?.scannedAt ?? now,
      },
    },
    agents: {},
    health: {
      intelligenceState: 'INSUFFICIENT_DATA',
      observationCount: 0,
      confidence: 0,
    },
  };

  const unchanged = existing !== undefined && isMateriallyCurrent(existing, workspace);
  if (unchanged) {
    workspace.generated.generatedAt = existing!.generated.generatedAt;
  } else {
    (workspace.generated.hygiene as { scannedAt: string }).scannedAt = now;
  }
  if (!options.dryRun && !options.check && !unchanged) {
    await writeWorkspaceAtomically(outputPath, workspace);
  }
  return {
    path: outputPath,
    written: !options.dryRun && !options.check && !unchanged,
    skipped: unchanged,
    drift: !unchanged,
    preservedManual: existing !== undefined,
    ...(invalidFileMoved === undefined ? {} : { invalidFileMoved }),
    content: workspace,
  };
}
