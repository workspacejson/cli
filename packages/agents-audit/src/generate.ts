import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, relative, resolve } from 'node:path';
import type { WorkspaceJsonV3 } from '@workspacejson/spec';
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
import type { AuditConfig, RuleContext } from '@workspacejson/rules';
import { DEFAULT_AUDIT_CONFIG, detectCiProvider } from './internal/config.js';
import { findAgentsMdPath, readTextOrEmpty } from './internal/fs.js';

const _require = createRequire(import.meta.url);
const { version: pkgVersion } = _require('../package.json') as { version: string };

export interface GenerateResult {
  path: string;
  written: boolean;
  skipped: boolean;
  drift: boolean;
  preservedManual: boolean;
  invalidFileMoved?: string;
  content: WorkspaceJsonV3;
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

function isMateriallyCurrent(existing: WorkspaceJsonV3, next: WorkspaceJsonV3): boolean {
  return (
    generatedProjection(existing.generated as Record<string, unknown>) ===
      generatedProjection(next.generated as Record<string, unknown>) &&
    stable(existing.agents) === stable(next.agents) &&
    stable(existing.health) === stable(next.health)
  );
}

function invalidArtifactMessage(outputPath: string, errors: string[], check: boolean): string {
  const detail = errors.length > 0 ? `\nValidation errors:\n${errors.map((error) => `  - ${error}`).join('\n')}` : '';
  if (check) {
    return `agents-audit generate --check: ${outputPath} is invalid.\nGenerated sections are not current; manual evidence is untouched.${detail}`;
  }
  return `agents-audit generate: refusing to overwrite ${outputPath}\nThe existing file is invalid and may contain hand-authored manual evidence.${detail}\nTo recover while preserving the invalid file:\n  agents-audit generate . --force`;
}

async function moveInvalidArtifact(outputPath: string): Promise<string> {
  const movedPath = `${outputPath}.invalid.${new Date().toISOString().replace(/[:.]/g, '-')}`;
  await rename(outputPath, movedPath);
  return movedPath;
}

export async function writeWorkspaceAtomically(outputPath: string, content: WorkspaceJsonV3): Promise<void> {
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
  config: Partial<AuditConfig> = {},
  options: { dryRun?: boolean; check?: boolean; force?: boolean } = {},
): Promise<GenerateResult> {
  const resolvedRoot = resolve(repoRoot);
  const fullConfig: AuditConfig = { ...DEFAULT_AUDIT_CONFIG, ...config };

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
  let existing: WorkspaceJsonV3 | undefined;
  let invalidFileMoved: string | undefined;
  if (existsSync(outputPath)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await readFile(outputPath, 'utf8'));
    } catch {
      const message = invalidArtifactMessage(outputPath, ['JSON could not be parsed'], options.check === true);
      if (!options.force || options.dryRun || options.check) throw new GenerateRefusalError(message);
      invalidFileMoved = await moveInvalidArtifact(outputPath);
    }

    if (parsed !== undefined) {
      const validation = new WorkspaceJsonValidator().validate(parsed);
      if (!validation.valid) {
        const message = invalidArtifactMessage(outputPath, validation.errors, options.check === true);
        if (!options.force || options.dryRun || options.check) throw new GenerateRefusalError(message);
        invalidFileMoved = await moveInvalidArtifact(outputPath);
      } else {
        existing = parsed as WorkspaceJsonV3;
      }
    }
  }
  const workspace: WorkspaceJsonV3 = {
    manual: existing?.manual ?? {},
    generated: {
      specVersion: '0.3',
      generatedAt: now,
      by: { name: 'agents-audit', version: pkgVersion },
      frameworkManifest: agentsMd.frameworkTokens.map((name) => ({ name, confidence: 0.5 })),
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
