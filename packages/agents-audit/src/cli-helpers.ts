import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AuditConfig, AuditResult, Severity } from '@workspacejson/rules';

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

export function getExitCode(result: AuditResult, failOn?: string): number {
  if (!failOn) return 0;
  const severity = failOn as Severity;
  const hasMatchingFinding = result.findings.some((finding) => {
    if (severity === 'info') return true;
    if (severity === 'warning') return finding.severity === 'warning' || finding.severity === 'error';
    if (severity === 'error') return finding.severity === 'error';
    return false;
  });
  return hasMatchingFinding ? 1 : 0;
}

export function loadConfig(configPath: string | undefined, repoRoot: string): ConfigLoadResult {
  const rcPath = configPath ? resolve(repoRoot, configPath) : resolve(repoRoot, '.agentsauditrc');
  if (!existsSync(rcPath)) {
    return { config: { ...DEFAULT_CLI_CONFIG } };
  }

  try {
    const raw = JSON.parse(readFileSync(rcPath, 'utf8')) as Partial<AuditConfig>;
    return { config: { ...DEFAULT_CLI_CONFIG, ...raw } };
  } catch (error) {
    return {
      config: { ...DEFAULT_CLI_CONFIG },
      warning: `Ignoring invalid config file at ${rcPath}: ${error instanceof Error ? error.message : String(error)}.`,
    };
  }
}
