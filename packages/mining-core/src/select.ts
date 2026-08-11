/**
 * The provisional producer-profile selection rule — threshold, rank, cap.
 *
 * A named behavior, not a numbered requirement. Only REQ-001..006 are written
 * down for this package; an invented identifier reads as a citation and cites
 * nothing.
 *
 * This is the last L0 step and the only one whose shape is bound for an
 * artifact. It takes a scored set and answers one question: of everything
 * observed, which pairs does a producer emit, in what order, and how does a
 * reader know what was left out.
 *
 * Three properties are load-bearing, and each exists because its absence is a
 * known failure:
 *
 * 1. **The ranking keys on integers only.** `support` and `occurrences` are
 *    counts. `weightedSupport` is a double whose precision ECMAScript leaves
 *    implementation-defined, so an order that depended on it would be an order
 *    that could differ between engines. It does not appear here at all.
 *
 * 2. **The cap is applied after ranking, and it is recorded.** Capping first
 *    would silently choose which pairs get ranked. Capping without recording
 *    would make a truncated list indistinguishable from a short one — the same
 *    defect as reporting zero partners for a shallow clone, one layer up.
 *
 * 3. **Capping loses nothing upstream.** `select` is pure: the scored set it
 *    was handed still carries every pair and every weight afterwards, and the
 *    extracted events behind it are untouched. Capping is a presentation step.
 *
 * The public command name for the refresh operation that will call this is
 * **deliberately not chosen here**. History mining is an explicit refresh
 * rather than part of default generation — a bound 500-transition window costs
 * seconds to tens of seconds — but naming the command is a separate decision
 * and this module does not pre-empt it.
 */
import {
  type Completeness,
  CompletenessReason,
  CompletenessState,
  completeness,
} from './completeness.js';
import type { BasisWindow } from './mine.js';
import { DEFAULT_MIN_SUPPORT, type ScoredSet, type ScoringBasis, type ScoringExclusions } from './score.js';

/** Pairs emitted per repository, applied after ranking. */
export const SELECTION_CAP = 50;

/**
 * The complete ranking rule, as text, carried in every receipt.
 *
 * Written out rather than described so that a reader comparing two artifacts
 * can see whether they were ranked the same way without reading this file.
 */
export const RANKING_RULE =
  'support DESC, then occurrences ASC, then files[0] ASC by UTF-8 bytes, then files[1] ASC by UTF-8 bytes';

const UTF8 = new TextEncoder();

/**
 * Compare two paths by UTF-8 byte order.
 *
 * Not `a < b`. A bare JavaScript string comparison is UTF-16 code unit order,
 * and the two disagree: a supplementary character such as U+1F600 is a
 * surrogate pair beginning 0xD83D, which sorts *before* U+E000 in UTF-16, while
 * its UTF-8 encoding (F0 9F 98 80) sorts *after* U+E000's (EE 80 80). Any
 * repository with an emoji in a path and anything in the private use area would
 * rank differently under the two rules, and the ruling names UTF-8.
 *
 * Not `localeCompare` either — that varies with host locale, which would make
 * the order depend on the machine that produced it.
 */
export function compareUtf8(a: string, b: string): number {
  if (a === b) return 0;
  const left = UTF8.encode(a);
  const right = UTF8.encode(b);
  const shared = Math.min(left.length, right.length);
  for (let i = 0; i < shared; i += 1) {
    if (left[i] !== right[i]) return left[i]! - right[i]!;
  }
  return left.length - right.length;
}

/**
 * A pair as a producer would emit it.
 *
 * Exactly three fields, all of them integers or strings. `weightedSupport` is
 * absent by construction, not by omission — see the float prohibition in
 * `serializeSelection`.
 */
export interface SelectedPair {
  files: readonly [string, string];
  /** Distinct scored commits in which both files changed. */
  support: number;
  /** Distinct scored commits in which at least one changed. The symmetric union. */
  occurrences: number;
}

/**
 * What this selection did, recorded rather than implied.
 *
 * A reader must be able to tell an emitted list of 50 that is everything from
 * an emitted list of 50 that is the top of 1,848, without access to the
 * repository. That is what `pairsBeforeCap` and `capBound` are for.
 */
export interface SelectionReceipt {
  /** The support threshold applied before ranking. */
  minSupport: number;
  /** Pairs that cleared the threshold. The population the cap cut from. */
  pairsBeforeCap: number;
  /** Pairs actually emitted. `min(pairsBeforeCap, cap)`. */
  pairsEmitted: number;
  /** The cap in force. */
  cap: number;
  /** The complete ranking rule, as text. */
  rankingRule: string;
  /** True when the cap actually bound — i.e. the emitted list is truncated. */
  capBound: boolean;
}

export interface SelectionResult {
  /** Bumped when this shape changes. Consumers pin on it. */
  readonly l0SelectionVersion: 1;
  /** Recomputed against the threshold. Same four states; no new ones. */
  completeness: Completeness;
  basisWindow?: BasisWindow;
  scoringBasis?: ScoringBasis;
  exclusions: ScoringExclusions;
  receipt: SelectionReceipt;
  /** Ranked and capped. */
  pairs: readonly SelectedPair[];
}

export interface SelectOptions {
  /** The frozen support threshold. Defaults to 3. */
  minSupport?: number;
  /** Pairs emitted per repository. Defaults to 50. */
  cap?: number;
}

/**
 * Apply the selection rule to a scored set.
 *
 * Pure. The input is not mutated and remains fully auditable afterwards.
 *
 * Throws only on a caller bug — a scored set that was already filtered above
 * the selection threshold, and has therefore silently lost pairs the selection
 * needed. That would produce a well-formed answer at reduced magnitude, which
 * is the failure mode with the highest external cost on this project.
 */
export function select(scored: ScoredSet, options: SelectOptions = {}): SelectionResult {
  const minSupport = options.minSupport ?? DEFAULT_MIN_SUPPORT;
  const cap = options.cap ?? SELECTION_CAP;

  if (scored.minSupport > minSupport) {
    throw new Error(
      `select: the scored set was built at threshold ${scored.minSupport}, above the selection threshold ${minSupport}, so pairs this selection needs were already discarded and the result would be short without saying so`,
    );
  }

  const mined =
    scored.completeness.state === CompletenessState.QUALIFYING_RELATIONSHIP_OBSERVED ||
    scored.completeness.state === CompletenessState.MINED_NO_QUALIFYING_RELATIONSHIP;

  // Honest degradation. States 1 and 4 mean the history was not established,
  // and a non-empty pair list is not permission to override that. The receipt
  // is still filled in completely: an empty list from a repository that was
  // never examined must not read like an empty list from one that was.
  if (!mined) {
    return {
      l0SelectionVersion: 1,
      completeness: scored.completeness,
      ...(scored.basisWindow === undefined ? {} : { basisWindow: scored.basisWindow }),
      ...(scored.scoringBasis === undefined ? {} : { scoringBasis: scored.scoringBasis }),
      exclusions: scored.exclusions,
      receipt: {
        minSupport,
        pairsBeforeCap: 0,
        pairsEmitted: 0,
        cap,
        rankingRule: RANKING_RULE,
        capBound: false,
      },
      pairs: [],
    };
  }

  // 1. Threshold. Copy first — `sort` mutates, and the scored set is the audit
  //    trail the cap is explicitly not allowed to damage.
  const qualifying = scored.pairs.filter((pair) => pair.support >= minSupport);

  // 2. Rank. Integer keys first, then UTF-8 path order, which is total because
  //    `files` is unique per pair. No key is a float.
  const ranked = [...qualifying].sort(
    (a, b) =>
      b.support - a.support ||
      a.occurrences - b.occurrences ||
      compareUtf8(a.files[0], b.files[0]) ||
      compareUtf8(a.files[1], b.files[1]),
  );

  // 3. Cap, after ranking, so the pairs kept are the highest-ranked ones and
  //    not an arbitrary prefix of whatever order the map happened to produce.
  const emitted = ranked.slice(0, cap);

  // Project to the artifact-bound shape. `weightedSupport` is dropped here and
  // only here; it survives on the scored set for diagnostics.
  const pairs: SelectedPair[] = emitted.map((pair) => ({
    files: pair.files,
    support: pair.support,
    occurrences: pair.occurrences,
  }));

  return {
    l0SelectionVersion: 1,
    completeness: completeness(
      pairs.length > 0
        ? CompletenessState.QUALIFYING_RELATIONSHIP_OBSERVED
        : CompletenessState.MINED_NO_QUALIFYING_RELATIONSHIP,
      CompletenessReason.MINED,
      `${ranked.length} pair(s) at support >= ${minSupport}; ${pairs.length} emitted under a cap of ${cap}${ranked.length > cap ? ' (cap bound)' : ''}`,
    ),
    ...(scored.basisWindow === undefined ? {} : { basisWindow: scored.basisWindow }),
    ...(scored.scoringBasis === undefined ? {} : { scoringBasis: scored.scoringBasis }),
    exclusions: scored.exclusions,
    receipt: {
      minSupport,
      pairsBeforeCap: ranked.length,
      pairsEmitted: pairs.length,
      cap,
      rankingRule: RANKING_RULE,
      capBound: ranked.length > cap,
    },
    pairs,
  };
}
