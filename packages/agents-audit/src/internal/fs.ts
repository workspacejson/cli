import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function findAgentsMdPath(repoRoot: string): Promise<string> {
  const rootPath = resolve(repoRoot, 'AGENTS.md');
  if (existsSync(rootPath)) {
    return rootPath;
  }

  try {
    const entries = await readdir(repoRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const candidate = resolve(repoRoot, entry.name, 'AGENTS.md');
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  } catch {
    // fall through to root path
  }

  return rootPath;
}

export async function readTextOrEmpty(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}
