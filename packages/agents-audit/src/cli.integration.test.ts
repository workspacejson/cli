import { resolve } from 'node:path';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { AuditResult } from '@workspacejson/rules';

const mocks = vi.hoisted(() => ({
  runAudit: vi.fn(),
  saveReport: vi.fn(),
  startInteractiveNavigation: vi.fn(),
  renderFindingsTable: vi.fn(),
  renderScoreCard: vi.fn(),
  renderVrekoUpsell: vi.fn(),
  generateWorkspaceJson: vi.fn(),
  ora: vi.fn(() => ({
    start: () => ({ stop: vi.fn() }),
  })),
}));

vi.mock('./audit.js', () => ({ runAudit: mocks.runAudit }));
vi.mock('./reporter.js', () => ({ saveReport: mocks.saveReport }));
vi.mock('./navigator.js', () => ({ startInteractiveNavigation: mocks.startInteractiveNavigation }));
vi.mock('./presenter.js', () => ({
  renderFindingsTable: mocks.renderFindingsTable,
  renderScoreCard: mocks.renderScoreCard,
  renderVrekoUpsell: mocks.renderVrekoUpsell,
}));
vi.mock('./generate.js', () => ({ generateWorkspaceJson: mocks.generateWorkspaceJson }));
vi.mock('ora', () => ({ default: mocks.ora }));

import { runCli } from './cli.js';

function makeResult(findings: AuditResult['findings'] = []): AuditResult {
  const hasFail = findings.some((finding) => finding.state === 'FAIL');
  const hasWarn = findings.some((finding) => finding.state === 'WARN');
  const scoreValue = hasFail ? 70 : hasWarn ? 85 : 100;
  return {
    findings,
    score: {
      value: scoreValue,
      grade: scoreValue >= 95 ? 'A' : scoreValue >= 80 ? 'B' : scoreValue >= 65 ? 'C' : scoreValue >= 50 ? 'D' : 'F',
      breakdown: {
        failCount: findings.filter((finding) => finding.state === 'FAIL').length,
        warnCount: findings.filter((finding) => finding.state === 'WARN').length,
        insufficientDataCount: 0,
        skipCount: findings.filter((finding) => finding.state === 'SKIP').length,
        previewCount: findings.filter((finding) => finding.state === 'PREVIEW').length,
      },
      coverageRatio: 0.25,
    },
    agentsMdPath: '/repo/AGENTS.md',
    workspaceJsonFound: false,
    workspaceJsonStale: true,
    workspaceJsonStatus: 'missing',
    workspaceJsonErrors: [],
    runAt: new Date('2026-05-06T12:34:56.789Z'),
    durationMs: 12,
  };
}

describe('CLI integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.runAudit.mockResolvedValue(makeResult());
  });

  it('uses the positional scan path', async () => {
    const repoRoot = resolve(process.cwd(), '.tmp-cli-scan');

    const exitCode = await runCli(['node', 'agents-audit', 'scan', repoRoot, '--no-interactive']);

    expect(exitCode).toBe(0);
    expect(mocks.runAudit).toHaveBeenCalledWith(resolve(repoRoot), expect.any(Object));
  });

  it('treats --dir as an invalid option', async () => {
    const exitCode = await runCli(['node', 'agents-audit', 'scan', '--dir', '/tmp/example']);

    expect(exitCode).not.toBe(0);
    expect(mocks.runAudit).not.toHaveBeenCalled();
  });

  it.each([
    ['error', 1],
    ['warning', 1],
    ['info', 1],
  ])('returns expected exit code for --fail-on=%s', async (severity, expected) => {
    mocks.runAudit.mockResolvedValueOnce(
      makeResult([
        {
          ruleId: 'rule-one',
          ruleVersion: '1.0.0',
          state: 'FAIL',
          severity: 'error',
          confidence: 1,
          signals: [],
          temporalWeight: 1,
          evidence: {},
          message: 'failure',
          firedAt: new Date('2026-05-06T00:00:00.000Z'),
        },
        {
          ruleId: 'rule-two',
          ruleVersion: '1.0.0',
          state: 'WARN',
          severity: 'warning',
          confidence: 1,
          signals: [],
          temporalWeight: 1,
          evidence: {},
          message: 'warning',
          firedAt: new Date('2026-05-06T00:00:00.000Z'),
        },
      ]),
    );

    const exitCode = await runCli(['node', 'agents-audit', 'scan', '.', '--json', '--no-interactive', `--fail-on=${severity}`]);

    expect(exitCode).toBe(expected);
  });

  it('keeps JSON output stable for CI consumers', async () => {
    const logs: string[] = [];
    const logSpy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logs.push(args.map((value) => String(value)).join(' '));
    });

    mocks.runAudit.mockResolvedValueOnce(
      makeResult([
        {
          ruleId: 'preview-rule',
          ruleVersion: '1.0.0',
          state: 'PREVIEW',
          confidence: 1,
          signals: [],
          temporalWeight: 1,
          evidence: {},
          message: 'preview',
          firedAt: new Date('2026-05-06T00:00:00.000Z'),
        },
        {
          ruleId: 'skip-rule',
          ruleVersion: '1.0.0',
          state: 'SKIP',
          confidence: 1,
          signals: [],
          temporalWeight: 1,
          evidence: {},
          message: 'skip',
          firedAt: new Date('2026-05-06T00:00:00.000Z'),
        },
      ]),
    );

    const exitCode = await runCli(['node', 'agents-audit', 'scan', '.', '--json', '--no-interactive']);

    expect(exitCode).toBe(0);
    expect(mocks.renderScoreCard).not.toHaveBeenCalled();
    expect(mocks.renderFindingsTable).not.toHaveBeenCalled();
    expect(mocks.renderVrekoUpsell).not.toHaveBeenCalled();

    const parsed = JSON.parse(logs.find((line) => line.trim().startsWith('{')) ?? '{}') as Record<string, unknown>;
    expect(parsed.workspaceJsonStatus).toBe('missing');
    expect(parsed.findings).toHaveLength(2);
    expect(parsed.score).toMatchObject({ value: 100, grade: 'A' });
    logSpy.mockRestore();
  });

  it('rejects unknown flags instead of silently changing behavior', async () => {
    const exitCode = await runCli(['node', 'agents-audit', 'scan', '.', '--bogus']);

    expect(exitCode).not.toBe(0);
    expect(mocks.runAudit).not.toHaveBeenCalled();
  });
});
