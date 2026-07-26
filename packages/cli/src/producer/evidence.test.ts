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

  it('is byte-stable regardless of the order the scanner reports files in', () => {
    // Serialized bytes, not just key sets: `git ls-files` order is not a
    // contract, and JSON.stringify writes insertion order.
    const files = ['src/b.ts', 'README.md', 'src/a.ts'];
    expect(JSON.stringify(buildFileIndex(files))).toBe(JSON.stringify(buildFileIndex([...files].reverse())));
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

  it('excludes the producer\'s own artifact, so the index converges', () => {
    // Regression, caught by the META-198 conformance suite. Run 1 emits N keys;
    // run 2 emitted N+1 because `.agents/workspace.json` now existed on disk
    // and the scanner reported it. The material projection therefore changed
    // with no repository change, which breaks `generate --check` as a CI gate
    // on every repository's first run after adoption.
    const files = ['src/a.ts', '.agents/workspace.json'];
    expect(Object.keys(buildFileIndex(files, ['.agents/workspace.json']))).toEqual(['src/a.ts']);

    // Convergence is the property that actually matters: the index a repo
    // produces before its artifact exists must equal the one produced after.
    expect(JSON.stringify(buildFileIndex(['src/a.ts'], ['.agents/workspace.json'])))
      .toBe(JSON.stringify(buildFileIndex(files, ['.agents/workspace.json'])));
  });

  it('excludes a producer-owned directory and everything beneath it', () => {
    const files = [
      'src/a.ts',
      '.agents/audit-history/2026-01-01.json',
      '.agents/audit-history/nested/2026-01-02.json',
    ];
    expect(Object.keys(buildFileIndex(files, ['.agents/audit-history']))).toEqual(['src/a.ts']);
  });

  it('does not exclude a repository file that merely shares a prefix', () => {
    // `includes()` or a bare `startsWith` without the separator would drop this
    // real file, silently removing evidence the consumer needs.
    const files = ['.agents/audit-history-notes.md', '.agents/audit-history/run.json'];
    expect(Object.keys(buildFileIndex(files, ['.agents/audit-history']))).toEqual([
      '.agents/audit-history-notes.md',
    ]);
  });

  it('indexes everything when no producer outputs are declared', () => {
    // The parameter is optional, so existing callers keep their behavior.
    expect(Object.keys(buildFileIndex(['src/a.ts', '.agents/workspace.json']))).toEqual([
      '.agents/workspace.json',
      'src/a.ts',
    ]);
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
      { name: 'django', confidence: 0.9 },
      { name: 'flask', confidence: 0.9 },
    ]);
  });

  it('does not accept a dependency that merely contains the token', () => {
    // Substring containment is not detection. `vite` is contained in `vitest`,
    // and a repository that installs only vitest is entirely ordinary — so
    // substring matching published a framework the repository does not use, at
    // the confidence that tells a consumer to trust it.
    expect(buildFrameworkManifest(['vite'], manifests(['vitest']))).toEqual([]);
    expect(buildFrameworkManifest(['rest'], manifests(['interest']))).toEqual([]);
    expect(buildFrameworkManifest(['next.js'], manifests(['next']))).toEqual([]);
  });

  it('still corroborates the token when the dependency is exactly it', () => {
    // The guard above must not be so strict that nothing survives it.
    expect(buildFrameworkManifest(['vite'], manifests(['vite', 'vitest']))).toEqual([
      { name: 'vite', confidence: 0.9 },
    ]);
  });

  it('dedupes tokens that differ only by case', () => {
    expect(buildFrameworkManifest(['React', 'react'], manifests(['react']))).toEqual([
      { name: 'react', confidence: 0.9 },
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

  it('omits a token whose dependency is published under a different name', () => {
    // `tailwind` is a known token but the package is `tailwindcss`, so exact
    // matching drops it. This is the accepted cost of not forking the variant
    // map out of @workspacejson/rules: absent, not wrong. When AGENTS.md says
    // "tailwindcss" the parser also yields that token, which does corroborate.
    expect(buildFrameworkManifest(['tailwind'], manifests(['tailwindcss']))).toEqual([]);
    expect(buildFrameworkManifest(['tailwind', 'tailwindcss'], manifests(['tailwindcss']))).toEqual([
      { name: 'tailwindcss', confidence: 0.9 },
    ]);
  });
});
