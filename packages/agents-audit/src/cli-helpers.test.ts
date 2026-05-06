import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getExitCode, loadConfig } from './cli-helpers.js';

describe('cli helpers', () => {
  it('calculates fail-on exit codes correctly', () => {
    const base = {
      findings: [
        { severity: 'error', ruleId: 'a', message: 'x', evidence: {} },
        { severity: 'warning', ruleId: 'b', message: 'y', evidence: {} },
        { severity: 'info', ruleId: 'c', message: 'z', evidence: {} },
      ],
    } as never;

    expect(getExitCode(base)).toBe(0);
    expect(getExitCode(base, 'error')).toBe(1);
    expect(getExitCode(base, 'warning')).toBe(1);
    expect(getExitCode(base, 'info')).toBe(1);
    expect(getExitCode({ findings: [] } as never, 'error')).toBe(0);
    expect(getExitCode({ findings: [] } as never, 'warning')).toBe(0);
    expect(getExitCode({ findings: [] } as never, 'info')).toBe(0);
    expect(getExitCode(base, 'unexpected')).toBe(0);
  });

  it('loads defaults when config is missing', async () => {
    const repoRoot = resolve(process.cwd(), `.tmp-cli-config-${Date.now()}`);
    const result = loadConfig(undefined, repoRoot);

    expect(result.config.stalenessThresholdDays).toBe(60);
    expect(result.config.highActivityCommitCount).toBe(20);
    expect(result.warning).toBe(undefined);
  });

  it('resolves relative config paths from the repository root', async () => {
    const repoRoot = resolve(process.cwd(), `.tmp-cli-config-${Date.now()}`);
    const configDir = resolve(repoRoot, 'nested');
    const configPath = resolve(configDir, '.agentsauditrc');

    await mkdir(configDir, { recursive: true });
    await writeFile(configPath, JSON.stringify({ save: true, ignore: ['dist/**'] }), 'utf8');

    const result = loadConfig('nested/.agentsauditrc', repoRoot);
    expect(result.config.save).toBe(true);
    expect(result.config.ignore.length).toBe(1);
    expect(result.config.ignore[0]).toBe('dist/**');
    expect(result.warning).toBe(undefined);
  });

  it('warns and falls back on malformed config', async () => {
    const repoRoot = resolve(process.cwd(), `.tmp-cli-config-${Date.now()}`);
    const configDir = resolve(repoRoot, 'nested');
    const configPath = resolve(configDir, '.agentsauditrc');

    await mkdir(configDir, { recursive: true });
    await writeFile(configPath, '{ this is not valid json', 'utf8');

    const result = loadConfig('nested/.agentsauditrc', repoRoot);
    expect(result.config.stalenessThresholdDays).toBe(60);
    expect(result.warning).toContain('Ignoring invalid config file');
  });
});
