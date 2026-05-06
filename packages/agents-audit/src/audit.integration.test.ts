import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runAudit } from './audit.js';

describe('audit integration', () => {
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
});
