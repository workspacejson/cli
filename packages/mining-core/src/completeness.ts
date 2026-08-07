/**
 * Completeness semantics for L0 (REQ-005).
 *
 * The 2026-08-05 comment on META-297 names four states and requires that they
 * never collapse. The failure this prevents is specific: a shallow clone, an
 * unreadable history and a genuinely uncoupled repository all produce zero
 * pairs, and reporting "0 partners" for all three tells a reader that the
 * repository was examined and found clean when two of the three mean the
 * examination did not happen. That is AP-1 — a graceful empty return masking
 * missing capability — and it is the one failure mode here that does real
 * damage if a report built on a truncated clone reaches an external reader.
 *
 * So these are four distinct values, not a boolean plus a note, and there is no
 * code path that maps two of them onto one.
 */
export const CompletenessState = {
  /** 1. History was not mined, or evidence was not recorded. Absence of a claim. */
  NOT_MINED: 'NOT_MINED',
  /** 2. Mining completed over real history and found no qualifying relationship. A claim. */
  MINED_NO_QUALIFYING_RELATIONSHIP: 'MINED_NO_QUALIFYING_RELATIONSHIP',
  /** 3. Mining completed and at least one qualifying relationship was observed. A claim. */
  QUALIFYING_RELATIONSHIP_OBSERVED: 'QUALIFYING_RELATIONSHIP_OBSERVED',
  /** 4. Evidence was reachable but malformed or unavailable. A failure, not a result. */
  EVIDENCE_UNAVAILABLE: 'EVIDENCE_UNAVAILABLE',
} as const;

export type CompletenessState = (typeof CompletenessState)[keyof typeof CompletenessState];

/**
 * Why L0 landed in the state it did.
 *
 * States 1 and 4 are meaningless without this — "not mined" that does not say
 * *why* is the same dead end as "0 partners".
 */
export const CompletenessReason = {
  /** State 1. `git rev-parse --is-shallow-repository` returned true. */
  SHALLOW_CLONE: 'SHALLOW_CLONE',
  /** State 1. The path is not a git repository, or git is not on PATH. */
  NO_REPOSITORY: 'NO_REPOSITORY',
  /** State 1. A repository exists but the basis revision resolves to no commits. */
  NO_COMMITS: 'NO_COMMITS',
  /** State 1. Mining was not requested. */
  NOT_REQUESTED: 'NOT_REQUESTED',
  /** States 2 and 3. Extraction ran to completion. */
  MINED: 'MINED',
  /** State 4. A git invocation failed, or its output did not parse. */
  GIT_FAILED: 'GIT_FAILED',
  /** State 4. Output parsed but violated an invariant extraction relies on. */
  MALFORMED_OUTPUT: 'MALFORMED_OUTPUT',
} as const;

export type CompletenessReason = (typeof CompletenessReason)[keyof typeof CompletenessReason];

/**
 * Which reasons belong to which state.
 *
 * Exported so the pairing can be asserted rather than trusted: a reason that
 * drifts onto the wrong state is exactly the collapse REQ-005 forbids, and it
 * would otherwise be invisible.
 */
export const REASONS_BY_STATE: Readonly<Record<CompletenessState, readonly CompletenessReason[]>> =
  Object.freeze({
    [CompletenessState.NOT_MINED]: Object.freeze([
      CompletenessReason.SHALLOW_CLONE,
      CompletenessReason.NO_REPOSITORY,
      CompletenessReason.NO_COMMITS,
      CompletenessReason.NOT_REQUESTED,
    ]),
    [CompletenessState.MINED_NO_QUALIFYING_RELATIONSHIP]: Object.freeze([CompletenessReason.MINED]),
    [CompletenessState.QUALIFYING_RELATIONSHIP_OBSERVED]: Object.freeze([CompletenessReason.MINED]),
    [CompletenessState.EVIDENCE_UNAVAILABLE]: Object.freeze([
      CompletenessReason.GIT_FAILED,
      CompletenessReason.MALFORMED_OUTPUT,
    ]),
  });

export interface Completeness {
  state: CompletenessState;
  reason: CompletenessReason;
  /** Human-readable detail. Never the sole carrier of a distinction. */
  detail: string;
}

export function completeness(
  state: CompletenessState,
  reason: CompletenessReason,
  detail: string,
): Completeness {
  const permitted = REASONS_BY_STATE[state];
  if (!permitted.includes(reason)) {
    throw new Error(
      `completeness: reason ${reason} is not valid for state ${state} (valid: ${permitted.join(', ')})`,
    );
  }
  return { state, reason, detail };
}
