import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { startInteractiveNavigation } from './navigator.js';
import type { Finding } from '@workspacejson/rules';

function makeFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    ruleId: 'rule-one',
    ruleVersion: '1.0.0',
    state: 'FAIL',
    severity: 'error',
    confidence: 1,
    signals: [],
    temporalWeight: 1,
    evidence: {},
    message: 'test finding',
    firedAt: new Date('2026-05-06T00:00:00.000Z'),
    ...overrides,
  };
}

describe('navigator', () => {
  it('no-ops when there are no findings', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    await expect(startInteractiveNavigation([])).resolves.toBeUndefined();

    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('no-ops when stdin is not a TTY', async () => {
    const stdin = new EventEmitter() as EventEmitter & {
      isTTY: boolean;
      setRawMode: (value: boolean) => void;
      resume: () => void;
      pause: () => void;
      removeAllListeners: (...args: never[]) => EventEmitter;
    };
    stdin.isTTY = false;
    stdin.setRawMode = vi.fn();
    stdin.resume = vi.fn();
    stdin.pause = vi.fn();
    stdin.removeAllListeners = vi.fn();

    const stdinSpy = vi.spyOn(process, 'stdin', 'get').mockReturnValue(stdin as never);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    await expect(startInteractiveNavigation([makeFinding()])).resolves.toBeUndefined();

    expect(log).not.toHaveBeenCalled();
    expect(stdin.setRawMode).not.toHaveBeenCalled();
    stdinSpy.mockRestore();
    log.mockRestore();
  });

  it('tears down cleanly on q and tolerates missing evidence fields', async () => {
    const stdin = new EventEmitter() as EventEmitter & {
      isTTY: boolean;
      setRawMode: (value: boolean) => void;
      resume: () => void;
      pause: () => void;
      removeAllListeners: (...args: never[]) => EventEmitter;
    };
    stdin.isTTY = true;
    stdin.setRawMode = vi.fn();
    stdin.resume = vi.fn();
    stdin.pause = vi.fn();
    stdin.removeAllListeners = vi.fn();

    const stdinSpy = vi.spyOn(process, 'stdin', 'get').mockReturnValue(stdin as never);
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});

    const navigation = startInteractiveNavigation([makeFinding({ evidence: {} })]);
    stdin.emit('keypress', '', { name: 'q' });

    await expect(navigation).resolves.toBeUndefined();

    expect(stdin.setRawMode).toHaveBeenCalledWith(true);
    expect(stdin.pause).toHaveBeenCalled();
    expect(stdin.removeAllListeners).toHaveBeenCalledWith('keypress');

    stdinSpy.mockRestore();
    stdoutSpy.mockRestore();
    log.mockRestore();
  });
});
