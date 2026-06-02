import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, relative, resolve } from 'node:path';
import type { WorkspaceJsonV3 } from '@workspacejson/spec';
import {
  AgentsMdParser,
  RepoScanner,
  RuleEngine,
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
  content: WorkspaceJsonV3;
}

export async function generateWorkspaceJson(
  repoRoot: string,
  config: Partial<AuditConfig> = {},
  options: { dryRun?: boolean } = {},
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

  const workspace: WorkspaceJsonV3 = {
    manual: {},
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
        scannedAt: now,
      },
    },
    agents: {},
    health: {
      intelligenceState: 'INSUFFICIENT_DATA',
      observationCount: 0,
      confidence: 0,
    },
  };

  const outputPath = resolve(resolvedRoot, '.agents/workspace.json');

  if (!options.dryRun) {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, JSON.stringify(workspace, null, 2) + '\n', 'utf8');
  }

  return { path: outputPath, written: !options.dryRun, content: workspace };
}
