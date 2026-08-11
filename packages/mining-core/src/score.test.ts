/**
 * Phase 3: the weighting, the scoring exclusion, bounded scoring cost, and
 * basis pinning. Named behaviors — only REQ-001..006 are written down.
 *
 * Every expectation here is a number written down before the implementation
 * existed, computed by hand from META-289 v2.2.1's frozen weighting and from
 * the ratified observation-form definitions in the standard's A-009 amendment.
 * None of them was read off whatever the code happened to return.
 */
import { describe, expect, it } from 'vitest';
import { CompletenessReason, CompletenessState, completeness } from './completeness.js';
import type { CommitEvent } from './git.js';
import { type ObservationSet, mine } from './mine.js';
import { PATH_NORMALIZATION_ASSUMPTIONS } from './paths.js';
import {
  DEFAULT_MIN_SUPPORT,
  POSITION_DECAY_HALF_LIFE,
  SCORING_MAX_FILE_COUNT,
  SIZE_WEIGHT_NUMERATOR,
  WEIGHTING_VERSION,
  positionDecay,
  score,
  sizeWeight,
} from './score.js';
import { serializeScoredSet } from './serialize.js';
import {
  makeCoupledRepo,
  makeShallowCloneOfCoupled,
  removeDir,
} from './testing/fixtures.js';

/** A 40-hex object id shape, so pinning can be asserted without a repository. */
const OID_A = 'a'.repeat(40);
const OID_B = 'b'.repeat(40);

function event(position: number, files: readonly string[], commit: string): CommitEvent {
  const sorted = [...new Set(files)].sort();
  return {
    commit,
    parent: OID_B,
    files: sorted,
    fileCount: sorted.length,
    position,
  };
}

function manyFiles(count: number, extra: readonly string[]): string[] {
  const generated = Array.from({ length: count - extra.length }, (_, i) =>
    `bulk/f${String(i).padStart(3, '0')}.ts`,
  );
  return [...extra, ...generated];
}

/**
 * The hand-computed fixture.
 *
 * position 0: [a, b]                       fileCount 2   scored
 * position 1: [a, c]                       fileCount 2   scored
 * position 2: [a, b, ...58 more]           fileCount 60  EXCLUDED (> 50)
 * position 3: [a, b]                       fileCount 2   scored, and the basis
 *
 * Newest extracted position is 3, so Δpos is 3, 2, 1, 0 respectively — and
 * critically, position 2 dropping out of scoring must not renumber the others.
 */
function observations(
  overrides: Partial<ObservationSet> = {},
  // `exactOptionalPropertyTypes` makes an explicit `undefined` a different
  // thing from an absent key, and "no window to pin" is the absent key. So the
  // helper deletes it rather than letting a caller pass `undefined`.
  dropBasisWindow = false,
): ObservationSet {
  const events: CommitEvent[] = [
    event(0, ['src/a.ts', 'src/b.ts'], '0'.repeat(40)),
    event(1, ['src/a.ts', 'src/c.ts'], '1'.repeat(40)),
    event(2, manyFiles(60, ['src/a.ts', 'src/b.ts']), '2'.repeat(40)),
    event(3, ['src/a.ts', 'src/b.ts'], '3'.repeat(40)),
  ];
  const built: ObservationSet = {
    l0Version: 1,
    completeness: completeness(
      CompletenessState.QUALIFYING_RELATIONSHIP_OBSERVED,
      CompletenessReason.MINED,
      'fixture',
    ),
    basisWindow: {
      basisRevision: 'HEAD',
      basisCommit: OID_A,
      windowTransitions: 500,
      availableTransitions: 4,
      extractedTransitions: 4,
      windowTruncated: false,
    },
    events,
    pairs: [],
    qualifyingMinCooccurrence: 1,
    pathNormalization: PATH_NORMALIZATION_ASSUMPTIONS,
    ...overrides,
  };
  if (!dropBasisWindow) return built;
  const { basisWindow: _absent, ...withoutWindow } = built;
  return withoutWindow;
}

describe('weighting: v2.2.1, implemented verbatim', () => {
  it('size_weight is min(1, 10/fileCount)', () => {
    expect(SIZE_WEIGHT_NUMERATOR).toBe(10);
    // Below the numerator the weight saturates at 1 — it never exceeds it.
    expect(sizeWeight(1)).toBe(1);
    expect(sizeWeight(2)).toBe(1);
    expect(sizeWeight(10)).toBe(1);
    // Above it the weight is the ratio, exactly.
    expect(sizeWeight(20)).toBe(0.5);
    expect(sizeWeight(50)).toBe(0.2);
    expect(sizeWeight(100)).toBe(0.1);
  });

  it('position_decay is 2^(-dPos/250)', () => {
    expect(POSITION_DECAY_HALF_LIFE).toBe(250);
    // At the basis there is no decay at all.
    expect(positionDecay(0)).toBe(1);
    // One half-life back is exactly one half.
    expect(positionDecay(250)).toBeCloseTo(0.5, 12);
    // The far edge of a full 500-transition window is a quarter.
    expect(positionDecay(500)).toBeCloseTo(0.25, 12);
    // Monotone decreasing, never negative, never zero inside the window.
    expect(positionDecay(1)).toBeLessThan(1);
    expect(positionDecay(499)).toBeGreaterThan(positionDecay(500));
    expect(positionDecay(500)).toBeGreaterThan(0);
  });

  it('excludes events with fileCount > 50 from scoring, and includes exactly 50', () => {
    expect(SCORING_MAX_FILE_COUNT).toBe(50);

    const boundary = observations({
      events: [
        event(0, manyFiles(50, ['src/d.ts', 'src/e.ts']), '0'.repeat(40)),
        event(1, manyFiles(51, ['src/f.ts', 'src/g.ts']), '1'.repeat(40)),
      ],
    });
    const result = score(boundary, { minSupport: 1 });

    expect(result.exclusions.scoredEventCount).toBe(1);
    expect(result.exclusions.excludedEventCount).toBe(1);
    expect(result.exclusions.excludedCommits).toEqual(['1'.repeat(40)]);

    const paths = result.pairs.flatMap((p) => [...p.files]);
    // The 50-file event was scored, so its pairs exist.
    expect(paths).toContain('src/d.ts');
    // The 51-file event was not, so its pairs do not.
    expect(paths).not.toContain('src/f.ts');
  });

  it('preserves every extracted event on the input while excluding at scoring time', () => {
    const input = observations();
    const result = score(input, { minSupport: 1 });

    // Extraction-time preservation: the excluded event is still in the input.
    expect(input.events).toHaveLength(4);
    expect(input.events.some((e) => e.fileCount > SCORING_MAX_FILE_COUNT)).toBe(true);
    // Scoring-time exclusion: it is accounted for, by commit, not silently dropped.
    expect(result.exclusions.excludedEventCount).toBe(1);
    expect(result.exclusions.excludedCommits).toEqual(['2'.repeat(40)]);
    expect(result.exclusions.scoredEventCount).toBe(3);
  });

  it('measures dPos from the newest EXTRACTED event and never renumbers after exclusion', () => {
    const result = score(observations(), { minSupport: 1 });
    const ab = result.pairs.find((p) => p.files[1] === 'src/b.ts');
    expect(ab).toBeDefined();

    // (a,b) is scored at positions 0 and 3 only — position 2 is excluded.
    // Newest EXTRACTED position is 3, so dPos is 3 and 0.
    const expected = sizeWeight(2) * positionDecay(3) + sizeWeight(2) * positionDecay(0);
    expect(ab!.weightedSupport).toBeCloseTo(expected, 12);

    // If exclusion had renumbered the surviving events 0,1,2 the newest would be
    // 2 and this is the value that would have been produced instead. It must not
    // be. The two differ in the fourth decimal, which is enough to discriminate.
    const renumbered = sizeWeight(2) * positionDecay(2) + sizeWeight(2) * positionDecay(0);
    expect(ab!.weightedSupport).not.toBeCloseTo(renumbered, 4);
  });

  it('counts support as both-changed and occurrences as the symmetric union', () => {
    const result = score(observations(), { minSupport: 1 });
    const byPair = new Map(result.pairs.map((p) => [p.files.join('|'), p]));

    // (a,b): both changed at scored positions 0 and 3.
    const ab = byPair.get('src/a.ts|src/b.ts');
    expect(ab?.support).toBe(2);
    // Union: a or b changed at scored positions 0, 1 and 3.
    expect(ab?.occurrences).toBe(3);

    // (a,c): both changed at scored position 1 only.
    const ac = byPair.get('src/a.ts|src/c.ts');
    expect(ac?.support).toBe(1);
    // Union is still 0, 1 and 3, because a changed in all three.
    expect(ac?.occurrences).toBe(3);

    // (b,c) never co-occurred, so it is absent — not present with support 0.
    expect(byPair.has('src/b.ts|src/c.ts')).toBe(false);
  });

  it('holds the standard A-009 invariants on every emitted pair', () => {
    const result = score(observations(), { minSupport: 1 });
    expect(result.pairs.length).toBeGreaterThan(0);
    for (const pair of result.pairs) {
      // Enforced by validate(), not by the schema — so it is enforced here.
      expect(pair.support).toBeLessThanOrEqual(pair.occurrences);
      // Observation-form minimum: a pair whose union is empty was never observed.
      expect(pair.occurrences).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(pair.support)).toBe(true);
      expect(Number.isInteger(pair.occurrences)).toBe(true);
      expect(pair.files).toHaveLength(2);
      expect(pair.files[0] < pair.files[1]).toBe(true);
    }
  });

  it('adopts v2.2.1 support >= 3 as the default and records the value used', () => {
    expect(DEFAULT_MIN_SUPPORT).toBe(3);
    const result = score(observations());
    expect(result.minSupport).toBe(3);
    // The fixture's best pair has support 2, so nothing qualifies at 3.
    expect(result.pairs).toHaveLength(0);
    // And that is state 2 — mining ran, nothing qualified. Not a new state,
    // and not state 3 with an empty list.
    expect(result.completeness.state).toBe(CompletenessState.MINED_NO_QUALIFYING_RELATIONSHIP);
    expect(result.completeness.reason).toBe(CompletenessReason.MINED);
  });

  it('reports state 3 when a pair does clear the threshold', () => {
    const result = score(observations(), { minSupport: 2 });
    expect(result.pairs).toHaveLength(1);
    expect(result.completeness.state).toBe(CompletenessState.QUALIFYING_RELATIONSHIP_OBSERVED);
  });
});

describe('honest degradation: never a reduced-magnitude answer', () => {
  it('passes NOT_MINED straight through and emits no pairs and no basis', () => {
    const shallow: ObservationSet = {
      l0Version: 1,
      completeness: completeness(
        CompletenessState.NOT_MINED,
        CompletenessReason.SHALLOW_CLONE,
        'shallow',
      ),
      events: [],
      pairs: [],
      qualifyingMinCooccurrence: 1,
      pathNormalization: PATH_NORMALIZATION_ASSUMPTIONS,
    };
    const result = score(shallow, { minSupport: 1 });
    expect(result.completeness.state).toBe(CompletenessState.NOT_MINED);
    expect(result.completeness.reason).toBe(CompletenessReason.SHALLOW_CLONE);
    expect(result.pairs).toEqual([]);
    expect(result.scoringBasis).toBeUndefined();
  });

  it('refuses to score events handed to it under a non-mined completeness', () => {
    // The AP-1 shape: events are present, but completeness says they are not a
    // claim about the repository. Scoring them would manufacture a confident,
    // structurally identical, wrong answer at reduced magnitude — exactly the
    // --depth 1 defect. The scorer must key on completeness, not on whether an
    // events array happens to be non-empty.
    const truncated = observations({
      completeness: completeness(
        CompletenessState.NOT_MINED,
        CompletenessReason.SHALLOW_CLONE,
        'shallow clone with visible events',
      ),
    });
    const result = score(truncated, { minSupport: 1 });
    expect(result.pairs).toEqual([]);
    expect(result.exclusions.scoredEventCount).toBe(0);
  });

  it('a --depth 1 clone scores to NOT_MINED where the full clone scores pairs', async () => {
    const { source, shallow } = makeShallowCloneOfCoupled();
    try {
      const full = score(await mine(source), { minSupport: 1 });
      const clipped = score(await mine(shallow), { minSupport: 1 });

      // The full history has the coupling.
      expect(full.completeness.state).toBe(CompletenessState.QUALIFYING_RELATIONSHIP_OBSERVED);
      expect(full.pairs.length).toBeGreaterThan(0);

      // The clone does not report the same pairs at lower support. It reports
      // that it did not look.
      expect(clipped.completeness.state).toBe(CompletenessState.NOT_MINED);
      expect(clipped.completeness.reason).toBe(CompletenessReason.SHALLOW_CLONE);
      expect(clipped.pairs).toEqual([]);
    } finally {
      removeDir(source);
      removeDir(shallow);
    }
  });
});

describe('basis pinning', () => {
  it('pins a full-length lowercase object name, never a symbolic ref', () => {
    const result = score(observations(), { minSupport: 1 });
    expect(result.scoringBasis).toBeDefined();
    // The standard's A-009 pattern for generated.basisRevision.
    expect(result.scoringBasis!.basisRevision).toMatch(/^([0-9a-f]{40}|[0-9a-f]{64})$/);
    // Specifically the resolved commit, not the requested revision string.
    expect(result.scoringBasis!.basisRevision).toBe(OID_A);
    expect(result.scoringBasis!.basisRevision).not.toBe('HEAD');
  });

  it('rejects a basis that is not a full-length object name rather than emitting it', () => {
    const abbreviated = observations({
      basisWindow: {
        basisRevision: 'HEAD',
        basisCommit: 'abc1234',
        windowTransitions: 500,
        availableTransitions: 4,
        extractedTransitions: 4,
        windowTruncated: false,
      },
    });
    expect(() => score(abbreviated, { minSupport: 1 })).toThrow(/basis/i);
  });

  it('pins both edges of the scored window and the decay origin', () => {
    const result = score(observations(), { minSupport: 1 });
    const basis = result.scoringBasis!;
    // Oldest extracted commit, position 0.
    expect(basis.windowOldestCommit).toBe('0'.repeat(40));
    // Newest extracted commit, which is the basis end of the window.
    expect(basis.windowNewestCommit).toBe('3'.repeat(40));
    // Δpos is measured from here, and it is an extracted position.
    expect(basis.decayOriginPosition).toBe(3);
  });

  it('records the frozen weighting so a score is attributable to a named ruleset', () => {
    const basis = score(observations(), { minSupport: 1 }).scoringBasis!;
    expect(basis.weightingVersion).toBe(WEIGHTING_VERSION);
    expect(basis.sizeWeightNumerator).toBe(10);
    expect(basis.positionDecayHalfLife).toBe(250);
    expect(basis.maxScoredFileCount).toBe(50);
    // The recorded numbers are the numbers the functions actually use.
    expect(sizeWeight(basis.sizeWeightNumerator * 2)).toBe(0.5);
    expect(positionDecay(basis.positionDecayHalfLife)).toBeCloseTo(0.5, 12);
  });

  it('emits no scoringBasis when there is no window to pin', () => {
    const unmined = observations(
      {
        completeness: completeness(
          CompletenessState.NOT_MINED,
          CompletenessReason.NO_COMMITS,
          'no commits',
        ),
      },
      true,
    );
    // Absence, not a placeholder that reads as a real pin.
    expect(score(unmined, { minSupport: 1 }).scoringBasis).toBeUndefined();
  });

  it('two runs at the same pin agree byte for byte', async () => {
    const repo = makeCoupledRepo();
    try {
      const first = serializeScoredSet(score(await mine(repo), { minSupport: 1 }));
      const second = serializeScoredSet(score(await mine(repo), { minSupport: 1 }));
      expect(first).toBe(second);
      expect(first).toContain('"weightedSupport"');
    } finally {
      removeDir(repo);
    }
  });

  it('sorts pairs by path, which is a total order and not a ranking', () => {
    const result = score(observations(), { minSupport: 1 });
    const keys = result.pairs.map((p) => p.files.join('|'));
    expect(keys).toEqual([...keys].sort());
    // Deliberately NOT ordered by support — the ranking rule is undecided and
    // an accidental order would be read as one.
    expect(result.pairs.map((p) => p.support)).toEqual([2, 1]);
  });
});

describe('scoring cost is bounded and is not the runtime problem', () => {
  it('scores a full 500-transition window well under a second', () => {
    // Extraction spends two git processes per commit; scoring spends none. This
    // separates the two costs so the measured wall-clock number can be
    // attributed correctly rather than blamed on whichever half is newer.
    const events: CommitEvent[] = Array.from({ length: 500 }, (_, position) =>
      event(
        position,
        [`src/m${position % 40}.ts`, `src/n${position % 37}.ts`, `test/t${position % 23}.ts`],
        String(position).padStart(40, '0'),
      ),
    );
    const input = observations({
      events,
      basisWindow: {
        basisRevision: 'HEAD',
        basisCommit: OID_A,
        windowTransitions: 500,
        availableTransitions: 900,
        extractedTransitions: 500,
        windowTruncated: true,
      },
    });

    const started = performance.now();
    const result = score(input, { minSupport: 1 });
    const elapsed = performance.now() - started;

    expect(result.exclusions.scoredEventCount).toBe(500);
    expect(result.pairs.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(1000);
  });

  it('records that the window bound, so truncation is a fact and not an error', () => {
    const input = observations({
      basisWindow: {
        basisRevision: 'HEAD',
        basisCommit: OID_A,
        windowTransitions: 500,
        availableTransitions: 634,
        extractedTransitions: 500,
        windowTruncated: true,
      },
    });
    const result = score(input, { minSupport: 1 });
    // A repository longer than the window is VALID. The bounded window is
    // recorded; it is not a completeness failure.
    expect(result.completeness.state).toBe(CompletenessState.QUALIFYING_RELATIONSHIP_OBSERVED);
    expect(result.basisWindow?.windowTruncated).toBe(true);
    expect(result.basisWindow?.availableTransitions).toBe(634);
    expect(result.basisWindow?.extractedTransitions).toBe(500);
  });
});
