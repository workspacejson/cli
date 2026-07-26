import type { FileIndexEntry, FrameworkEntry } from '@workspacejson/spec';
import type { RepoState } from '@workspacejson/rules';

/**
 * Both builders here emit into `generated`, which sits INSIDE the material
 * projection (`generate.ts`'s `generatedProjection` excludes only `generatedAt`
 * and `by`). Anything non-deterministic they produce makes every run report
 * drift, rewrite the artifact and break `generate --check` as a CI gate.
 *
 * Two consequences shape everything below:
 *
 *  - Ordering is explicit. `stable()` sorts object keys but PRESERVES array
 *    order, so arrays must be sorted here or the gate is unusable.
 *  - Nothing may derive from wall-clock time. `RepoState.gitHistory` is a
 *    moving 30-day window (`git log --since=30 days ago`) that changes with no
 *    commits at all, and its fallback — when git is absent or the checkout is
 *    shallow — is "every file". Neither builder touches it.
 *
 * Sorting uses the default comparator (UTF-16 code unit order), never
 * `localeCompare`, which varies with the host locale and would make the written
 * bytes environment-dependent.
 */

/** Repository-root-relative POSIX, no leading "./" — the `fileIndex` key contract. */
function toIndexKey(file: string): string {
  return file.replace(/\\/g, '/').replace(/^\.\//, '');
}

/**
 * The repository's tracked file inventory, keyed per `@workspacejson/spec`'s
 * `fileIndex` contract.
 *
 * Entries are intentionally empty. The per-file *values* the schema names —
 * `fragility`, `aiModificationCount`, `humanModificationCount` — are all
 * behavioral and the only evidence available for them is git-derived, which
 * META-195's experimental boundary keeps harness-side pending the VR-526
 * ruling. Emitting a weak git-scan number into the stable contract is the
 * precise thing that dispute is about, so this emits the keys and claims
 * nothing about them.
 *
 * Keys alone are the load-bearing part. The consumer adapter extracted under
 * META-248 joined by `hasOwnProperty(fileIndex, key)` and never read a value,
 * so an empty index made every such join silently return zero rows.
 */
export function buildFileIndex(
  files: string[],
  producerOutputs: readonly string[] = [],
): Record<string, FileIndexEntry> {
  // The producer's own output is not repository evidence, and indexing it makes
  // the artifact non-convergent: run 1 emits 6 keys, run 2 emits 7 because
  // `.agents/workspace.json` now exists on disk and the scanner sees it. The
  // material projection therefore changes with no repository change, which
  // makes `generate --check` fail on every repository's first CI run after
  // adoption. It self-corrects from run 3 onward, so running `generate` twice
  // locally hides it entirely — only generate-then-check exposes it, and that
  // is exactly the CI path. Caught by the META-198 conformance suite.
  // Entries match either exactly (a file, `.agents/workspace.json`) or as a
  // directory prefix (`.agents/audit-history` excludes everything beneath it).
  // A bare `includes()` would be wrong: `.agents/audit-history-notes.md` is a
  // repository file that merely shares a prefix, and excluding it would drop
  // real evidence.
  const excluded = producerOutputs.map(toIndexKey).filter(Boolean);
  const isProducerOutput = (key: string): boolean =>
    excluded.some((output) => key === output || key.startsWith(`${output}/`));

  const keys = [...new Set(files.map(toIndexKey).filter(Boolean))]
    .filter((key) => !isProducerOutput(key))
    .sort();
  const index: Record<string, FileIndexEntry> = {};
  for (const key of keys) index[key] = {};
  return index;
}

/**
 * Frameworks corroborated by a declared dependency.
 *
 * The schema describes this field as "Detected frameworks (confidence >= 0.7)",
 * so a token that nothing corroborates does not belong in it. Every entry the
 * producer emitted before META-195 was a bare AGENTS.md token at a hardcoded
 * `0.5` — below that floor, universally — which meant a consumer filtering at
 * the documented threshold read an empty manifest.
 *
 * Corroboration is case-insensitive EXACT equality against the union of
 * manifest dependencies. Substring containment was tried and is wrong at this
 * confidence: `vite` is contained in `vitest`, so a repository that installs
 * only `vitest` — an entirely ordinary setup — would publish `vite` at 0.9.
 * Lexical overlap is not detection, and a false entry is far worse here than a
 * missing one, because 0.9 tells a consumer to trust it.
 *
 * It deliberately under-reports. `@workspacejson/rules` keeps its token ->
 * dependency variant map internal (neither `FRAMEWORK_MANIFEST_MAP` nor
 * `KNOWN_FRAMEWORKS` is exported), and re-typing that table here would fork
 * standard-owned knowledge — the split-brain META-200 exists to prevent. So a
 * token whose dependency is published under a different name (`next.js` ->
 * `next`, `nestjs` -> `@nestjs/core`, `drizzle` -> `drizzle-orm`, `tailwind` ->
 * `tailwindcss`) is omitted rather than guessed. Omission is the safe failure:
 * absent, not wrong. Exporting that map from `workspacejson/standard` is the
 * real fix and is deliberately left to a follow-up, so this does not couple a
 * producer change to a cross-repository contract change.
 *
 * Note this is NOT the same test `frameworkDrift` performs. That rule looks a
 * token up in the variant map, skips it entirely when unmapped, and only then
 * compares — so it never matches on a raw token the way this must.
 */
export function buildFrameworkManifest(
  frameworkTokens: string[],
  manifests: RepoState['manifests'],
): FrameworkEntry[] {
  const dependencies = new Set(
    manifests.flatMap((manifest) => manifest.dependencies).map((d) => d.toLowerCase()),
  );
  // Normalize before deduping so `React` and `react` cannot both survive.
  const corroborated = [
    ...new Set(
      frameworkTokens.map((token) => token.toLowerCase()).filter((token) => dependencies.has(token)),
    ),
  ].sort();
  return corroborated.map((name) => ({ name, confidence: 0.9 }));
}
