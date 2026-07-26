import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const NODE_SHEBANG = '#!/usr/bin/env node\n';

export async function addShebang(target) {
  const current = await readFile(target, 'utf8');
  if (current.startsWith(NODE_SHEBANG)) return;
  await writeFile(target, `${NODE_SHEBANG}${current}`, 'utf8');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  const target = resolve(process.cwd(), 'dist/cli.js');

  addShebang(target).catch((error) => {
    console.error(`Failed to add Node shebang to ${target}:`, error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
