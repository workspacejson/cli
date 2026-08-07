/**
 * Canonical path identity for L0 (REQ-003).
 *
 * META-278 specifies six questions about path identity and ADR-006 does not
 * exist — the Phase 0 audit (A-2) found 0 normalizer implementations across
 * `workspacejson/cli` and `workspacejson/standard`, and the only prior art is
 * an unexported `toIndexKey` in `packages/cli/src/producer/evidence.ts` that
 * answers 2 of the 6. So this function is the first implementation of a rule
 * that has not been ratified.
 *
 * That makes silence the hazard. A normalizer that quietly picks an answer to
 * "is `Foo.ts` the same path as `foo.ts`" produces keys that look settled and
 * are not, which is AP-1 wearing a different hat. Every assumption this module
 * makes on an unratified question is therefore declared in
 * `PATH_NORMALIZATION_ASSUMPTIONS` and carried in L0's output, so a reader sees
 * the guess as a guess and META-278 can overrule it against a written record
 * rather than against archaeology.
 */

/** One of META-278's six path-identity questions, and what L0 does about it. */
export interface PathAssumption {
  /** META-278's question, restated. */
  question: string;
  /** `ratified` — settled elsewhere. `assumed` — L0 guessed; META-278 governs. */
  standing: 'ratified' | 'assumed';
  /** The behavior this module implements. */
  behavior: string;
  /** Why, and what would change if META-278 rules the other way. */
  rationale: string;
}

/**
 * The full assumption record, emitted with every observation set.
 *
 * Ordered by META-278's own enumeration so the record can be diffed against the
 * issue. Two are `ratified` only in the weak sense that the published schema's
 * own field descriptions state them ("repository-root-relative POSIX path
 * (forward slashes, no leading \"./\", no drive letters)") — that is schema
 * prose, not an ADR, and it is recorded here as the source rather than claimed
 * as independent authority.
 */
export const PATH_NORMALIZATION_ASSUMPTIONS: readonly PathAssumption[] = Object.freeze([
  Object.freeze({
    question: 'Path separator: backslash or forward slash?',
    standing: 'ratified' as const,
    behavior: 'Backslashes are rewritten to forward slashes.',
    rationale:
      "Stated by the published schema's own description of every path-bearing field: repository-root-relative POSIX, forward slashes. Not an open question.",
  }),
  Object.freeze({
    question: 'Leading "./" prefix: preserved or stripped?',
    standing: 'ratified' as const,
    behavior: 'A single leading "./" is stripped. Repeated "./././" collapses to nothing.',
    rationale:
      'Same schema description: "no leading \\"./\\"". Repeated prefixes are not addressed there; stripping all of them is the only reading consistent with stripping one.',
  }),
  Object.freeze({
    question: 'Case sensitivity: are "Foo.ts" and "foo.ts" the same path?',
    standing: 'assumed' as const,
    behavior:
      'Case is preserved and comparison is case-sensitive. No case folding is applied.',
    rationale:
      "Git records the byte sequence it was given, so folding here would invent an identity git does not assert and would silently merge two files that a case-sensitive checkout keeps distinct. The cost is the mirror error: on a case-insensitive filesystem a rename that only changes case reads as two paths. META-278 may rule the other way; if it does, this is the site that changes.",
  }),
  Object.freeze({
    question: 'Unicode encoding: is NFC or NFD normalization applied?',
    standing: 'assumed' as const,
    behavior:
      'No Unicode normalization is applied. Bytes are decoded as UTF-8 and otherwise left alone.',
    rationale:
      'Applying NFC would make L0 disagree with `git ls-files` on macOS-authored paths, and applying NFD would do the same on Linux-authored ones. Neither is safe to pick unilaterally, so L0 picks neither and says so. Consequence, stated plainly: the same file committed from two platforms can produce two distinct L0 paths.',
  }),
  Object.freeze({
    question: 'Trailing slash: is "src/" the same path as "src"?',
    standing: 'assumed' as const,
    behavior:
      'A trailing slash is stripped. L0 only ever sees blob paths from `diff-tree -r`, so this should never fire.',
    rationale:
      "Defensive only. `diff-tree -r` emits blobs, never directories, so a trailing slash reaching this function means an upstream assumption broke. Stripping is the conservative choice; the input is recorded as unexpected rather than normalized away, because the interesting event is that it happened at all.",
  }),
  Object.freeze({
    question: 'Symlinks and submodule/worktree roots: resolved before or after comparison?',
    standing: 'assumed' as const,
    behavior:
      'Neither is resolved. L0 uses the path as recorded in the commit, relative to the repository whose history is being mined.',
    rationale:
      "L0 reads the commit graph and never touches the working tree, so there is no filesystem to resolve a symlink against — resolution would require a checkout and would make output depend on which revision happens to be checked out, breaking REQ-004. Submodule contents are a different repository's history and are not mined; a gitlink appears as a single path. This is the question L0 is least equipped to answer and META-278 should not read L0's behavior as a proposal.",
  }),
]);

/** Count of META-278 questions L0 answers by assumption rather than by rule. */
export const UNRATIFIED_ASSUMPTION_COUNT = PATH_NORMALIZATION_ASSUMPTIONS.filter(
  (assumption) => assumption.standing === 'assumed',
).length;

/**
 * The single path-normalization function for L0 (REQ-003).
 *
 * Every path-touching site in this package calls this. There is no second
 * definition and no inline separator handling anywhere else — that is asserted
 * by a test, not by convention, because the whole point of a single normalizer
 * is defeated by one call site that skips it.
 *
 * Behavior is exactly what `PATH_NORMALIZATION_ASSUMPTIONS` describes. Read
 * that record before changing anything here.
 */
export function normalizePath(rawPath: string): string {
  // Separator: ratified.
  let path = rawPath.replace(/\\/g, '/');

  // Leading "./": ratified. Loop rather than a single strip so "././a" lands on
  // "a" — one strip would leave "./a", which is the shape the rule forbids.
  while (path.startsWith('./')) path = path.slice(2);

  // Trailing slash: assumed, defensive. Never expected from `diff-tree -r`.
  while (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);

  // Case, Unicode, symlinks, submodule roots: deliberately untouched. See the
  // assumption record for why each is a decision and not an omission.
  return path;
}
