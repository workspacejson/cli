/**
 * Deterministic serialization of an observation set (REQ-004).
 *
 * REQ-004 asks that two runs at the same `basisRevision` produce byte-identical
 * output. That is a property of the *serializer* as much as the miner:
 * `JSON.stringify` preserves insertion order, so two structurally identical
 * objects built by different code paths can serialize to different bytes.
 * Sorting keys removes that degree of freedom.
 *
 * Scope of the guarantee, stated because the Phase 0 audit found it matters.
 * These bytes are a function of the repository at `basisCommit` and nothing
 * else — no wall clock, no locale, no environment, no host paths. That is
 * narrower than "the artifact is deterministic": `generated.hygiene` in the
 * published producer is fed by a 30-day `git log --since` window and moves on
 * its own (META-306). L0 does not inherit that and does not fix it.
 */
import type { ObservationSet } from './mine.js';
import type { ScoredSet } from './score.js';
import type { SelectionResult } from './select.js';

/**
 * Stable JSON. Object keys sorted by UTF-16 code unit; arrays left in the order
 * the producer emitted, which is itself sorted.
 *
 * `localeCompare` is deliberately not used — it varies with host locale and
 * would make the bytes machine-dependent, which is the failure this function
 * exists to prevent.
 *
 * `integersOnly` enforces the float prohibition. It is a parameter rather than
 * a separate walker so that there is exactly one serializer and no second
 * definition to drift.
 */
function stableStringify(value: unknown, integersOnly = false): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item, integersOnly)).join(',')}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries
      .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v, integersOnly)}`)
      .join(',')}}`;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      // NaN and Infinity serialize to `null` under JSON.stringify, which would
      // silently turn a computation bug into a plausible-looking absent value.
      throw new Error(`stableStringify: non-finite number ${value}`);
    }
    if (integersOnly && !Number.isInteger(value)) {
      throw new Error(
        `stableStringify: ${value} is not an integer, and floats are prohibited in artifact-bound output`,
      );
    }
  }
  return JSON.stringify(value) ?? 'null';
}

/** Serialize an observation set to stable bytes. */
export function serializeObservationSet(observations: ObservationSet): string {
  return stableStringify(observations);
}

/**
 * Serialize a scored set to stable bytes.
 *
 * Same guarantee and the same narrow scope, with one addition worth stating.
 * `weightedSupport` is a double produced by `2 ** x`, whose precision
 * ECMAScript leaves implementation-defined. Two runs on one engine agree
 * exactly, and the test proves it. Two runs on
 * *different* engines may differ in the last ulp, so the byte-identical claim
 * is scoped to a fixed engine and is not a cross-platform hash. The ranking
 * rule is required to key on integer counts precisely so that this float never
 * decides an order.
 */
export function serializeScoredSet(scored: ScoredSet): string {
  return stableStringify(scored);
}

/**
 * Serialize a selection result to stable bytes, with the float prohibition
 * enforced rather than assumed.
 *
 * This is the only shape in this package that is bound for an artifact, so it
 * is the only one where a float is a defect rather than a detail. Any
 * non-integer number **throws**. It is not rounded and it is not dropped:
 * rounding would invent precision the measurement does not have, and dropping
 * would remove a field a reader was told to expect. Both are quieter than the
 * bug, and quiet is the failure mode this package exists to avoid.
 *
 * Consequence, stated plainly: `weightedSupport` cannot appear here, which is
 * why `SelectedPair` does not carry it. It stays in memory on the scored set,
 * where `serializeScoredSet` will happily emit it for diagnostics that never
 * reach `workspace.json`.
 */
export function serializeSelection(selection: SelectionResult): string {
  return stableStringify(selection, true);
}
