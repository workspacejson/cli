/**
 * L0 mining core — public surface.
 *
 * Phases 1 to 3 of META-297: extraction, normalization, completeness
 * semantics, v2.2.1 scoring, basis pinning, and the selection rule.
 *
 * Still nothing here writes to the artifact. L1 projection — mapping a
 * selection onto `generated.coChange` — is a separate step held closed by the
 * coordinator gate. The standard's A-009 amendment has merged and admits the
 * observation form (`support` + `occurrences` + a pinned `basisRevision`), so
 * the schema is no longer the blocker it was during Phases 1 and 2; the
 * package carrying it is unpublished and emission is step 3 of A-009's staged
 * transition, which this package does not authorize.
 *
 * The pipeline is `mine` → `score` → `select`, each pure with respect to the
 * one before it, so the extracted events and the uncapped scored result remain
 * auditable after the selection has capped anything.
 *
 * Named behaviors, not numbered ones. REQ-001..006 are written down for this
 * package and are cited; the weighting, the scoring exclusion, basis pinning
 * and the selection rule are not, so they are named. An invented identifier
 * reads as a citation and cites nothing.
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
export {
  DEFAULT_MIN_SUPPORT,
  POSITION_DECAY_HALF_LIFE,
  SCORING_MAX_FILE_COUNT,
  SIZE_WEIGHT_NUMERATOR,
  WEIGHTING_VERSION,
  type ScoreOptions,
  type ScoredPair,
  type ScoredSet,
  type ScoringBasis,
  type ScoringExclusions,
  positionDecay,
  score,
  sizeWeight,
} from './score.js';
export {
  RANKING_RULE,
  SELECTION_CAP,
  type SelectOptions,
  type SelectedPair,
  type SelectionReceipt,
  type SelectionResult,
  compareUtf8,
  select,
} from './select.js';
export {
  serializeObservationSet,
  serializeScoredSet,
  serializeSelection,
} from './serialize.js';
