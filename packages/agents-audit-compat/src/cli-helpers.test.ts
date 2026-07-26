import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getExitCode, isActionable, loadConfig } from './cli-helpers.js';
import type { Finding } from '@workspacejson/rules';

describe('cli helpers', () => {
  const toClean: string[] = [];
  afterEach(async () => {
    await Promise.all(toClean.splice(0).map((d) => rm(d, { recursive: true, force: true })));
  });

  function tmpDir(): string {
    const dir = resolve(process.cwd(), `.tmp-cli-config-${Date.now()}`);
    toClean.push(dir);
    return dir;
  }

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
    const repoRoot = tmpDir();
    const result = loadConfig(undefined, repoRoot);

    expect(result.config.stalenessThresholdDays).toBe(60);
    expect(result.config.highActivityCommitCount).toBe(20);
    expect(result.warning).toBe(undefined);
  });

  it('resolves relative config paths from the repository root', async () => {
    const repoRoot = tmpDir();
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
    const repoRoot = tmpDir();
    const configDir = resolve(repoRoot, 'nested');
    const configPath = resolve(configDir, '.agentsauditrc');

    await mkdir(configDir, { recursive: true });
    await writeFile(configPath, '{ this is not valid json', 'utf8');

    const result = loadConfig('nested/.agentsauditrc', repoRoot);
    expect(result.config.stalenessThresholdDays).toBe(60);
    expect(result.warning).toContain('Ignoring invalid config file');
  });

  it('rejects --config path outside repo root', () => {
    const result = loadConfig('../../etc/passwd', '/tmp/repo');
    expect(result.warning).toContain('within the repo root');
    expect(result.config.stalenessThresholdDays).toBe(60);
  });

  it('sanitizes non-array ignore field', async () => {
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });
    await writeFile(resolve(repoRoot, '.agentsauditrc'), JSON.stringify({ ignore: 'dist/**' }), 'utf8');

    const result = loadConfig(undefined, repoRoot);
    expect(result.config.ignore).toEqual([]);
  });

  it('sanitizes non-finite numeric fields', async () => {
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });
    await writeFile(
      resolve(repoRoot, '.agentsauditrc'),
      JSON.stringify({ stalenessThresholdDays: Infinity, highActivityCommitCount: NaN }),
      'utf8',
    );

    const result = loadConfig(undefined, repoRoot);
    expect(result.config.stalenessThresholdDays).toBe(60);
    expect(result.config.highActivityCommitCount).toBe(20);
  });

  it('does not leak filesystem path in config warning', async () => {
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });
    await writeFile(resolve(repoRoot, '.agentsauditrc'), '{ bad json', 'utf8');

    const result = loadConfig(undefined, repoRoot);
    expect(result.warning).not.toContain(repoRoot);
  });
});

describe('isActionable', () => {
  function makeF(state: Finding['state']): Finding {
    return {
      ruleId: 'test',
      ruleVersion: '1.0.0',
      state,
      confidence: 1,
      signals: [],
      temporalWeight: 1,
      evidence: {},
      message: 'test',
      firedAt: new Date(),
    };
  }

  it('returns true for FAIL and WARN', () => {
    expect(isActionable(makeF('FAIL'))).toBe(true);
    expect(isActionable(makeF('WARN'))).toBe(true);
  });

  it('returns false for PASS, SKIP, INSUFFICIENT_DATA, PREVIEW', () => {
    expect(isActionable(makeF('PASS'))).toBe(false);
    expect(isActionable(makeF('SKIP'))).toBe(false);
    expect(isActionable(makeF('INSUFFICIENT_DATA'))).toBe(false);
    expect(isActionable(makeF('PREVIEW'))).toBe(false);
  });
});
