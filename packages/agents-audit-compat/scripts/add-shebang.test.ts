import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { addShebang, NODE_SHEBANG } from './add-shebang.js';

describe('addShebang', () => {
  it('prepends a Node shebang exactly once', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'agents-audit-shebang-'));
    const file = join(dir, 'cli.js');

    await writeFile(file, 'console.log("hello");\n', 'utf8');
    await addShebang(file);
    await addShebang(file);

    const output = await readFile(file, 'utf8');
    expect(output.startsWith(NODE_SHEBANG)).toBe(true);
    expect(output.match(/^#!/gm)?.length).toBe(1);
    expect(output).toContain('console.log("hello");');
  });
});
