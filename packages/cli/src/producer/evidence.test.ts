import { describe, expect, it } from 'vitest';
import { buildFileIndex, buildFrameworkManifest } from './evidence.js';

/** `RepoState['manifests']` shape, narrowed to what the builder reads. */
function manifests(...dependencyLists: string[][]) {
  return dependencyLists.map((dependencies, i) => ({
    type: 'package.json' as const,
    path: `pkg-${i}/package.json`,
    dependencies,
  }));
}

describe('buildFileIndex', () => {
  it('keys every tracked file by repository-root-relative POSIX path', () => {
    expect(Object.keys(buildFileIndex(['src/a.ts', './src/b.ts', 'src\\c.ts']))).toEqual([
      'src/a.ts',
      'src/b.ts',
      'src/c.ts',
    ]);
  });

  it('orders keys deterministically, so the drift gate stays usable', () => {
    // Insertion order is what JSON.stringify writes, so an unsorted index would
    // churn the artifact bytes between runs even with identical input.
    const scrambled = ['z.ts', 'a.ts', 'M.ts', 'src/b.ts', '.github/workflows/ci.yml'];
    const keys = Object.keys(buildFileIndex(scrambled));
    expect(keys).toEqual([...keys].sort());
    expect(keys).toEqual(Object.keys(buildFileIndex([...scrambled].reverse())));
  });

  it('is byte-stable across repeated builds of the same input', () => {
    const files = ['src/b.ts', 'src/a.ts', 'README.md'];
    expect(JSON.stringify(buildFileIndex(files))).toBe(JSON.stringify(buildFileIndex(files)));
  });

  it('claims nothing about a file it cannot observe', () => {
    // The schema's per-file values (fragility, modification counts) are all
    // behavioral and only derivable from git, which META-195's experimental
    // boundary keeps out of the stable contract pending VR-526. Keys are the
    // contribution; an empty entry asserts existence and nothing more.
    expect(Object.values(buildFileIndex(['src/a.ts']))).toEqual([{}]);
  });

  it('dedupes and drops empty entries', () => {
    expect(Object.keys(buildFileIndex(['src/a.ts', './src/a.ts', '', 'src/a.ts']))).toEqual(['src/a.ts']);
  });

  it('returns an empty index for a repository with no tracked files', () => {
    expect(buildFileIndex([])).toEqual({});
  });
});

describe('buildFrameworkManifest', () => {
  it('emits a corroborated framework above the schema-documented 0.7 floor', () => {
    const entries = buildFrameworkManifest(['react'], manifests(['react', 'typescript']));
    expect(entries).toEqual([{ name: 'react', confidence: 0.9 }]);
    expect(entries[0]!.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('omits a token no dependency corroborates', () => {
    // The pre-META-195 emitter published every AGENTS.md token at a hardcoded
    // 0.5 — below the floor the schema documents, so a consumer filtering at
    // >= 0.7 read an empty manifest. An unbacked mention is not detection.
    expect(buildFrameworkManifest(['react'], manifests(['express']))).toEqual([]);
  });

  it('emits nothing when the repository declares no manifests at all', () => {
    expect(buildFrameworkManifest(['react', 'vue'], [])).toEqual([]);
  });

  it('corroborates case-insensitively and across every manifest', () => {
    expect(buildFrameworkManifest(['django', 'Flask'], manifests(['Django'], ['flask']))).toEqual([
      { name: 'Flask', confidence: 0.9 },
      { name: 'django', confidence: 0.9 },
    ]);
  });

  it('orders entries deterministically, so the drift gate stays usable', () => {
    // `stable()` sorts object keys but preserves ARRAY order, so this array is
    // inside the material projection unsorted unless the builder sorts it.
    const deps = manifests(['vite', 'react', 'zod']);
    const entries = buildFrameworkManifest(['zod', 'react', 'vite'], deps);
    expect(entries.map((e) => e.name)).toEqual(['react', 'vite', 'zod']);
    expect(entries).toEqual(buildFrameworkManifest(['vite', 'zod', 'react'], deps));
  });

  it('dedupes overlapping tokens', () => {
    const entries = buildFrameworkManifest(['tailwind', 'tailwind'], manifests(['tailwindcss']));
    expect(entries).toEqual([{ name: 'tailwind', confidence: 0.9 }]);
  });
});
