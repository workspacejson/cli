import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import type { WorkspaceJson } from '@workspacejson/spec';
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

export interface GenerateResult {
  path: string;
  written: boolean;
  content: WorkspaceJson;
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

  const workspace: WorkspaceJson = {
    version: '1',
    generatedAt: now,
    topology: repo.isMonorepo ? 'monorepo' : 'single-package',
    ciProvider: detectCiProvider(repo.files),
    frameworks: agentsMd.frameworkTokens,
    conventions: agentsMd.conventions.map((c) => ({
      raw: c.raw,
      type: c.type,
      canonical: c.canonical,
    })),
    ...(agentsMdRelative !== undefined
      ? { agentFiles: { agentsMd: agentsMdRelative, workspaceJson: '.agents/agents.workspace.json' } }
      : { agentFiles: { workspaceJson: '.agents/agents.workspace.json' } }),
    packages: repo.packages.map((p) => ({
      name: p.name,
      path: p.path,
      ...(p.agentsMd !== undefined ? { agentsMd: p.agentsMd } : {}),
    })),
    gitSummary: {
      nonAgentsCommitCount30Days: repo.gitHistory.nonAgentsCommitCount30Days,
      filesChangedLast30Days: repo.gitHistory.filesChangedLast30Days,
    },
    hygiene: {
      score: score.value,
      grade: score.grade,
      failCount: score.breakdown.failCount,
      warnCount: score.breakdown.warnCount,
      scannedAt: now,
    },
  };

  const outputPath = resolve(resolvedRoot, '.agents/agents.workspace.json');

  if (!options.dryRun) {
    await writeFile(outputPath, JSON.stringify(workspace, null, 2) + '\n', 'utf8');
  }

  return { path: outputPath, written: !options.dryRun, content: workspace };
}
