/**
 * L1 projection — repo-native, and pure by construction.
 *
 * Nothing here touches a schema, a validator or a filesystem, which is why it
 * runs inside the workspace against its ordinary dependencies. The projection's
 * *conformance* to the amended schema is a different claim, measured in the
 * packed-candidate environment; what is measured here is the shape it produces
 * and the rules it applies to produce it.
 */
import { describe, expect, it } from 'vitest';
import { CompletenessReason, CompletenessState, completeness } from './completeness.js';
import { ProjectionRefusal, project } from './project.js';
import type { SelectionResult } from './select.js';
import { RANKING_RULE } from './select.js';

const BASIS = '3c9a0f14b7e25d8613af04c2e9b7d5081f6a2c3d';

function selection(
  pairs: Array<{ files: [string, string]; support: number; occurrences: number }>,
  over: Partial<SelectionResult> = {},
): SelectionResult {
  return {
    l0SelectionVersion: 1,
    completeness: completeness(
      pairs.length > 0
        ? CompletenessState.QUALIFYING_RELATIONSHIP_OBSERVED
        : CompletenessState.MINED_NO_QUALIFYING_RELATIONSHIP,
      CompletenessReason.MINED,
      'fixture',
    ),
    scoringBasis: {
      weightingVersion: 'v2.2.1',
      sizeWeightNumerator: 1,
      positionDecayHalfLife: 1,
      maxScoredFileCount: 50,
      basisRevision: BASIS,
    } as SelectionResult['scoringBasis'],
    exclusions: {} as SelectionResult['exclusions'],
    receipt: {
      minSupport: 3,
      pairsBeforeCap: pairs.length,
      pairsEmitted: pairs.length,
      cap: 50,
      rankingRule: RANKING_RULE,
      capBound: false,
    },
    pairs,
    ...over,
  } as SelectionResult;
}

describe('project — the artifact shape', () => {
  it('emits exactly files, support and occurrences', () => {
    const result = project(selection([{ files: ['a.ts', 'b.ts'], support: 4, occurrences: 10 }]));
    expect(result.projected).toBe(true);
    if (!result.projected) return;
    expect(Object.keys(result.history.coChange[0]!).sort()).toEqual([
      'files',
      'occurrences',
      'support',
    ]);
  });

  it('stores no derived value — no rate, probability, lift or ranking', () => {
    const result = project(selection([{ files: ['a.ts', 'b.ts'], support: 4, occurrences: 10 }]));
    if (!result.projected) throw new Error('expected a projection');
    const entry = result.history.coChange[0] as unknown as Record<string, unknown>;
    for (const forbidden of ['rate', 'probability', 'lift', 'confidence', 'rank', 'weightedSupport']) {
      expect(forbidden in entry).toBe(false);
    }
  });

  it('omits the A-010 classification flag rather than asserting a constant', () => {
    // The pre-A-010 producer emitted `generated: false` for every pair, which
    // claimed that a lockfile and its manifest are a real source coupling.
    // Absence is the honest output for a producer with no classifier.
    const result = project(
      selection([{ files: ['package.json', 'pnpm-lock.yaml'], support: 9, occurrences: 9 }]),
    );
    if (!result.projected) throw new Error('expected a projection');
    expect('generated' in (result.history.coChange[0] as object)).toBe(false);
  });

  it('carries the basis pin at block level, never per entry', () => {
    const result = project(
      selection([
        { files: ['a.ts', 'b.ts'], support: 4, occurrences: 10 },
        { files: ['c.ts', 'd.ts'], support: 3, occurrences: 8 },
      ]),
    );
    if (!result.projected) throw new Error('expected a projection');
    expect(result.history.basisRevision).toBe(BASIS);
    for (const entry of result.history.coChange) {
      expect('basisRevision' in (entry as object)).toBe(false);
    }
  });

  it('preserves the selection ranking rather than re-sorting the array', () => {
    // Re-sorting here would silently discard threshold-then-rank-then-cap.
    const result = project(
      selection([
        { files: ['z.ts', 'y.ts'], support: 9, occurrences: 12 },
        { files: ['a.ts', 'b.ts'], support: 3, occurrences: 8 },
      ]),
    );
    if (!result.projected) throw new Error('expected a projection');
    expect(result.history.coChange[0]!.support).toBe(9);
    expect(result.history.coChange[1]!.support).toBe(3);
  });
});

describe('project — canonical endpoint order', () => {
  it('orders endpoints ascending, whichever way they arrive', () => {
    const forward = project(selection([{ files: ['a.ts', 'b.ts'], support: 4, occurrences: 10 }]));
    const reversed = project(selection([{ files: ['b.ts', 'a.ts'], support: 4, occurrences: 10 }]));
    if (!forward.projected || !reversed.projected) throw new Error('expected projections');
    expect(forward.history.coChange[0]!.files).toEqual(['a.ts', 'b.ts']);
    expect(reversed.history.coChange[0]!.files).toEqual(['a.ts', 'b.ts']);
  });

  it('ENDPOINT REVERSAL YIELDS IDENTICAL BYTES — the producer-profile obligation', () => {
    const forward = project(selection([{ files: ['src/auth.ts', 'src/session.ts'], support: 8, occurrences: 24 }]));
    const reversed = project(selection([{ files: ['src/session.ts', 'src/auth.ts'], support: 8, occurrences: 24 }]));
    if (!forward.projected || !reversed.projected) throw new Error('expected projections');
    expect(JSON.stringify(forward.history)).toBe(JSON.stringify(reversed.history));
  });

  it('uses UTF-8 BYTE order, not UTF-16 code unit order', () => {
    // The two disagree here and only here-shaped cases: U+1F600 is a surrogate
    // pair beginning 0xD83D, which sorts BEFORE U+E000 in UTF-16, while its
    // UTF-8 encoding (F0 9F 98 80) sorts AFTER U+E000's (EE 80 80). A producer
    // ordering with `<` would emit these two endpoints the other way round.
    const emoji = 'src/\u{1F600}.ts';
    const privateUse = 'src/.ts';
    expect(emoji < privateUse).toBe(true); // UTF-16 says emoji first…

    const result = project(selection([{ files: [emoji, privateUse], support: 4, occurrences: 10 }]));
    if (!result.projected) throw new Error('expected a projection');
    expect(result.history.coChange[0]!.files).toEqual([privateUse, emoji]); // …UTF-8 says otherwise
  });
});

describe('project — refusal rather than degradation', () => {
  it('refuses a shallow clone, and does not emit an empty array', () => {
    // A PINNED empty array is a positive finding under A-009: "the analysis ran
    // and found nothing." Emitting one for a repository that could not be
    // analyzed would state a result nobody measured.
    const result = project(
      selection([], {
        completeness: completeness(
          CompletenessState.NOT_MINED,
          CompletenessReason.SHALLOW_CLONE,
          'shallow',
        ),
      }),
    );
    expect(result.projected).toBe(false);
    if (result.projected) return;
    expect(result.refusal).toBe(ProjectionRefusal.NOT_MINED);
  });

  it('refuses when no basis pin exists', () => {
    // The key is REMOVED rather than set to `undefined`: under
    // `exactOptionalPropertyTypes` those are different states, and an unpinned
    // selection is one whose basis is absent, not one carrying an explicit
    // undefined.
    const pinned = selection([{ files: ['a.ts', 'b.ts'], support: 4, occurrences: 10 }]);
    const { scoringBasis: _dropped, ...unpinned } = pinned;
    const result = project(unpinned as typeof pinned);
    expect(result.projected).toBe(false);
    if (result.projected) return;
    expect(result.refusal).toBe(ProjectionRefusal.NO_BASIS_PIN);
  });

  it('DOES emit a pinned empty array when the analysis genuinely found nothing', () => {
    const result = project(selection([]));
    expect(result.projected).toBe(true);
    if (!result.projected) return;
    expect(result.history.coChange).toEqual([]);
    expect(result.history.basisRevision).toBe(BASIS);
  });
});
