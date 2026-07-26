import { describe, expect, it, beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generateWorkspaceJson: vi.fn(),
  ora: vi.fn(() => ({
    start: () => ({ stop: vi.fn() }),
  })),
}));

vi.mock('../producer/generate.js', () => ({ generateWorkspaceJson: mocks.generateWorkspaceJson }));
vi.mock('ora', () => ({ default: mocks.ora }));

import { runGenerate } from './generate.js';
import { DEFAULT_PRODUCER_CONFIG } from '../producer/config.js';

/**
 * Output behavior of the `generate` command.
 *
 * These cases moved here from `agents-audit`'s CLI integration suite in
 * META-247, because the implementation moved. They are parameterized by
 * `commandName` so the same assertions cover both binaries — which is the point
 * of routing both through one implementation.
 *
 * End-to-end proof that `agents-audit generate` still behaves identically lives
 * in the META-240 parity harness, which runs real packed candidates.
 */
describe('runGenerate', () => {
  const context = (commandName: string) => ({
    config: DEFAULT_PRODUCER_CONFIG,
    commandName,
    ...(commandName === 'agents-audit'
      ? { producer: { name: 'agents-audit', version: '0.4.4' } }
      : {}),
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses --check as a non-writing drift gate', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.generateWorkspaceJson.mockResolvedValueOnce({
      path: '/repo/.agents/workspace.json',
      written: false,
      skipped: false,
      drift: true,
      preservedManual: true,
      content: {},
    });

    const exitCode = await runGenerate('/repo', { check: true }, context('agents-audit'));

    expect(exitCode).toBe(1);
    const generateCalls = (mocks.generateWorkspaceJson as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    expect(generateCalls[0]?.[0]).toBe('/repo');
    expect(generateCalls[0]?.[2]).toMatchObject({ check: true, dryRun: false, force: false });
    const errorCalls = (errorSpy as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    expect(errorCalls.flat().join(' ')).toContain('manual evidence is untouched');
    errorSpy.mockRestore();
  });

  it('reports a current generated projection without writing', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mocks.generateWorkspaceJson.mockResolvedValueOnce({
      path: '/repo/.agents/workspace.json',
      written: false,
      skipped: true,
      drift: false,
      preservedManual: true,
      content: {},
    });

    const exitCode = await runGenerate('/repo', { check: true }, context('agents-audit'));

    expect(exitCode).toBe(0);
    expect(logSpy).toHaveBeenCalledWith('Generated sections are current at /repo/.agents/workspace.json');
    logSpy.mockRestore();
  });

  it('still fails the drift gate when --check is combined with --dry-run', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mocks.generateWorkspaceJson.mockResolvedValueOnce({
      path: '/repo/.agents/workspace.json',
      written: false,
      skipped: false,
      drift: true,
      preservedManual: true,
      content: { staged: true },
    });

    const exitCode = await runGenerate('/repo', { check: true, dryRun: true }, context('agents-audit'));

    expect(exitCode).toBe(1);
    const errorCalls = (errorSpy as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    expect(errorCalls.flat().join(' ')).toContain('manual evidence is untouched');
    expect(logSpy).toHaveBeenCalledWith(JSON.stringify({ staged: true }, null, 2));
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });

  it('surfaces the relocated invalid file when --force recovers a fresh generate', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    mocks.generateWorkspaceJson.mockResolvedValueOnce({
      path: '/repo/.agents/workspace.json',
      written: true,
      skipped: false,
      drift: true,
      preservedManual: false,
      invalidFileMoved: '/repo/.agents/workspace.json.invalid.2026-01-01T00-00-00-000Z',
      content: {},
    });

    const exitCode = await runGenerate('/repo', { force: true }, context('agents-audit'));

    expect(exitCode).toBe(0);
    const logCalls = (logSpy as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    const logs = logCalls.flat().join(' ');
    expect(logs).toContain('Generated /repo/.agents/workspace.json');
    expect(logs).toContain('/repo/.agents/workspace.json.invalid.2026-01-01T00-00-00-000Z');
    logSpy.mockRestore();
  });

  it('names the invoking command in the drift remediation hint', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.generateWorkspaceJson.mockResolvedValue({
      path: '/repo/.agents/workspace.json',
      written: false,
      skipped: false,
      drift: true,
      preservedManual: true,
      content: {},
    });

    await runGenerate('/repo', { check: true }, context('agents-audit'));
    expect(((errorSpy as unknown as { mock: { calls: unknown[][] } }).mock.calls).flat().join(' '))
      .toContain('Run: agents-audit generate /repo');

    errorSpy.mockClear();

    await runGenerate('/repo', { check: true }, context('workspacejson'));
    expect(((errorSpy as unknown as { mock: { calls: unknown[][] } }).mock.calls).flat().join(' '))
      .toContain('Run: workspacejson generate /repo');

    errorSpy.mockRestore();
  });

  it('passes the caller producer identity through to the generator', async () => {
    mocks.generateWorkspaceJson.mockResolvedValueOnce({
      path: '/repo/.agents/workspace.json',
      written: true,
      skipped: false,
      drift: true,
      preservedManual: false,
      content: {},
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runGenerate('/repo', {}, context('agents-audit'));

    const generateCalls = (mocks.generateWorkspaceJson as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    expect(generateCalls[0]?.[2]).toMatchObject({
      commandName: 'agents-audit',
      producer: { name: 'agents-audit', version: '0.4.4' },
    });
    logSpy.mockRestore();
  });
});
