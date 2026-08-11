/**
 * L0 mining core — the observation set (Phases 1 and 2).
 *
 * Reads git, returns an in-memory observation set, writes nothing. Three
 * consumers are planned: the producer's L1 projection, the META-289 harness,
 * and the report. This module is the single implementation all three take, so
 * the org does not acquire the META-140 defect class in the code whose numbers
 * an independent producer gets compared against.
 *
 * Scope boundary, enforced by what is absent: no weighting, no decay, no
 * support threshold, no lift, no ranking, no cap. Those are the *scoring* and
 * *selection* behaviors and they live in `score.ts` and `select.ts`. What is
 * here is extraction (REQ-001), a computed empty tree (REQ-002), one
 * normalizer (REQ-003), deterministic output (REQ-004), four completeness
 * states (REQ-005), and a shallow-clone guard (REQ-006).
 *
 * Those six numbers are the only requirement identifiers in this package that
 * are written down anywhere. Behaviors added after them are named, not
 * numbered — an invented identifier reads as a citation and cites nothing.
 */
import {
  type Completeness,
  CompletenessReason,
  CompletenessState,
  completeness,
} from './completeness.js';
import {
  type CommitEvent,
  GitInvocationError,
  GitOutputError,
  countFirstParent,
  extractEvents,
  isGitRepository,
  isShallowRepository,
  resolveCommit,
} from './git.js';
import { PATH_NORMALIZATION_ASSUMPTIONS, type PathAssumption } from './paths.js';

/**
 * v2.2.1's window: 500 first-parent transitions.
 *
 * v2.2.1 also names 2000 as a sensitivity arm. That is a harness concern; the
 * producer computes one snapshot at one basis, so the default is the headline
 * value and the harness overrides it.
 */
export const DEFAULT_WINDOW_TRANSITIONS = 500;

/**
 * How many co-occurrences make a relationship "qualifying" for REQ-005's
 * state 2/3 boundary.
 *
 * This is deliberately a parameter with a recorded value rather than a
 * constant, and the default is 1 rather than v2.2.1's `rawSupport >= 3`.
 *
 * Reason: Phase 2 runs *before* scoring, and `rawSupport >= 3` is a scoring
 * threshold — v2.2.1 defines it as the validity condition on `lift`. Baking 3
 * in here would mean Phase 2 shipped a scoring decision under a completeness
 * heading, and a repository with two genuine co-changes would report
 * MINED_NO_QUALIFYING_RELATIONSHIP, which reads as "examined and found
 * uncoupled" when the truth is "found coupled, below a threshold this phase has
 * not adopted".
 *
 * So Phase 2 draws the line at observed-at-all and says which line it drew.
 * Phase 3 sets this to 3 without touching the state machine.
 */
export const DEFAULT_QUALIFYING_MIN_COOCCURRENCE = 1;

export interface MineOptions {
  /** Revision whose first-parent history is walked. Defaults to `HEAD`. */
  basisRevision?: string;
  /** v2.2.1 window in first-parent transitions. Defaults to 500. */
  windowTransitions?: number;
  /** State 2/3 boundary. Defaults to 1. See the constant's note. */
  qualifyingMinCooccurrence?: number;
}

/** An unordered file pair and how many extracted events touched both. */
export interface PairObservation {
  /**
   * The two paths, sorted. Set semantics — position carries no meaning, which
   * matches the schema's own description of `coChange[].files`.
   */
  files: readonly [string, string];
  /**
   * Count of extracted events in which both paths appear. Raw and unweighted:
   * v2.2.1's `size_weight` and `position_decay` are Phase 3.
   */
  cooccurrenceCount: number;
}

/** What the window actually covered. Facts, not scores. */
export interface BasisWindow {
  /** The revision requested. */
  basisRevision: string;
  /** Its resolved object id, so the window is reproducible after refs move. */
  basisCommit: string;
  /** Transitions requested. */
  windowTransitions: number;
  /** First-parent transitions available from the basis. */
  availableTransitions: number;
  /** Transitions actually extracted — `min(requested, available)`. */
  extractedTransitions: number;
  /** True when available exceeded the window, so the window bound the result. */
  windowTruncated: boolean;
}

export interface ObservationSet {
  /** Bumped when the serialized shape changes. Consumers pin on it. */
  readonly l0Version: 1;
  completeness: Completeness;
  /** Absent when completeness is NOT_MINED or EVIDENCE_UNAVAILABLE. */
  basisWindow?: BasisWindow;
  /** Extracted events, oldest first. Empty unless mining completed. */
  events: readonly CommitEvent[];
  /** Pairs at or above the qualifying threshold, ranked-free and sorted. */
  pairs: readonly PairObservation[];
  /** The state 2/3 boundary this run used. Recorded, never implied. */
  qualifyingMinCooccurrence: number;
  /** REQ-003: what this run assumed about unratified path identity. */
  pathNormalization: readonly PathAssumption[];
}

/** Build an observation set for a state that produced no evidence. */
function withoutEvidence(
  state: typeof CompletenessState.NOT_MINED | typeof CompletenessState.EVIDENCE_UNAVAILABLE,
  reason: CompletenessReason,
  detail: string,
  qualifyingMinCooccurrence: number,
): ObservationSet {
  return {
    l0Version: 1,
    completeness: completeness(state, reason, detail),
    events: [],
    pairs: [],
    qualifyingMinCooccurrence,
    pathNormalization: PATH_NORMALIZATION_ASSUMPTIONS,
  };
}

/**
 * Count co-occurrences over the extracted events.
 *
 * N files in one event yield N(N-1)/2 pairs. The cap belongs to the selection
 * rule in `select.ts`; this counts everything the window produced, because a
 * cap applied before the count is decided would silently determine the ranking
 * it is supposed to follow.
 */
function countPairs(
  events: readonly CommitEvent[],
  qualifyingMinCooccurrence: number,
): readonly PairObservation[] {
  const counts = new Map<string, number>();
  for (const event of events) {
    const files = event.files;
    for (let i = 0; i < files.length; i += 1) {
      for (let j = i + 1; j < files.length; j += 1) {
        // `files` is already sorted and deduplicated by the parser, so
        // files[i] < files[j] and the key is canonical without re-sorting.
        // NUL cannot occur inside a path — git's own -z framing depends on
        // that — so it is the one safe key separator.
        const key = `${files[i]}\0${files[j]}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }

  const pairs: PairObservation[] = [];
  for (const [key, cooccurrenceCount] of counts) {
    if (cooccurrenceCount < qualifyingMinCooccurrence) continue;
    const [left, right] = key.split('\0') as [string, string];
    pairs.push({ files: [left, right], cooccurrenceCount });
  }

  // Total order, and deliberately not a ranking: sorted by path so the output
  // is stable for REQ-004. Ordering by count here would pre-empt the selection
  // rule, which is `select.ts`'s job and applies its own ordering downstream.
  pairs.sort((a, b) => {
    if (a.files[0] !== b.files[0]) return a.files[0] < b.files[0] ? -1 : 1;
    if (a.files[1] !== b.files[1]) return a.files[1] < b.files[1] ? -1 : 1;
    return 0;
  });
  return pairs;
}

/**
 * Mine an observation set from a repository's commit graph.
 *
 * Never throws for an absent, shallow or unreadable history — those are
 * reported as completeness states, which is the entire point of REQ-005. It
 * does throw on a programming error, because a bug should not disguise itself
 * as a repository condition.
 */
export async function mine(repoRoot: string, options: MineOptions = {}): Promise<ObservationSet> {
  const basisRevision = options.basisRevision ?? 'HEAD';
  const windowTransitions = options.windowTransitions ?? DEFAULT_WINDOW_TRANSITIONS;
  const qualifyingMinCooccurrence =
    options.qualifyingMinCooccurrence ?? DEFAULT_QUALIFYING_MIN_COOCCURRENCE;

  if (!(await isGitRepository(repoRoot))) {
    return withoutEvidence(
      CompletenessState.NOT_MINED,
      CompletenessReason.NO_REPOSITORY,
      `${repoRoot} is not a git repository, or git is unavailable`,
      qualifyingMinCooccurrence,
    );
  }

  // REQ-006. Before any extraction: a shallow clone can produce events, and
  // those events are indistinguishable from a complete short history. Mining
  // it and reporting the result would be the AP-1 failure this guard exists
  // for — a confident, wrong, non-empty answer.
  try {
    if (await isShallowRepository(repoRoot)) {
      return withoutEvidence(
        CompletenessState.NOT_MINED,
        CompletenessReason.SHALLOW_CLONE,
        'repository is a shallow clone; commit-graph history is truncated and co-change evidence cannot be established from it',
        qualifyingMinCooccurrence,
      );
    }
  } catch (error) {
    return withoutEvidence(
      CompletenessState.EVIDENCE_UNAVAILABLE,
      CompletenessReason.GIT_FAILED,
      `could not determine whether the repository is shallow: ${error instanceof Error ? error.message : String(error)}`,
      qualifyingMinCooccurrence,
    );
  }

  // An empty repository resolves no HEAD. That is an absent history, not a
  // broken one, and the two must not collapse into one state.
  const basisCommit = await resolveCommit(repoRoot, basisRevision);
  if (basisCommit === undefined) {
    return withoutEvidence(
      CompletenessState.NOT_MINED,
      CompletenessReason.NO_COMMITS,
      `${basisRevision} does not resolve to a commit in ${repoRoot}`,
      qualifyingMinCooccurrence,
    );
  }

  let events: readonly CommitEvent[];
  let availableTransitions: number;
  try {
    availableTransitions = await countFirstParent(repoRoot, basisCommit);
    events = await extractEvents(repoRoot, { basisRevision: basisCommit, windowTransitions });
  } catch (error) {
    if (error instanceof GitOutputError) {
      return withoutEvidence(
        CompletenessState.EVIDENCE_UNAVAILABLE,
        CompletenessReason.MALFORMED_OUTPUT,
        error.message,
        qualifyingMinCooccurrence,
      );
    }
    if (error instanceof GitInvocationError) {
      return withoutEvidence(
        CompletenessState.EVIDENCE_UNAVAILABLE,
        CompletenessReason.GIT_FAILED,
        error.message,
        qualifyingMinCooccurrence,
      );
    }
    throw error;
  }

  if (events.length === 0) {
    return withoutEvidence(
      CompletenessState.NOT_MINED,
      CompletenessReason.NO_COMMITS,
      `no first-parent commits reachable from ${basisRevision}`,
      qualifyingMinCooccurrence,
    );
  }

  const pairs = countPairs(events, qualifyingMinCooccurrence);

  return {
    l0Version: 1,
    completeness: completeness(
      pairs.length > 0
        ? CompletenessState.QUALIFYING_RELATIONSHIP_OBSERVED
        : CompletenessState.MINED_NO_QUALIFYING_RELATIONSHIP,
      CompletenessReason.MINED,
      `mined ${events.length} first-parent transition(s) from ${basisCommit}; ${pairs.length} pair(s) at or above ${qualifyingMinCooccurrence} co-occurrence(s)`,
    ),
    basisWindow: {
      basisRevision,
      basisCommit,
      windowTransitions,
      availableTransitions,
      extractedTransitions: events.length,
      windowTruncated: availableTransitions > windowTransitions,
    },
    events,
    pairs,
    qualifyingMinCooccurrence,
    pathNormalization: PATH_NORMALIZATION_ASSUMPTIONS,
  };
}
