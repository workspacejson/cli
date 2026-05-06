import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { WorkspaceJson } from '@workspacejson/spec';
import { AgentsMdParser, RepoScanner, RuleEngine, WorkspaceJsonValidator, computeHygieneScore, conventionMismatch, frameworkDrift, missingFileReference, patternZeroMatch, sectionStaleness } from '@workspacejson/rules';
import type { AuditConfig, AuditResult, RuleContext } from '@workspacejson/rules';

export const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  stalenessThresholdDays: 60,
  highActivityCommitCount: 20,
  conventionMismatchPrecisionMode: true,
  failOn: null,
  save: false,
  reportDir: '.agents/audit-history',
  ignore: [],
};

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

  const ctx: RuleContext = {
    agentsMd,
    repo,
    config: fullConfig,
  };

  if (workspaceJson !== undefined) {
    ctx.workspace = workspaceJson;
  }

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

async function findAgentsMdPath(repoRoot: string): Promise<string> {
  const rootPath = resolve(repoRoot, 'AGENTS.md');
  if (existsSync(rootPath)) {
    return rootPath;
  }

  try {
    const entries = await readdir(repoRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const candidate = resolve(repoRoot, entry.name, 'AGENTS.md');
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  } catch {
    // fall through to root path
  }

  return rootPath;
}

async function loadWorkspaceJson(
  repoRoot: string,
  agentsMdLastModified: Date,
  validator: WorkspaceJsonValidator,
): Promise<{ workspaceJsonFound: boolean; workspaceJsonStale: boolean; workspaceJsonStatus: AuditResult['workspaceJsonStatus']; workspaceJsonErrors: string[]; workspaceJson?: WorkspaceJson }> {
  const workspacePath = resolve(repoRoot, '.agents/agents.workspace.json');
  if (!existsSync(workspacePath)) {
    return {
      workspaceJsonFound: false,
      workspaceJsonStale: true,
      workspaceJsonStatus: 'missing',
      workspaceJsonErrors: [],
    };
  }

  try {
    const raw = await readFile(workspacePath, 'utf8');
    const workspaceJson = JSON.parse(raw) as WorkspaceJson;
    const validation = validator.validate(workspaceJson);
    const generatedAt = typeof workspaceJson === 'object' && workspaceJson !== null ? Reflect.get(workspaceJson, 'generatedAt') : undefined;
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
      workspaceJsonErrors: ['Unable to parse .agents/agents.workspace.json'],
    };
  }
}

async function readTextOrEmpty(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}
