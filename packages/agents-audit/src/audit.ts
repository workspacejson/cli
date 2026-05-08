import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { WorkspaceJson } from '@workspacejson/spec';
import { AgentsMdParser, RepoScanner, RuleEngine, WorkspaceJsonValidator, computeHygieneScore, conventionMismatch, frameworkDrift, missingFileReference, patternZeroMatch, sectionStaleness } from '@workspacejson/rules';
import type { AuditConfig, AuditResult, ParsedAgentsMd, RepoState, RuleContext } from '@workspacejson/rules';
import { DEFAULT_AUDIT_CONFIG, detectCiProvider } from './internal/config.js';
import { findAgentsMdPath, readTextOrEmpty } from './internal/fs.js';

function buildLegacyContext(
  agentsMd: ParsedAgentsMd,
  repo: RepoState,
  config: AuditConfig,
  workspace?: WorkspaceJson,
): RuleContext {
  // Construct a v0.2 RuleContext with stubs for per-file fields.
  // The five migrated rules access agentsMd/repo/config via a legacy bridge cast
  // (ctx as unknown as { agentsMd; repo; config }) — so we pass them through
  // via Object.assign to make them available at runtime.
  // TODO(v0.3): migrate rules to use ctx.workspace / ctx.git properly.
  const base: RuleContext = {
    repo: {
      root: repo.root,
      files: repo.files ?? [],
      isMonorepo: repo.isMonorepo ?? false,
    },
    workspace: {
      topology: (workspace?.topology as 'single-package' | 'monorepo' | 'polyglot-monorepo' | undefined) ?? (repo.isMonorepo ? 'monorepo' : 'single-package'),
      ciProvider: (workspace?.ciProvider as 'github-actions' | 'gitlab-ci' | 'circleci' | 'jenkins' | 'none' | 'unknown' | undefined) ?? detectCiProvider(repo.files ?? []),
      manifests: {},
      packages: repo.packages ?? [],
      agentFiles: workspace?.agentFiles ?? (agentsMd.filePath ? { agentsMd: agentsMd.filePath } : {}),
    },
    config: config as unknown as Record<string, unknown>,
    file: {
      path: agentsMd.filePath,
      language: 'unknown',
      content: agentsMd.raw,
    },
    git: {
      recentCommits: async () => [],
      fileAge: async () => 0,
      churnScore: async () => 0,
      lastModified: async () => new Date(),
      authorCount: async () => 0,
      commitsBetween: async () => [],
      modificationVelocity: async () => 0,
    },
    findings: {
      findingsFor: () => [],
      hasFinding: () => false,
      confidence: () => null,
    },
    emit: () => {},
  };

  // Attach legacy fields at runtime for the bridge cast used by migrated rules.
  return Object.assign(base, { agentsMd, repo, config }) as RuleContext;
}

export { DEFAULT_AUDIT_CONFIG };

export async function runAudit(repoRoot: string, config: Partial<AuditConfig> = {}): Promise<AuditResult & { workspaceJson: WorkspaceJson | undefined }> {
  const resolvedRoot = resolve(repoRoot);
  const fullConfig: AuditConfig = { ...DEFAULT_AUDIT_CONFIG, ...config };

  const scanner = new RepoScanner();
  const parser = new AgentsMdParser();
  const validator = new WorkspaceJsonValidator();
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

  const { workspaceJson, workspaceJsonFound, workspaceJsonStale, workspaceJsonStatus, workspaceJsonErrors } = await loadWorkspaceJson(resolvedRoot, agentsMd.lastModified, validator);

  const ctx = buildLegacyContext(agentsMd, repo, fullConfig, workspaceJson);

  const run = await engine.run(ctx);
  const score = computeHygieneScore(run.findings);

  return {
    findings: run.findings,
    score,
    agentsMdPath,
    workspaceJsonFound,
    workspaceJsonStale,
    workspaceJsonStatus,
    workspaceJsonErrors,
    runAt: new Date(),
    durationMs: run.durationMs,
    workspaceJson,
  };
}

async function loadWorkspaceJson(
  repoRoot: string,
  agentsMdLastModified: Date,
  validator: WorkspaceJsonValidator,
): Promise<{ workspaceJsonFound: boolean; workspaceJsonStale: boolean; workspaceJsonStatus: AuditResult['workspaceJsonStatus']; workspaceJsonErrors: string[]; workspaceJson?: WorkspaceJson }> {
  const workspacePath = resolve(repoRoot, 'agents.workspace.json');
  const legacyWorkspacePath = resolve(repoRoot, '.agents/agents.workspace.json');
  const primaryExists = existsSync(workspacePath);
  const pathToRead = primaryExists ? workspacePath : legacyWorkspacePath;
  if (!primaryExists && !existsSync(legacyWorkspacePath)) {
    return {
      workspaceJsonFound: false,
      workspaceJsonStale: true,
      workspaceJsonStatus: 'missing',
      workspaceJsonErrors: [],
    };
  }

  try {
    const raw = await readFile(pathToRead, 'utf8');
    const workspaceJson = JSON.parse(raw) as WorkspaceJson;
    const validation = validator.validate(workspaceJson);
    const generatedAt = (workspaceJson as Record<string, unknown>)['generatedAt'];
    const generatedDate = typeof generatedAt === 'string' ? new Date(generatedAt) : new Date(0);
    const stale = !validation.valid || Number.isNaN(generatedDate.getTime()) || generatedDate < agentsMdLastModified;
    const errors = validation.valid ? [] : validation.errors;

    return {
      workspaceJsonFound: true,
      workspaceJsonStale: stale,
      workspaceJsonStatus: validation.valid ? (generatedDate < agentsMdLastModified ? 'stale' : 'fresh') : 'invalid',
      workspaceJsonErrors: errors,
      workspaceJson,
    };
  } catch {
    return {
      workspaceJsonFound: true,
      workspaceJsonStale: true,
      workspaceJsonStatus: 'invalid',
      workspaceJsonErrors: ['Unable to parse agents.workspace.json'],
    };
  }
}
