import { existsSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import type { AuditConfig, AuditResult, Finding } from '@workspacejson/rules';

export interface ConfigLoadResult {
  config: AuditConfig;
  warning?: string;
}

export const DEFAULT_CLI_CONFIG: AuditConfig = {
  stalenessThresholdDays: 60,
  highActivityCommitCount: 20,
  conventionMismatchPrecisionMode: true,
  failOn: null,
  save: false,
  reportDir: '.agents/audit-history',
  ignore: [],
};

const SEVERITY_RANK: Record<string, number> = { info: 0, warning: 1, error: 2 };

export function isActionable(f: Finding): boolean {
  return f.state === 'FAIL' || f.state === 'WARN';
}

export function getExitCode(result: AuditResult, failOn?: string): number {
  if (!failOn) return 0;
  const threshold = SEVERITY_RANK[failOn];
  if (threshold === undefined) return 0;
  return result.findings.some((f) => {
    const rank = SEVERITY_RANK[f.severity ?? ''];
    return rank !== undefined && rank >= threshold;
  }) ? 1 : 0;
}

export function loadConfig(configPath: string | undefined, repoRoot: string): ConfigLoadResult {
  const resolvedRoot = resolve(repoRoot);
  const rcPath = configPath ? resolve(resolvedRoot, configPath) : resolve(resolvedRoot, '.agentsauditrc');

  if (configPath && !rcPath.startsWith(resolvedRoot + sep)) {
    return { config: { ...DEFAULT_CLI_CONFIG }, warning: 'Config path must be within the repo root.' };
  }

  if (!existsSync(rcPath)) {
    return { config: { ...DEFAULT_CLI_CONFIG } };
  }

  try {
    const raw = JSON.parse(readFileSync(rcPath, 'utf8')) as Partial<AuditConfig>;
    const safeRaw = sanitizeConfig(raw);
    return { config: { ...DEFAULT_CLI_CONFIG, ...safeRaw } };
  } catch {
    return {
      config: { ...DEFAULT_CLI_CONFIG },
      warning: 'Ignoring invalid config file: could not parse JSON.',
    };
  }
}

function sanitizeConfig(raw: Partial<AuditConfig>): Partial<AuditConfig> {
  const safe = { ...raw };
  if (safe.ignore !== undefined && !Array.isArray(safe.ignore)) {
    delete safe.ignore;
  }
  if (safe.reportDir !== undefined && typeof safe.reportDir !== 'string') {
    delete safe.reportDir;
  }
  if (safe.stalenessThresholdDays !== undefined && !Number.isFinite(safe.stalenessThresholdDays)) {
    delete safe.stalenessThresholdDays;
  }
  if (safe.highActivityCommitCount !== undefined && !Number.isFinite(safe.highActivityCommitCount)) {
    delete safe.highActivityCommitCount;
  }
  return safe;
}
