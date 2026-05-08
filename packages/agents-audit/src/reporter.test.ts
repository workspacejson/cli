import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it, afterEach } from 'vitest';
import { saveReport } from './reporter.js';
import type { AuditResult } from '@workspacejson/rules';

describe('reporter', () => {
  const toClean: string[] = [];

  afterEach(async () => {
    await Promise.all(toClean.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  async function tmpRepo(): Promise<string> {
    const dir = await mkdtemp(join(tmpdir(), 'agents-audit-report-'));
    toClean.push(dir);
    return dir;
  }

  function makeResult(): AuditResult {
    return {
      findings: [
        {
          ruleId: 'rule-one',
          ruleVersion: '1.0.0',
          state: 'FAIL',
          severity: 'error',
          confidence: 1,
          signals: [],
          temporalWeight: 1,
          evidence: { file: 'packages/app/src/index.ts|example' },
          message: 'contains | pipe',
          firedAt: new Date('2026-05-06T00:00:00.000Z'),
        },
      ],
      score: {
        value: 91,
        grade: 'B',
        breakdown: {
          failCount: 1,
          warnCount: 0,
          insufficientDataCount: 0,
          skipCount: 0,
          previewCount: 0,
        },
        coverageRatio: 0.5,
      },
      agentsMdPath: '/repo/AGENTS.md',
      workspaceJsonFound: false,
      workspaceJsonStale: true,
      workspaceJsonStatus: 'missing',
      workspaceJsonErrors: [],
      runAt: new Date('2026-05-06T12:34:56.789Z'),
      durationMs: 42,
    };
  }

  it('creates a timestamped report in the configured directory', async () => {
    const repoRoot = await tmpRepo();
    const reportDir = '.audit-history';
    const outputPath = await saveReport(makeResult(), repoRoot, reportDir);

    expect(outputPath.startsWith(resolve(repoRoot, reportDir))).toBe(true);
    expect(outputPath).toContain('agents-audit-2026-05-06T12-34-56-789Z.md');

    const content = await readFile(outputPath, 'utf8');
    expect(content).toContain('# agents-audit report');
    expect(content).toContain('- Score: 91/100 (B)');
    expect(content).toContain('contains \\| pipe');
    expect(content).toContain('packages/app/src/index.ts\\|example');
  });

  it('emits a filename-safe timestamp', async () => {
    const repoRoot = await tmpRepo();
    const outputPath = await saveReport(makeResult(), repoRoot, '.agents/audit-history');
    const fileName = outputPath.split('/').pop() ?? '';

    expect(fileName).toMatch(/^agents-audit-2026-05-06T12-34-56-789Z\.md$/);
    expect(fileName.includes(':')).toBe(false);
    expect(fileName.includes('.789')).toBe(false);
  });

  it('throws when reportDir points outside the repo root', async () => {
    const repoRoot = await tmpRepo();
    await expect(saveReport(makeResult(), repoRoot, '../../etc')).rejects.toThrow(
      'reportDir must be within the repo root',
    );
  });

  it('filters PASS and SKIP findings from the saved report', async () => {
    const repoRoot = await tmpRepo();
    const result = makeResult();
    result.findings = [
      { ...result.findings[0]!, state: 'FAIL', severity: 'error' },
      { ...result.findings[0]!, state: 'PASS', severity: undefined, ruleId: 'rule-pass' },
      { ...result.findings[0]!, state: 'SKIP', severity: undefined, ruleId: 'rule-skip' },
    ];

    const outputPath = await saveReport(result, repoRoot, '.audit-history');
    const content = await readFile(outputPath, 'utf8');

    expect(content).toContain('rule-one');
    expect(content).not.toContain('rule-pass');
    expect(content).not.toContain('rule-skip');
    expect(content).toContain('- Issues: 1');
  });

  it('writes "No issues found" when all findings are PASS', async () => {
    const repoRoot = await tmpRepo();
    const result = makeResult();
    result.findings = [
      { ...result.findings[0]!, state: 'PASS', severity: undefined, ruleId: 'rule-pass' },
    ];

    const outputPath = await saveReport(result, repoRoot, '.audit-history');
    const content = await readFile(outputPath, 'utf8');

    expect(content).toContain('_No issues found._');
    expect(content).toContain('- Issues: 0');
  });
});
