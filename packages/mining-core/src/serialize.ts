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

/**
 * Stable JSON. Object keys sorted by UTF-16 code unit; arrays left in the order
 * the miner produced, which is itself sorted.
 *
 * `localeCompare` is deliberately not used — it varies with host locale and
 * would make the bytes machine-dependent, which is the failure this function
 * exists to prevent.
 */
function stableStringify(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    // NaN and Infinity serialize to `null` under JSON.stringify, which would
    // silently turn a computation bug into a plausible-looking absent value.
    throw new Error(`serializeObservationSet: non-finite number ${value}`);
  }
  return JSON.stringify(value) ?? 'null';
}

/** Serialize an observation set to stable bytes. */
export function serializeObservationSet(observations: ObservationSet): string {
  return stableStringify(observations);
}
