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
  renderMissingArtifactNotice: vi.fn(),
  runGenerate: vi.fn(),
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
  renderMissingArtifactNotice: mocks.renderMissingArtifactNotice,
}));
vi.mock('@workspacejson/cli', () => ({ runGenerate: mocks.runGenerate }));
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

  // META-247: `generate` output behavior moved to @workspacejson/cli along with
  // its implementation, and is tested there (src/commands/generate.test.ts).
  // What this package is still responsible for is delegating correctly — with
  // its own historical command name and provenance stamp — so the tests here
  // assert the contract at that seam. End-to-end proof that the observable
  // behavior is unchanged is the META-240 parity harness, which runs real
  // packed candidates rather than mocks.
  it('delegates generate to the neutral producer with the historical identity', async () => {
    mocks.runGenerate.mockResolvedValueOnce(0);

    const exitCode = await runCli(['node', 'agents-audit', 'generate', '/repo', '--check']);

    expect(exitCode).toBe(0);
    const calls = (mocks.runGenerate as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    expect(calls[0]?.[0]).toBe('/repo');
    expect(calls[0]?.[1]).toMatchObject({ check: true });
    expect(calls[0]?.[2]).toMatchObject({
      commandName: 'agents-audit',
      producer: { name: 'agents-audit' },
    });
  });

  it('propagates the generate exit code unchanged', async () => {
    mocks.runGenerate.mockResolvedValueOnce(1);

    const exitCode = await runCli(['node', 'agents-audit', 'generate', '/repo', '--check']);

    expect(exitCode).toBe(1);
  });

  it('forwards --dry-run and --force through to the producer', async () => {
    mocks.runGenerate.mockResolvedValueOnce(0);

    await runCli(['node', 'agents-audit', 'generate', '/repo', '--dry-run', '--force']);

    const calls = (mocks.runGenerate as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    expect(calls[0]?.[1]).toMatchObject({ dryRun: true, force: true });
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
    expect(mocks.renderMissingArtifactNotice).not.toHaveBeenCalled();
    // The vendor upsell is never called by the CLI any more (META-236).
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
