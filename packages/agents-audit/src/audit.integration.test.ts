import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runAudit } from './audit.js';

describe('audit integration', () => {
  const toClean: string[] = [];
  afterEach(async () => {
    await Promise.all(toClean.splice(0).map((d) => rm(d, { recursive: true, force: true })));
  });

  function tmpDir(): string {
    const dir = resolve(process.cwd(), `.tmp-audit-${Date.now()}`);
    toClean.push(dir);
    return dir;
  }

  it('handles a missing AGENTS.md without throwing', async () => {
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });

    const result = await runAudit(repoRoot);

    expect(result.agentsMdPath).toBe(resolve(repoRoot, 'AGENTS.md'));
    expect(result.workspaceJsonFound).toBe(false);
    expect(result.workspaceJsonStatus).toBe('missing');
    expect(result.workspaceJsonStale).toBe(true);
  });

  it('surfaces invalid workspace metadata with a clear status', async () => {
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });
    await writeFile(resolve(repoRoot, 'AGENTS.md'), '# Temp\n\nUse `src/` for source code.\n', 'utf8');
    await writeFile(resolve(repoRoot, 'src.ts'), 'export const value = 1;\n', 'utf8');
    await writeFile(resolve(repoRoot, 'agents.workspace.json'), '{ invalid json', 'utf8');

    const result = await runAudit(repoRoot);

    expect(result.workspaceJsonFound).toBe(true);
    expect(result.workspaceJsonStatus).toBe('invalid');
    expect(result.workspaceJsonErrors.length).toBeGreaterThan(0);
  });

  it('surfaces schema validation errors separately from parse errors', async () => {
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });
    await writeFile(resolve(repoRoot, 'AGENTS.md'), '# Temp\n\nUse `src/` for source code.\n', 'utf8');
    await writeFile(resolve(repoRoot, 'agents.workspace.json'), JSON.stringify({
      version: '1',
      generatedAt: 'not-a-date',
      packages: [{ path: 'packages/app' }],
    }), 'utf8');

    const result = await runAudit(repoRoot);

    expect(result.workspaceJsonFound).toBe(true);
    expect(result.workspaceJsonStatus).toBe('invalid');
    expect(result.workspaceJsonErrors.some((error) => error.includes('date-time'))).toBe(true);
  });

  it('treats workspace metadata newer than AGENTS.md as fresh', async () => {
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });
    await writeFile(resolve(repoRoot, 'AGENTS.md'), '# Temp\n\nUse `src/` for source code.\n', 'utf8');
    await writeFile(resolve(repoRoot, 'agents.workspace.json'), JSON.stringify({
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
    const repoRoot = tmpDir();
    await mkdir(repoRoot, { recursive: true });
    await writeFile(resolve(repoRoot, 'agents.workspace.json'), JSON.stringify({
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
