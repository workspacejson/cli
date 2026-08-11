/**
 * The provisional producer-profile selection rule: threshold, rank, cap.
 *
 * Named behavior, not a numbered requirement — only REQ-001..006 are written
 * down for this package, and inventing an identifier would read as a citation
 * to something that does not exist.
 *
 * Every expectation is computed by hand from the ruling, before the
 * implementation existed. None was read off what the code returned.
 */
import { describe, expect, it } from 'vitest';
import { CompletenessReason, CompletenessState, completeness } from './completeness.js';
import { DEFAULT_MIN_SUPPORT, type ScoredPair, type ScoredSet } from './score.js';
import {
  RANKING_RULE,
  SELECTION_CAP,
  type SelectionResult,
  compareUtf8,
  select,
} from './select.js';
import { serializeSelection } from './serialize.js';

const OID = 'a'.repeat(40);

function pair(files: [string, string], support: number, occurrences: number): ScoredPair {
  return { files, support, occurrences, weightedSupport: support * 0.7215 };
}

function scoredSet(pairs: readonly ScoredPair[], minSupport = 1): ScoredSet {
  return {
    l0ScoreVersion: 1,
    completeness: completeness(
      pairs.length > 0
        ? CompletenessState.QUALIFYING_RELATIONSHIP_OBSERVED
        : CompletenessState.MINED_NO_QUALIFYING_RELATIONSHIP,
      CompletenessReason.MINED,
      'fixture',
    ),
    basisWindow: {
      basisRevision: 'HEAD',
      basisCommit: OID,
      windowTransitions: 500,
      availableTransitions: 634,
      extractedTransitions: 500,
      windowTruncated: true,
    },
    scoringBasis: {
      weightingVersion: 'META-289 v2.2.1',
      sizeWeightNumerator: 10,
      positionDecayHalfLife: 250,
      maxScoredFileCount: 50,
      basisRevision: OID,
      windowOldestCommit: '0'.repeat(40),
      windowNewestCommit: '3'.repeat(40),
      decayOriginPosition: 499,
    },
    exclusions: {
      maxFileCount: 50,
      scoredEventCount: 500,
      excludedEventCount: 0,
      excludedCommits: [],
    },
    pairs,
    minSupport,
  };
}

/** N synthetic pairs with strictly descending support, so ranking is unambiguous. */
function descending(count: number): ScoredPair[] {
  return Array.from({ length: count }, (_, i) =>
    pair([`src/a${String(i).padStart(4, '0')}.ts`, `src/b${String(i).padStart(4, '0')}.ts`], count - i, count + 10),
  );
}

function keys(result: SelectionResult): string[] {
  return result.pairs.map((p) => p.files.join('|'));
}

describe('selection rule: threshold', () => {
  it('applies the frozen support threshold and drops everything below it', () => {
    const input = scoredSet([
      pair(['src/a.ts', 'src/b.ts'], 5, 10),
      pair(['src/c.ts', 'src/d.ts'], 3, 10),
      pair(['src/e.ts', 'src/f.ts'], 2, 10),
      pair(['src/g.ts', 'src/h.ts'], 1, 10),
    ]);
    const result = select(input);

    expect(DEFAULT_MIN_SUPPORT).toBe(3);
    expect(result.receipt.minSupport).toBe(3);
    // support 2 and 1 are below the frozen threshold.
    expect(result.pairs.map((p) => p.support)).toEqual([5, 3]);
    expect(result.receipt.pairsBeforeCap).toBe(2);
  });

  it('refuses a scored set already filtered above the selection threshold', () => {
    // The input has silently lost pairs the selection needed. Selecting from it
    // would under-count without saying so, which is the same defect class as
    // reporting zero for a shallow clone.
    const input = scoredSet([pair(['src/a.ts', 'src/b.ts'], 9, 10)], 5);
    expect(() => select(input, { minSupport: 3 })).toThrow(/threshold/i);
  });
});

describe('selection rule: ranking', () => {
  it('ranks by support descending', () => {
    const input = scoredSet([
      pair(['src/a.ts', 'src/b.ts'], 3, 10),
      pair(['src/c.ts', 'src/d.ts'], 9, 10),
      pair(['src/e.ts', 'src/f.ts'], 6, 10),
    ]);
    expect(select(input).pairs.map((p) => p.support)).toEqual([9, 6, 3]);
  });

  it('breaks a support tie by occurrences ascending — the tighter pair first', () => {
    const input = scoredSet([
      pair(['src/a.ts', 'src/b.ts'], 7, 300),
      pair(['src/c.ts', 'src/d.ts'], 7, 12),
      pair(['src/e.ts', 'src/f.ts'], 7, 90),
    ]);
    expect(select(input).pairs.map((p) => p.occurrences)).toEqual([12, 90, 300]);
  });

  it('breaks a (support, occurrences) tie by files ascending in UTF-8 BYTE order', () => {
    // The discriminating case. U+E000 encodes as EE 80 80; U+1F600 as F0 9F 98 80.
    // In UTF-8 bytes, EE < F0, so the private-use path sorts FIRST.
    // In UTF-16 code units — what a bare `<` on a JS string gives — the emoji is
    // a surrogate pair starting 0xD83D, and 0xD83D < 0xE000, so the EMOJI sorts
    // first. The two orders are opposite, which is what makes this a real test
    // of the ruling rather than a restatement of the default comparator.
    const privateUse = 'src/.ts';
    const astral = 'src/\u{1F600}.ts';
    expect(astral < privateUse).toBe(true); // UTF-16 says emoji first
    expect(compareUtf8(privateUse, astral)).toBeLessThan(0); // UTF-8 says private-use first

    const input = scoredSet([
      pair([astral, 'src/z.ts'], 4, 20),
      pair([privateUse, 'src/z.ts'], 4, 20),
    ]);
    expect(select(input).pairs[0]!.files[0]).toBe(privateUse);
  });

  it('breaks a files[0] tie by files[1], also in UTF-8 byte order', () => {
    const input = scoredSet([
      pair(['src/a.ts', 'src/\u{1F600}.ts'], 4, 20),
      pair(['src/a.ts', 'src/.ts'], 4, 20),
    ]);
    expect(select(input).pairs.map((p) => p.files[1])).toEqual(['src/.ts', 'src/\u{1F600}.ts']);
  });

  it('is a total order: a shuffled input produces an identical result', () => {
    const base = descending(120);
    // Many exact ties on both integer keys, so keys 3 and 4 do the work.
    const tied = Array.from({ length: 40 }, (_, i) =>
      pair([`t/p${String(i).padStart(3, '0')}.ts`, 't/q.ts'], 4, 40),
    );
    const all = [...base, ...tied];
    const shuffled = [...all];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = (i * 7919 + 13) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    expect(keys(select(scoredSet(shuffled)))).toEqual(keys(select(scoredSet(all))));
  });

  it('publishes the complete ranking rule as a string', () => {
    expect(RANKING_RULE).toMatch(/support/i);
    expect(RANKING_RULE).toMatch(/occurrences/i);
    expect(RANKING_RULE).toMatch(/utf-8/i);
    expect(select(scoredSet(descending(5))).receipt.rankingRule).toBe(RANKING_RULE);
  });
});

describe('selection rule: cap', () => {
  it('caps at 50 and applies the cap AFTER ranking', () => {
    expect(SELECTION_CAP).toBe(50);
    const result = select(scoredSet(descending(120)));
    expect(result.pairs).toHaveLength(50);
    // Ranking first means the 50 kept are the 50 highest-support, so the
    // smallest support emitted is 120 - 49 = 71. Capping before ranking would
    // have kept an arbitrary 50 and this number would be wrong.
    expect(result.pairs[0]!.support).toBe(120);
    expect(result.pairs[49]!.support).toBe(71);
  });

  it('does not cap when the ranked list is shorter than the cap', () => {
    // 12 synthetic pairs at supports 12..1; the threshold of 3 removes the two
    // at supports 2 and 1, leaving 10. Well under the cap, so nothing is cut.
    const result = select(scoredSet(descending(12)));
    expect(result.pairs).toHaveLength(10);
    expect(result.receipt.pairsBeforeCap).toBe(10);
    expect(result.receipt.capBound).toBe(false);
  });
});

describe('selection rule: execution receipt', () => {
  it('records the threshold, both counts, the cap, the rule, and whether the cap bound', () => {
    const result = select(scoredSet(descending(120)));
    expect(result.receipt).toEqual({
      minSupport: 3,
      pairsBeforeCap: 118, // 120 synthetic pairs, two below support 3
      pairsEmitted: 50,
      cap: 50,
      rankingRule: RANKING_RULE,
      capBound: true,
    });
  });

  it('makes a truncated list visibly truncated rather than silently short', () => {
    const truncated = select(scoredSet(descending(120))).receipt;
    expect(truncated.capBound).toBe(true);
    expect(truncated.pairsEmitted).toBeLessThan(truncated.pairsBeforeCap);

    const whole = select(scoredSet(descending(12))).receipt;
    expect(whole.capBound).toBe(false);
    expect(whole.pairsEmitted).toBe(whole.pairsBeforeCap);
  });

  it('keeps pairsEmitted equal to min(pairsBeforeCap, cap) in both directions', () => {
    for (const n of [0, 1, 49, 50, 51, 400]) {
      const r = select(scoredSet(descending(n + 2))).receipt;
      expect(r.pairsEmitted).toBe(Math.min(r.pairsBeforeCap, r.cap));
      expect(r.capBound).toBe(r.pairsBeforeCap > r.cap);
    }
  });
});

describe('selection rule: preservation', () => {
  it('does not mutate the scored set, and leaves the uncapped result complete', () => {
    const input = scoredSet(descending(120));
    const before = input.pairs.length;
    const beforeFirst = input.pairs[0]!.weightedSupport;

    const result = select(input);

    // Capping is a presentation step. The audit trail upstream is untouched.
    expect(input.pairs).toHaveLength(before);
    expect(input.pairs[0]!.weightedSupport).toBe(beforeFirst);
    expect(result.pairs).toHaveLength(50);
    // And the counts the receipt reports agree with what survived upstream.
    expect(input.pairs.filter((p) => p.support >= 3)).toHaveLength(result.receipt.pairsBeforeCap);
  });

  it('carries the basis pin, the window and the scoring exclusions through', () => {
    const input = scoredSet(descending(10));
    const result = select(input);
    expect(result.scoringBasis).toEqual(input.scoringBasis);
    expect(result.basisWindow).toEqual(input.basisWindow);
    expect(result.exclusions).toEqual(input.exclusions);
  });
});

describe('selection rule: no floats reach the artifact', () => {
  it('emits no weightedSupport, and no float, on a selected pair', () => {
    const result = select(scoredSet(descending(10)));
    for (const p of result.pairs) {
      expect(Object.keys(p).sort()).toEqual(['files', 'occurrences', 'support']);
      expect('weightedSupport' in p).toBe(false);
      expect(Number.isInteger(p.support)).toBe(true);
      expect(Number.isInteger(p.occurrences)).toBe(true);
    }
  });

  it('serializes with every number an integer', () => {
    const text = serializeSelection(select(scoredSet(descending(120))));
    expect(text).not.toContain('weightedSupport');
    // No decimal point and no exponent anywhere in the emitted numbers.
    for (const [, literal] of text.matchAll(/:(-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)/g)) {
      expect(Number.isInteger(Number(literal))).toBe(true);
    }
  });

  it('refuses to serialize a float rather than rounding or dropping it', () => {
    const result = select(scoredSet(descending(5)));
    // A float smuggled in by a future caller must fail loudly. Rounding it
    // would be the churn class the float prohibition exists to prevent.
    const contaminated = {
      ...result,
      pairs: [{ ...result.pairs[0]!, support: 3.5 }],
    } as unknown as SelectionResult;
    expect(() => serializeSelection(contaminated)).toThrow(/integer/i);
  });
});

describe('selection rule: honest degradation', () => {
  it('passes a non-mined completeness through with no pairs and an honest receipt', () => {
    const shallow: ScoredSet = {
      l0ScoreVersion: 1,
      completeness: completeness(
        CompletenessState.NOT_MINED,
        CompletenessReason.SHALLOW_CLONE,
        'shallow',
      ),
      exclusions: {
        maxFileCount: 50,
        scoredEventCount: 0,
        excludedEventCount: 0,
        excludedCommits: [],
      },
      pairs: [],
      minSupport: 3,
    };
    const result = select(shallow);
    expect(result.completeness.state).toBe(CompletenessState.NOT_MINED);
    expect(result.completeness.reason).toBe(CompletenessReason.SHALLOW_CLONE);
    expect(result.pairs).toEqual([]);
    expect(result.scoringBasis).toBeUndefined();
    // The receipt is still complete: an empty list from a repository that was
    // never examined must not look like an empty list from one that was.
    expect(result.receipt.pairsBeforeCap).toBe(0);
    expect(result.receipt.pairsEmitted).toBe(0);
    expect(result.receipt.cap).toBe(50);
    expect(result.receipt.capBound).toBe(false);
  });

  it('distinguishes examined-and-empty from not-examined at the receipt level', () => {
    const examined = select(scoredSet([pair(['src/a.ts', 'src/b.ts'], 1, 9)]));
    // Mining ran; nothing cleared the threshold.
    expect(examined.completeness.state).toBe(CompletenessState.MINED_NO_QUALIFYING_RELATIONSHIP);
    expect(examined.pairs).toEqual([]);
    // And unlike the shallow case, the basis is pinned — the reader can tell.
    expect(examined.scoringBasis).toBeDefined();
  });
});
