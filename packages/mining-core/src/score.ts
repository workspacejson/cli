/**
 * L0 scoring and basis pinning — META-297 Phase 3.
 *
 * Named behaviors, not numbered ones. REQ-001..006 are written down in the
 * issue and this package cites them; the scoring, exclusion, basis-pinning and
 * selection behaviors are not, so they are named. An invented identifier reads
 * as a citation and cites nothing.
 *
 * A pure function over an observation set. It spawns no process, reads no
 * filesystem, and consults no clock: everything it needs was already extracted
 * by Phase 1. That is what keeps the exclusion auditable — `score` can be
 * handed the same observation set twice with different parameters and the
 * difference is attributable to the parameters rather than to a second walk of
 * a repository that may have moved.
 *
 * Two vocabularies meet here and they are deliberately kept apart.
 *
 * META-289 v2.2.1 supplies the *weighting*, frozen and implemented verbatim:
 * `size_weight = min(1, 10/fileCount)`, `position_decay = 2^(-Δpos/250)`, a
 * 500-transition window, and the exclusion of events with `fileCount > 50`.
 *
 * The standard's ratified A-009 amendment supplies the *counts*: `support` is
 * the number of distinct qualifying commits in which BOTH files changed, and
 * `occurrences` is the number in which AT LEAST ONE changed — the symmetric
 * union, not a per-file marginal. Both are integers, both are counted over the
 * same boundary, and `support <= occurrences` holds by construction.
 *
 * The weighted number and the counts are both emitted, and neither is derived
 * from the other. A rate is a reader's question; nothing derived is stored.
 *
 * What is NOT here, and why: the pair cap and the ranking rule. Those are
 * the selection rule's, they are applied downstream in `select.ts`, and an
 * accidental order here would be read as a ranking —
 * so pairs come out in path order, which is a total order and visibly not a
 * ranking.
 */
import {
  type Completeness,
  CompletenessReason,
  CompletenessState,
  completeness,
} from './completeness.js';
import type { BasisWindow, ObservationSet } from './mine.js';

/** The frozen weighting this module implements. Recorded in every output. */
export const WEIGHTING_VERSION = 'META-289 v2.2.1';

/** `size_weight = min(1, 10/fileCount)`. */
export const SIZE_WEIGHT_NUMERATOR = 10;

/** `position_decay = 2^(-Δpos/250)`. One half-life is 250 transitions. */
export const POSITION_DECAY_HALF_LIFE = 250;

/**
 * Events touching more than this many files are excluded from scoring.
 *
 * Strictly greater: an event with exactly 50 files is scored. The recorded
 * file-role and path exclusion set is EMPTY — no path is excluded for being
 * documentation, a lockfile or generated — so this size rule is the only
 * exclusion L0 applies, and it applies to whole events rather than to paths.
 */
export const SCORING_MAX_FILE_COUNT = 50;

/**
 * v2.2.1's validity condition, adopted here.
 *
 * Phase 2 deliberately defaulted its own state 2/3 boundary to 1 and recorded
 * that Phase 3 would raise it, because `rawSupport >= 3` is a scoring threshold
 * and Phase 2 ran before scoring. This is Phase 3, so the threshold lands here
 * and nowhere else. It is still a parameter, and the value used is recorded in
 * the output rather than implied by it.
 */
export const DEFAULT_MIN_SUPPORT = 3;

/** A full-length lowercase Git object name. The standard's A-009 pattern. */
const OBJECT_NAME = /^([0-9a-f]{40}|[0-9a-f]{64})$/;

/** v2.2.1's `size_weight`. Saturates at 1; never exceeds it. */
export function sizeWeight(fileCount: number): number {
  return Math.min(1, SIZE_WEIGHT_NUMERATOR / fileCount);
}

/**
 * v2.2.1's `position_decay`, over distance back from the basis.
 *
 * `deltaPosition` is 0 at the newest extracted event and grows toward the
 * oldest. At the far edge of a full 500-transition window it is 500, so the
 * oldest event carries a quarter of the weight of the newest.
 */
export function positionDecay(deltaPosition: number): number {
  return 2 ** (-deltaPosition / POSITION_DECAY_HALF_LIFE);
}

export interface ScoredPair {
  /** The two paths, sorted. Set semantics; position carries no meaning. */
  files: readonly [string, string];
  /** Distinct scored events in which BOTH files changed. A-009's `support`. */
  support: number;
  /**
   * Distinct scored events in which AT LEAST ONE changed. A-009's
   * `occurrences` in the observation form — the symmetric union denominator,
   * so reversing the pair changes nothing. Never a per-file marginal.
   */
  occurrences: number;
  /**
   * v2.2.1's weighted support: the sum of `size_weight × position_decay` over
   * the scored events in which both files changed.
   *
   * Emitted alongside the counts, never instead of them, and never used to
   * order anything — see the ranking note at the top of this file.
   */
  weightedSupport: number;
}

/** Everything needed to recount this result against the same history. */
export interface ScoringBasis {
  /** The frozen ruleset these numbers are attributable to. */
  weightingVersion: string;
  sizeWeightNumerator: number;
  positionDecayHalfLife: number;
  maxScoredFileCount: number;
  /**
   * The pinned basis: a full-length lowercase object name, never a symbolic
   * ref. A pin that does not name exactly one commit permanently cannot be
   * recounted against, which is the whole point of pinning it.
   */
  basisRevision: string;
  /** Oldest extracted commit — the far edge of the window. */
  windowOldestCommit: string;
  /** Newest extracted commit — the near edge, and the decay origin. */
  windowNewestCommit: string;
  /** The extracted position Δpos is measured from. */
  decayOriginPosition: number;
}

/** What the size rule removed, counted rather than assumed. */
export interface ScoringExclusions {
  /** The rule: events with more files than this are excluded. */
  maxFileCount: number;
  /** Events that were scored. */
  scoredEventCount: number;
  /** Events the size rule removed. */
  excludedEventCount: number;
  /**
   * The excluded commits, in extraction order. Named, not just counted — an
   * exclusion nobody can point at is not auditable, and this is the only
   * exclusion L0 applies.
   */
  excludedCommits: readonly string[];
}

export interface ScoredSet {
  /** Bumped when this shape changes. Consumers pin on it. */
  readonly l0ScoreVersion: 1;
  /** Recomputed against `minSupport`. Same four states; no new ones. */
  completeness: Completeness;
  /** Carried through from the observation set, unchanged. */
  basisWindow?: BasisWindow;
  /** Absent when there is no window to pin. Never a placeholder. */
  scoringBasis?: ScoringBasis;
  exclusions: ScoringExclusions;
  /** Pairs at or above `minSupport`, in path order. Not a ranking. */
  pairs: readonly ScoredPair[];
  /** The threshold this run used. Recorded, never implied. */
  minSupport: number;
}

export interface ScoreOptions {
  /** v2.2.1's `rawSupport >= 3`. Defaults to 3. */
  minSupport?: number;
}

/** No evidence to score. The input's own completeness is carried through verbatim. */
function unscored(observations: ObservationSet, minSupport: number): ScoredSet {
  return {
    l0ScoreVersion: 1,
    completeness: observations.completeness,
    // Spread rather than assign: under `exactOptionalPropertyTypes` an explicit
    // `undefined` is a different thing from an absent key, and the absent key
    // is what "there is no window to pin" means.
    ...(observations.basisWindow === undefined ? {} : { basisWindow: observations.basisWindow }),
    exclusions: {
      maxFileCount: SCORING_MAX_FILE_COUNT,
      scoredEventCount: 0,
      excludedEventCount: 0,
      excludedCommits: [],
    },
    pairs: [],
    minSupport,
  };
}

/**
 * Score an observation set.
 *
 * Honest degradation is the first thing this function does, not the last.
 * States 1 and 4 mean the history was not established, and an events array is
 * not permission to override that — a `--depth 1` clone can hand over real
 * events that produce a structurally identical answer at reduced magnitude,
 * which is the single most expensive failure this package can ship, because
 * every diagnostic run against an external repository is a fresh clone whose
 * depth is a configuration detail nobody reads. So the gate is completeness,
 * never `events.length > 0`.
 *
 * Throws only on a caller bug — an unpinnable basis. A repository condition is
 * a completeness state; a bug must not disguise itself as one.
 */
export function score(observations: ObservationSet, options: ScoreOptions = {}): ScoredSet {
  const minSupport = options.minSupport ?? DEFAULT_MIN_SUPPORT;

  const mined =
    observations.completeness.state === CompletenessState.QUALIFYING_RELATIONSHIP_OBSERVED ||
    observations.completeness.state === CompletenessState.MINED_NO_QUALIFYING_RELATIONSHIP;
  if (!mined) return unscored(observations, minSupport);

  const { basisWindow, events } = observations;
  if (basisWindow === undefined || events.length === 0) {
    return unscored(observations, minSupport);
  }

  if (!OBJECT_NAME.test(basisWindow.basisCommit)) {
    throw new Error(
      `score: basis ${JSON.stringify(basisWindow.basisCommit)} is not a full-length lowercase Git object name, so the result could not be recounted against it`,
    );
  }

  // Δpos is measured from the newest EXTRACTED event. Not the newest scored
  // one: excluding a large event must not shift the decay of every event older
  // than it, which is what renumbering after the filter would silently do.
  const decayOriginPosition = Math.max(...events.map((event) => event.position));

  const scored = events.filter((event) => event.fileCount <= SCORING_MAX_FILE_COUNT);
  const excludedCommits = events
    .filter((event) => event.fileCount > SCORING_MAX_FILE_COUNT)
    .map((event) => event.commit);

  // support: scored events in which both files changed.
  const support = new Map<string, number>();
  // weightedSupport: v2.2.1's sum over those same events.
  const weighted = new Map<string, number>();
  // Per-file scored-event counts, used only to derive the union denominator.
  const perFile = new Map<string, number>();

  for (const event of scored) {
    const weight = sizeWeight(event.fileCount) * positionDecay(decayOriginPosition - event.position);
    const files = event.files;
    for (const path of files) {
      perFile.set(path, (perFile.get(path) ?? 0) + 1);
    }
    for (let i = 0; i < files.length; i += 1) {
      for (let j = i + 1; j < files.length; j += 1) {
        // `files` is sorted and deduplicated upstream, so files[i] < files[j]
        // and the key is canonical. NUL cannot occur inside a path — git's own
        // -z framing depends on that — so it is the one safe separator.
        const key = `${files[i]}\0${files[j]}`;
        support.set(key, (support.get(key) ?? 0) + 1);
        weighted.set(key, (weighted.get(key) ?? 0) + weight);
      }
    }
  }

  const pairs: ScoredPair[] = [];
  for (const [key, both] of support) {
    if (both < minSupport) continue;
    const [left, right] = key.split('\0') as [string, string];
    // |A ∪ B| = |A| + |B| − |A ∩ B|, and |A ∩ B| is exactly `both` over the
    // scored events. Symmetric by construction, which is the property A-009
    // requires and a per-file marginal would not have.
    const occurrences = (perFile.get(left) ?? 0) + (perFile.get(right) ?? 0) - both;
    pairs.push({
      files: [left, right],
      support: both,
      occurrences,
      weightedSupport: weighted.get(key) ?? 0,
    });
  }

  // Path order: a total order, deterministic, and visibly not a ranking.
  pairs.sort((a, b) => {
    if (a.files[0] !== b.files[0]) return a.files[0] < b.files[0] ? -1 : 1;
    if (a.files[1] !== b.files[1]) return a.files[1] < b.files[1] ? -1 : 1;
    return 0;
  });

  const oldest = events[0]!;
  const newest = events[events.length - 1]!;

  return {
    l0ScoreVersion: 1,
    completeness: completeness(
      pairs.length > 0
        ? CompletenessState.QUALIFYING_RELATIONSHIP_OBSERVED
        : CompletenessState.MINED_NO_QUALIFYING_RELATIONSHIP,
      CompletenessReason.MINED,
      `scored ${scored.length} of ${events.length} extracted event(s) at ${WEIGHTING_VERSION}; ${excludedCommits.length} excluded for fileCount > ${SCORING_MAX_FILE_COUNT}; ${pairs.length} pair(s) at support >= ${minSupport}`,
    ),
    basisWindow,
    scoringBasis: {
      weightingVersion: WEIGHTING_VERSION,
      sizeWeightNumerator: SIZE_WEIGHT_NUMERATOR,
      positionDecayHalfLife: POSITION_DECAY_HALF_LIFE,
      maxScoredFileCount: SCORING_MAX_FILE_COUNT,
      basisRevision: basisWindow.basisCommit,
      windowOldestCommit: oldest.commit,
      windowNewestCommit: newest.commit,
      decayOriginPosition,
    },
    exclusions: {
      maxFileCount: SCORING_MAX_FILE_COUNT,
      scoredEventCount: scored.length,
      excludedEventCount: excludedCommits.length,
      excludedCommits,
    },
    pairs,
    minSupport,
  };
}
