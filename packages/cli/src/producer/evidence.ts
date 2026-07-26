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
export function buildFileIndex(files: string[]): Record<string, FileIndexEntry> {
  const keys = [...new Set(files.map(toIndexKey).filter(Boolean))].sort();
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
 * Corroboration is case-insensitive substring containment against the union of
 * manifest dependencies, matching the fallback branch `frameworkDrift` already
 * uses so the emitter and the rule that audits it agree. It deliberately
 * under-reports: `@workspacejson/rules` keeps its token -> dependency variant
 * map internal (neither `FRAMEWORK_MANIFEST_MAP` nor `KNOWN_FRAMEWORKS` is
 * exported), and re-typing that table here would fork standard-owned knowledge
 * — the split-brain META-200 exists to prevent. Tokens whose dependency is
 * named differently (`next.js` -> `next`, `nestjs` -> `@nestjs/core`) are
 * therefore omitted rather than guessed. Omission is the safe failure: absent,
 * not wrong. Exporting the map from `workspacejson/standard` closes the gap.
 */
export function buildFrameworkManifest(
  frameworkTokens: string[],
  manifests: RepoState['manifests'],
): FrameworkEntry[] {
  const dependencies = manifests.flatMap((manifest) => manifest.dependencies).map((d) => d.toLowerCase());
  const corroborated = [
    ...new Set(
      frameworkTokens.filter((token) =>
        dependencies.some((dependency) => dependency.includes(token.toLowerCase())),
      ),
    ),
  ].sort();
  return corroborated.map((name) => ({ name, confidence: 0.9 }));
}
