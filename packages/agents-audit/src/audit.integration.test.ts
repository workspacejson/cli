import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runAudit } from './audit.js';

describe('audit integration', () => {
  it('handles a missing AGENTS.md without throwing', async () => {
    const repoRoot = resolve(process.cwd(), `.tmp-audit-${Date.now()}`);
    await mkdir(repoRoot, { recursive: true });

    const result = await runAudit(repoRoot);

    expect(result.agentsMdPath).toBe(resolve(repoRoot, 'AGENTS.md'));
    expect(result.workspaceJsonFound).toBe(false);
    expect(result.workspaceJsonStatus).toBe('missing');
    expect(result.workspaceJsonStale).toBe(true);
  });

  it('surfaces invalid workspace metadata with a clear status', async () => {
    const repoRoot = resolve(process.cwd(), `.tmp-audit-${Date.now()}`);
    await mkdir(resolve(repoRoot, '.agents'), { recursive: true });
    await writeFile(resolve(repoRoot, 'AGENTS.md'), '# Temp\n\nUse `src/` for source code.\n', 'utf8');
    await writeFile(resolve(repoRoot, 'src.ts'), 'export const value = 1;\n', 'utf8');
    await writeFile(resolve(repoRoot, '.agents/agents.workspace.json'), '{ invalid json', 'utf8');

    const result = await runAudit(repoRoot);

    expect(result.workspaceJsonFound).toBe(true);
    expect(result.workspaceJsonStatus).toBe('invalid');
    expect(result.workspaceJsonErrors.length).toBeGreaterThan(0);
  });

  it('surfaces schema validation errors separately from parse errors', async () => {
    const repoRoot = resolve(process.cwd(), `.tmp-audit-${Date.now()}`);
    await mkdir(resolve(repoRoot, '.agents'), { recursive: true });
    await writeFile(resolve(repoRoot, 'AGENTS.md'), '# Temp\n\nUse `src/` for source code.\n', 'utf8');
    await writeFile(resolve(repoRoot, '.agents/agents.workspace.json'), JSON.stringify({ generatedAt: 'not-a-date' }), 'utf8');

    const result = await runAudit(repoRoot);

    expect(result.workspaceJsonFound).toBe(true);
    expect(result.workspaceJsonStatus).toBe('invalid');
    expect(result.workspaceJsonErrors.some((error) => error.includes('version'))).toBe(true);
  });

  it('treats workspace metadata newer than AGENTS.md as fresh', async () => {
    const repoRoot = resolve(process.cwd(), `.tmp-audit-${Date.now()}`);
    await mkdir(resolve(repoRoot, '.agents'), { recursive: true });
    await writeFile(resolve(repoRoot, 'AGENTS.md'), '# Temp\n\nUse `src/` for source code.\n', 'utf8');
    await writeFile(resolve(repoRoot, '.agents/agents.workspace.json'), JSON.stringify({
      version: '1',
      generatedAt: new Date(Date.now() + 60_000).toISOString(),
      repository: 'https://example.com/repo',
      packages: [{ path: 'packages/app' }],
    }), 'utf8');

    const result = await runAudit(repoRoot);

    expect(result.workspaceJsonFound).toBe(true);
    expect(result.workspaceJsonStatus).toBe('fresh');
    expect(result.workspaceJsonStale).toBe(false);
    expect(result.workspaceJson).toBeDefined();
  });

  it('marks workspace metadata older than AGENTS.md as stale', async () => {
    const repoRoot = resolve(process.cwd(), `.tmp-audit-${Date.now()}`);
    await mkdir(resolve(repoRoot, '.agents'), { recursive: true });
    await writeFile(resolve(repoRoot, '.agents/agents.workspace.json'), JSON.stringify({
      version: '1',
      generatedAt: new Date(Date.now() - 60_000).toISOString(),
      repository: 'https://example.com/repo',
      packages: [{ path: 'packages/app' }],
    }), 'utf8');
    await writeFile(resolve(repoRoot, 'AGENTS.md'), '# Temp\n\nUse `src/` for source code.\n', 'utf8');

    const result = await runAudit(repoRoot);

    expect(result.workspaceJsonFound).toBe(true);
    expect(result.workspaceJsonStatus).toBe('stale');
    expect(result.workspaceJsonStale).toBe(true);
  });
});
