/**
 * Carry-forward of commit-history evidence across ordinary generation.
 *
 * This is the load-bearing rule of L1, and it exists because two obligations
 * collide.
 *
 * The standard says `generated` is producer-owned and replaced wholesale on
 * each regeneration. The ruling says history mining is **explicit and opt-in**,
 * and that ordinary generation must not recompute history or fabricate
 * freshness. Taken naively, the first erases what the second forbids
 * recomputing: run `generate` after mining and the observations are gone.
 *
 * So `generated.coChange` and `generated.basisRevision` are the one part of the
 * producer-owned section that ordinary generation **preserves rather than
 * rebuilds**. Not because they are manual — they are machine-derived — but
 * because they are derived from an input ordinary generation does not read.
 * The working tree is scanned every run; the commit graph is not.
 *
 * Three failure modes this is written against, all of which produce a
 * plausible-looking artifact:
 *
 * - **Drop.** Regenerating without carry-forward silently destroys mined
 *   evidence, and the resulting empty/absent block is indistinguishable from a
 *   repository that was never mined.
 * - **Advance the pin.** Carrying the observations forward while moving
 *   `basisRevision` to current HEAD re-attributes old counts to a commit they
 *   were never counted at. The numbers stay plausible and become false.
 * - **Recompute.** Mining during ordinary generation makes every run pay
 *   seconds-to-tens-of-seconds, and makes the artifact churn on every commit —
 *   the exact `generate --check` failure the raw-count amendment removed.
 *
 * **`generatedAt` is not evidence about this block.** It records when the
 * ordinary generation run happened. `basisRevision` is the authoritative
 * freshness and provenance pin for the co-change observations, and it is the
 * only field that says which commit they were counted at. A run that refreshes
 * `fileIndex` moves `generatedAt` and must leave `basisRevision` exactly where
 * it was; a reader comparing `generatedAt` to the repository's current revision
 * learns nothing about whether the history block is stale, and must compare
 * `basisRevision` instead.
 */
import type { WorkspaceJsonV4 } from '@workspacejson/spec';

/** A full-length lowercase Git object name. SHA-1 or SHA-256, never symbolic. */
const OBJECT_NAME = /^[0-9a-f]{40}$|^[0-9a-f]{64}$/;

/**
 * What ordinary generation carries forward, verbatim.
 *
 * `coChange` is deliberately `readonly unknown[]` rather than the published
 * `CoChangeEntry[]`. Two reasons, and the second is the load-bearing one.
 *
 * These entries are passed through untouched — nothing here reads a field off
 * them, so a precise element type would buy nothing. And the published
 * `@workspacejson/spec@0.4.4` type predates ADR-003 A-009: it requires `rate`
 * and has no `support`, so calling a preserved observation entry a
 * `CoChangeEntry` would be a false claim in the type system rather than a
 * convenience. The one place the stale type has to be accommodated is the
 * assembly boundary in `generate.ts`, and it stays the only place.
 */
export interface PreservedHistory {
  basisRevision: string;
  coChange: readonly unknown[];
}

/** Why nothing was carried forward. Absence is reported, never inferred away. */
export enum CarryForwardRefusal {
  /** No prior artifact, or it had no `coChange`. Nothing to preserve. */
  NO_PRIOR_BLOCK = 'NO_PRIOR_BLOCK',
  /** Present but not the observation form — legacy `rate`, or malformed. */
  NOT_OBSERVATION_FORM = 'NOT_OBSERVATION_FORM',
  /** Observation form without a conforming pin. Reads as legacy/unknown. */
  NO_CONFORMING_BASIS = 'NO_CONFORMING_BASIS',
}

export type CarryForwardResult =
  | { preserved: true; history: PreservedHistory }
  | { preserved: false; refusal: CarryForwardRefusal; detail: string };

function isObservationEntry(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;

  // The form discriminator is `support` versus `rate`, and nothing else.
  // `generated` plays no part in it — A-010 made that flag optional, so an
  // entry carrying counts and no classification is unambiguously observation
  // form, and refusing to carry it forward would discard exactly the shape
  // this producer emits.
  if ('rate' in entry) return false;
  if (!Number.isInteger(entry['support']) || (entry['support'] as number) < 0) return false;
  if (!Number.isInteger(entry['occurrences']) || (entry['occurrences'] as number) < 1) return false;
  if ((entry['support'] as number) > (entry['occurrences'] as number)) return false;

  const files = entry['files'];
  if (!Array.isArray(files) || files.length !== 2) return false;
  if (!files.every((path) => typeof path === 'string' && path.length > 0)) return false;

  return true;
}

/**
 * Decide what an ordinary generation run preserves from the prior artifact.
 *
 * Validating rather than trusting is the point. A block that would not survive
 * schema validation must not be carried into a fresh artifact, because doing so
 * would let one bad mining run poison every subsequent generation — and the
 * producer refuses to overwrite an invalid artifact precisely so that cannot
 * happen silently.
 *
 * The returned values are the parsed objects themselves, not copies rebuilt
 * field by field. Rebuilding would re-order keys and change bytes; the contract
 * is byte-for-byte preservation, so the original values are passed through.
 */
export function carryForwardHistory(existing: WorkspaceJsonV4 | undefined): CarryForwardResult {
  if (existing === undefined) {
    return {
      preserved: false,
      refusal: CarryForwardRefusal.NO_PRIOR_BLOCK,
      detail: 'no prior artifact',
    };
  }

  const generated = existing.generated as unknown as Record<string, unknown>;
  const coChange = generated['coChange'];

  if (!Array.isArray(coChange)) {
    return {
      preserved: false,
      refusal: CarryForwardRefusal.NO_PRIOR_BLOCK,
      detail: 'the prior artifact carries no coChange array',
    };
  }

  // An empty array is preserved only when pinned. Unpinned it means
  // legacy/unknown and asserts nothing, so there is nothing to preserve;
  // pinned it is a positive finding — the analysis ran and found no qualifying
  // pairs — and dropping it would convert a real result into "never analyzed".
  if (!coChange.every(isObservationEntry)) {
    return {
      preserved: false,
      refusal: CarryForwardRefusal.NOT_OBSERVATION_FORM,
      detail:
        'the prior coChange block is not homogeneous observation form; it is legacy or malformed and this producer does not perpetuate it',
    };
  }

  const basisRevision = generated['basisRevision'];
  if (typeof basisRevision !== 'string' || !OBJECT_NAME.test(basisRevision)) {
    return {
      preserved: false,
      refusal: CarryForwardRefusal.NO_CONFORMING_BASIS,
      detail:
        'the prior coChange block carries no full-length lowercase object name, so it cannot be recounted against and reads as legacy/unknown',
    };
  }

  // The elements are passed through untouched, which is what makes the
  // byte-for-byte guarantee real — see the note on PreservedHistory.
  return { preserved: true, history: { basisRevision, coChange } };
}
