/**
 * L0 mining core — public surface.
 *
 * Phases 1 and 2 of META-297 only: extraction, normalization, and completeness
 * semantics. No scoring. Nothing here writes to the artifact — L1 projection is
 * Phase 3 and is blocked on a schema admission (the published `coChange` item
 * requires `rate` and forbids additional properties, so the counts-only shape
 * is rejected, not merely divergent).
 */
export {
  type Completeness,
  CompletenessReason,
  CompletenessState,
  REASONS_BY_STATE,
} from './completeness.js';
export {
  type CommitEvent,
  GitInvocationError,
  GitOutputError,
  emptyTreeObject,
  extractEvents,
  parseNameStatusZ,
} from './git.js';
export {
  DEFAULT_QUALIFYING_MIN_COOCCURRENCE,
  DEFAULT_WINDOW_TRANSITIONS,
  type BasisWindow,
  type MineOptions,
  type ObservationSet,
  type PairObservation,
  mine,
} from './mine.js';
export {
  PATH_NORMALIZATION_ASSUMPTIONS,
  UNRATIFIED_ASSUMPTION_COUNT,
  type PathAssumption,
  normalizePath,
} from './paths.js';
export { serializeObservationSet } from './serialize.js';
