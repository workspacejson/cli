/** REQ-001 extraction, REQ-002 computed empty tree. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { GitOutputError, emptyTreeObject, extractEvents, parseNameStatusZ } from './git.js';
import { commit, makeCoupledRepo, removeDir, writeAndAdd, git } from './testing/fixtures.js';

const srcDir = dirname(fileURLToPath(import.meta.url));
const created: string[] = [];
function fixture(make: () => string): string {
  const root = make();
  created.push(root);
  return root;
}
afterAll(() => created.forEach(removeDir));

describe('parseNameStatusZ', () => {
  it('reads single-path statuses', () => {
    expect(parseNameStatusZ('M\0src/a.ts\0A\0src/b.ts\0')).toEqual(['src/a.ts', 'src/b.ts']);
  });

  it('reads a rename as two paths — both were touched', () => {
    expect(parseNameStatusZ('R100\0src/old.ts\0src/new.ts\0')).toEqual([
      'src/new.ts',
      'src/old.ts',
    ]);
  });

  it('normalizes through the single normalizer', () => {
    expect(parseNameStatusZ('M\0./src/a.ts\0')).toEqual(['src/a.ts']);
  });

  it('survives paths that would break a line-based parser', () => {
    // A newline in a path is the exact case `-z` exists for.
    expect(parseNameStatusZ('M\0src/we\nird.ts\0')).toEqual(['src/we\nird.ts']);
  });

  it('deduplicates within one event', () => {
    expect(parseNameStatusZ('M\0src/a.ts\0M\0src/a.ts\0')).toEqual(['src/a.ts']);
  });

  it('raises rather than guessing when the stream goes out of phase', () => {
    expect(() => parseNameStatusZ('src/a.ts\0src/b.ts\0')).toThrow(GitOutputError);
    expect(() => parseNameStatusZ('R100\0src/old.ts\0')).toThrow(GitOutputError);
  });
});

describe('REQ-002 — empty tree is computed, never hardcoded', () => {
  it('asks git for the repository object format', async () => {
    const root = fixture(makeCoupledRepo);
    const computed = await emptyTreeObject(root);
    const fromGit = git(root, ['hash-object', '-t', 'tree', '/dev/null']).trim();
    expect(computed).toBe(fromGit);
  });

  it('contains no hardcoded SHA-1 empty-tree literal anywhere in the package', () => {
    // The forbidden literal is assembled here rather than written, so this
    // assertion does not itself become the grep hit it is testing for.
    const forbidden = ['4b825dc6', '42cb6eb9', 'a060e54b', 'f8d69288', 'fbee4904'].join('');
    const offenders: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (full.endsWith('.ts') && readFileSync(full, 'utf8').includes(forbidden)) {
          offenders.push(full.slice(srcDir.length + 1));
        }
      }
    };
    walk(srcDir);
    expect(offenders).toEqual([]);
  });
});

describe('REQ-001 — first-parent extraction', () => {
  it('extracts one event per first-parent transition, oldest first', async () => {
    const root = fixture(makeCoupledRepo);
    const events = await extractEvents(root, { basisRevision: 'HEAD', windowTransitions: 500 });

    // makeCoupledRepo: initial, round 1, round 2, docs.
    expect(events).toHaveLength(4);
    expect(events.map((e) => e.position)).toEqual([0, 1, 2, 3]);
  });

  it('includes the root commit, whose parent is the empty tree', async () => {
    const root = fixture(makeCoupledRepo);
    const events = await extractEvents(root, { basisRevision: 'HEAD', windowTransitions: 500 });
    const rootEvent = events[0]!;

    expect(rootEvent.parent).toBe(await emptyTreeObject(root));
    // Three files created in the initial commit.
    expect(rootEvent.files).toEqual(['README.md', 'src/build.ts', 'src/parse.ts']);
    expect(rootEvent.fileCount).toBe(3);
  });

  it('matches a hand-computed file-set expectation for every event', async () => {
    const root = fixture(makeCoupledRepo);
    const events = await extractEvents(root, { basisRevision: 'HEAD', windowTransitions: 500 });

    expect(events.map((e) => [...e.files])).toEqual([
      ['README.md', 'src/build.ts', 'src/parse.ts'],
      ['src/build.ts', 'src/parse.ts'],
      ['src/build.ts', 'src/parse.ts'],
      ['README.md'],
    ]);
  });

  it('takes the window from the newest end', async () => {
    const root = fixture(makeCoupledRepo);
    const events = await extractEvents(root, { basisRevision: 'HEAD', windowTransitions: 2 });

    expect(events).toHaveLength(2);
    // The two most recent transitions: "round 2" then "docs".
    expect(events.map((e) => [...e.files])).toEqual([['src/build.ts', 'src/parse.ts'], ['README.md']]);
    expect(events.map((e) => e.position)).toEqual([0, 1]);
  });

  it('records both paths of a rename', async () => {
    const root = fixture(makeCoupledRepo);
    git(root, ['mv', 'src/parse.ts', 'src/parser.ts']);
    commit(root, 'rename parse to parser');

    const events = await extractEvents(root, { basisRevision: 'HEAD', windowTransitions: 1 });
    expect(events[0]!.files).toEqual(['src/parse.ts', 'src/parser.ts']);
  });

  it('does not filter large events — exclusion is Phase 3 and must stay countable', async () => {
    const root = fixture(makeCoupledRepo);
    for (let i = 0; i < 60; i += 1) writeAndAdd(root, `bulk/f${i}.ts`, `export const n = ${i};\n`);
    commit(root, 'bulk add');

    const events = await extractEvents(root, { basisRevision: 'HEAD', windowTransitions: 1 });
    expect(events[0]!.fileCount).toBe(60);
  });
});
