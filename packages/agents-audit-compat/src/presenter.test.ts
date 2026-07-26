import { describe, expect, it, vi } from 'vitest';
import { renderScoreCard, renderVrekoUpsell, renderMissingArtifactNotice } from './presenter.js';

function normalize(output: string): string {
  return output.replace(/\u001b\[[0-9;]*m/g, '').replace(/[╭╮╰╯│─]/g, ' ').replace(/\s+/g, ' ').trim();
}

describe('presenter', () => {
  it('keeps the score card free of Vreko branding', () => {
    const calls: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      calls.push(args.map((value) => String(value)).join(' '));
    };

    try {
      renderScoreCard(
        {
          agentsMdPath: '/repo/AGENTS.md',
          findings: [],
          score: { value: 100, grade: 'A', breakdown: { failCount: 0, warnCount: 0, insufficientDataCount: 0, skipCount: 0, previewCount: 0 }, coverageRatio: 0 },
          workspaceJsonFound: false,
          workspaceJsonStale: true,
          workspaceJsonStatus: 'missing',
          workspaceJsonErrors: [],
          runAt: new Date('2026-05-06T00:00:00.000Z'),
          durationMs: 12,
        },
        '0.1.1',
      );
    } finally {
      console.log = originalLog;
    }

    const output = calls.join('\n');
    expect(normalize(output).includes('vreko')).toBe(false);
    expect(output).toContain('agents-audit');
    expect(output).toContain('100/100 (A)');
  });

  it('renders the locked missing-workspace copy', () => {
    const calls: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      calls.push(args.map((value) => String(value)).join(' '));
    };

    try {
      renderVrekoUpsell(false, 'missing', []);
    } finally {
      console.log = originalLog;
    }

    const output = calls.join('\n');
    const normalized = normalize(output);

    expect(normalized).toContain('workspace.json not found.');
    expect(normalized).toContain('Vreko generates it automatically from real codebase structure and activity');
    expect(normalized).toContain('unlocking richer audit findings.');
  });

  it('renders workspace validation issues for invalid metadata', () => {
    const calls: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      calls.push(args.map((value) => String(value)).join(' '));
    };

    try {
      renderVrekoUpsell(true, 'invalid', ['/. must have required property version']);
    } finally {
      console.log = originalLog;
    }

    const output = calls.join('\n');
    const normalized = normalize(output);

    expect(normalized).toContain('workspace.json validation issues:');
    expect(normalized).toContain('must have required property version');
  });
});

describe('renderMissingArtifactNotice', () => {
  it('names the producer command instead of promoting a vendor', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    renderMissingArtifactNotice(false, 'missing', []);

    const output = ((logSpy as unknown as { mock: { calls: unknown[][] } }).mock.calls).flat().join(' ');
    expect(output).toContain('agents-audit generate');
    expect(output).toContain('workspace.json');
    // META-236: the neutral producer must not advertise one implementation.
    expect(output).not.toContain('vreko');
    expect(output).not.toContain('Vreko');
    logSpy.mockRestore();
  });

  it('still surfaces validation errors for an invalid artifact', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    renderMissingArtifactNotice(true, 'invalid', ['/. must have required property version']);

    const output = ((logSpy as unknown as { mock: { calls: unknown[][] } }).mock.calls).flat().join(' ');
    expect(output).toContain('must have required property version');
    logSpy.mockRestore();
  });
});
