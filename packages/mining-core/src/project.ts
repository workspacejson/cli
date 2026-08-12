/**
 * L1 projection — the only place a selection becomes artifact-shaped.
 *
 * Everything before this module answers "what does the commit graph say".
 * This one answers "what does a producer write down", and those are different
 * questions with different obligations. Three properties are load-bearing.
 *
 * 1. **Canonical endpoint order is established HERE, not upstream.** The
 *    scoring stage sorts pair endpoints with `<`, which is UTF-16 code unit
 *    order. The ruling names UTF-8 byte order, and the two disagree — a path
 *    containing U+1F600 sorts before one containing U+E000 under UTF-16 and
 *    after it under UTF-8. Upstream order is fine for keying a map, because
 *    only stability matters there. It is not fine for bytes a second producer
 *    is compared against, so the endpoints are re-ordered here under the same
 *    `compareUtf8` the ranking uses. Endpoint reversal must not change the
 *    output, and that is asserted rather than asserted-in-prose.
 *
 * 2. **No derived value is stored.** No rate, probability, lift, confidence or
 *    ranking. `support` and `occurrences` are counts; a reader who wants a
 *    ratio derives it. This is A-009, and the reason is that a continuous
 *    derived value moves on every commit and makes `generate --check` fire
 *    forever.
 *
 * 3. **The classification flag is omitted.** A-010 made
 *    `coChange[].generated` optional and defined absence as *unclassified*.
 *    This producer implements no deterministic tooling-coupling classifier, so
 *    it says nothing rather than emitting a constant `false` — which is
 *    exactly what the pre-A-010 producer did, and what made it assert that a
 *    lockfile and its manifest are a real source coupling. Absence here is a
 *    positive design decision, not an unfinished one.
 *
 * The projection refuses rather than degrades. A selection whose completeness
 * is not a mined state yields nothing at all — not an empty array, which under
 * A-009 is a *positive finding* that the analysis ran and found no qualifying
 * pairs. Reporting "analyzed, nothing found" for a repository that was never
 * successfully analyzed is the failure mode this whole package exists to
 * avoid, one level up from `NOT_MINED / SHALLOW_CLONE`.
 */
import { CompletenessState } from './completeness.js';
import { type SelectedPair, type SelectionResult, compareUtf8 } from './select.js';

/**
 * A co-change entry exactly as it appears in `generated.coChange`.
 *
 * Three fields. `generated` is absent by design — see the module note — and
 * `rate` is absent because the observation form forbids it.
 */
export interface ProjectedCoChangeEntry {
  /** The pair, endpoints in ascending UTF-8 byte order. */
  files: [string, string];
  /** Distinct qualifying commits in which both files changed. */
  support: number;
  /** Distinct qualifying commits in which at least one changed. The union. */
  occurrences: number;
}

/**
 * What a producer splices into `generated`.
 *
 * `basisRevision` is a `generated`-level sibling, never per item: repeating it
 * per entry would admit a document whose entries were counted at different
 * revisions.
 */
export interface ProjectedHistory {
  basisRevision: string;
  coChange: ProjectedCoChangeEntry[];
}

/** Why a projection produced nothing. Absence is reported, never smoothed. */
export enum ProjectionRefusal {
  /** Completeness is not a mined state — shallow clone, no history, or an error. */
  NOT_MINED = 'NOT_MINED',
  /** Mined, but no basis pin. An unpinned block cannot be recounted against. */
  NO_BASIS_PIN = 'NO_BASIS_PIN',
}

export type ProjectionResult =
  | { projected: true; history: ProjectedHistory }
  | { projected: false; refusal: ProjectionRefusal; detail: string };

/**
 * Put a pair's endpoints in canonical order.
 *
 * `files` has set semantics, so this changes no meaning — it fixes the one
 * spelling a producer is permitted to write, which is what makes two
 * independent producers byte-comparable.
 */
function canonicalPair(files: readonly [string, string]): [string, string] {
  return compareUtf8(files[0], files[1]) <= 0 ? [files[0], files[1]] : [files[1], files[0]];
}

function projectPair(pair: SelectedPair): ProjectedCoChangeEntry {
  return {
    files: canonicalPair(pair.files),
    support: pair.support,
    occurrences: pair.occurrences,
  };
}

/**
 * Project a selection into the artifact shape, or refuse and say why.
 *
 * Pure. The selection, the scored set behind it and the extracted events
 * behind that are all untouched and remain auditable.
 */
export function project(selection: SelectionResult): ProjectionResult {
  const state = selection.completeness.state;
  const mined =
    state === CompletenessState.QUALIFYING_RELATIONSHIP_OBSERVED ||
    state === CompletenessState.MINED_NO_QUALIFYING_RELATIONSHIP;

  if (!mined) {
    return {
      projected: false,
      refusal: ProjectionRefusal.NOT_MINED,
      detail: `completeness is ${state}; an artifact block would claim an analysis that did not happen`,
    };
  }

  const basisRevision = selection.scoringBasis?.basisRevision;
  if (basisRevision === undefined || basisRevision === '') {
    return {
      projected: false,
      refusal: ProjectionRefusal.NO_BASIS_PIN,
      detail:
        'the selection carries no basisRevision; an unpinned coChange block reads as legacy/unknown and asserts nothing',
    };
  }

  // Entry order is the selection's ranked order, already deterministic and
  // already applied threshold-then-rank-then-cap. This step re-orders endpoints
  // WITHIN each pair and nothing else: re-sorting the array here would silently
  // discard the ranking the selection rule exists to produce.
  return {
    projected: true,
    history: { basisRevision, coChange: selection.pairs.map(projectPair) },
  };
}
