import { describe, expect, it, vi } from 'vitest';
import { runCli } from './cli.js';

// Regression cover for the 0.5.0 defect: `.exitOverride()` makes commander throw
// on its *success* paths too — `--help` and `--version` raise a CommanderError
// carrying `exitCode: 0`. The handler read that with `Number(...) || 1`, so the
// legitimate zero became 1 and `workspacejson --help` reported failure to every
// shell and CI job that checked it. These assert the exit code, not the output,
// because the output was always correct — only the status was wrong.
const ARGV = (...args: string[]) => ['node', 'workspacejson', ...args];

describe('runCli exit codes', () => {
  it('exits 0 for --help', async () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    try {
      await expect(runCli(ARGV('--help'))).resolves.toBe(0);
    } finally {
      stdout.mockRestore();
    }
  });

  it('exits 0 for --version', async () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    try {
      await expect(runCli(ARGV('--version'))).resolves.toBe(0);
    } finally {
      stdout.mockRestore();
    }
  });

  it('exits 0 for the version subcommand', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      await expect(runCli(ARGV('version'))).resolves.toBe(0);
    } finally {
      log.mockRestore();
    }
  });

  // The fix must not turn every failure into a success: an unparseable option
  // still has to report non-zero.
  it('exits non-zero for an unknown option', async () => {
    const stderr = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
    try {
      await expect(runCli(ARGV('--no-such-flag'))).resolves.not.toBe(0);
    } finally {
      stderr.mockRestore();
    }
  });
});
