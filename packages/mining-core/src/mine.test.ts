/** REQ-004 determinism, REQ-005 four completeness states, REQ-006 shallow clone. */
import { afterAll, describe, expect, it } from 'vitest';
import { CompletenessReason, CompletenessState, REASONS_BY_STATE } from './completeness.js';
import { mine } from './mine.js';
import { serializeObservationSet } from './serialize.js';
import {
  commit,
  makeCorruptedRepo,
  makeCoupledRepo,
  makeEmptyRepo,
  makeNonRepo,
  makeShallowCloneOfCoupled,
  makeUncoupledRepo,
  removeDir,
  writeAndAdd,
} from './testing/fixtures.js';

const created: string[] = [];
function fixture(make: () => string): string {
  const root = make();
  created.push(root);
  return root;
}
afterAll(() => created.forEach(removeDir));

describe('REQ-005 — four completeness states, never collapsed', () => {
  it('state 1: an initialized repository with no commits is NOT_MINED / NO_COMMITS', async () => {
    const result = await mine(fixture(makeEmptyRepo));
    expect(result.completeness.state).toBe(CompletenessState.NOT_MINED);
    expect(result.completeness.reason).toBe(CompletenessReason.NO_COMMITS);
    expect(result.pairs).toHaveLength(0);
  });

  it('state 1: a path that is not a repository is NOT_MINED / NO_REPOSITORY', async () => {
    const result = await mine(fixture(makeNonRepo));
    expect(result.completeness.state).toBe(CompletenessState.NOT_MINED);
    expect(result.completeness.reason).toBe(CompletenessReason.NO_REPOSITORY);
  });

  it('state 2: real history with no co-occurrence is MINED_NO_QUALIFYING_RELATIONSHIP', async () => {
    const result = await mine(fixture(makeUncoupledRepo));
    expect(result.completeness.state).toBe(CompletenessState.MINED_NO_QUALIFYING_RELATIONSHIP);
    expect(result.completeness.reason).toBe(CompletenessReason.MINED);
    expect(result.events.length).toBeGreaterThan(0);
    expect(result.pairs).toHaveLength(0);
  });

  it('state 3: an observed co-change pair is QUALIFYING_RELATIONSHIP_OBSERVED', async () => {
    const result = await mine(fixture(makeCoupledRepo));
    expect(result.completeness.state).toBe(CompletenessState.QUALIFYING_RELATIONSHIP_OBSERVED);
    expect(result.completeness.reason).toBe(CompletenessReason.MINED);

    const pair = result.pairs.find(
      (p) => p.files[0] === 'src/build.ts' && p.files[1] === 'src/parse.ts',
    );
    expect(pair?.cooccurrenceCount).toBe(3);
  });

  it('state 4: a history that cannot be walked is EVIDENCE_UNAVAILABLE, not an empty result', async () => {
    // Driven through the real failure path, not asserted on a constructor.
    // HEAD resolves; the walk to the root commit hits a deleted object.
    const root = makeCorruptedRepo();
    if (root === undefined) return; // objects were packed; nothing was corrupted
    created.push(root);

    const result = await mine(root);
    expect(result.completeness.state).toBe(CompletenessState.EVIDENCE_UNAVAILABLE);
    expect(result.completeness.reason).toBe(CompletenessReason.GIT_FAILED);
    // The damage it must not do: report this as a clean, examined repository.
    expect(result.completeness.state).not.toBe(
      CompletenessState.MINED_NO_QUALIFYING_RELATIONSHIP,
    );
  });

  it('an unresolvable revision is an absent history, not a broken one', async () => {
    const result = await mine(fixture(makeCoupledRepo), {
      basisRevision: 'refs/heads/does-not-exist',
    });
    expect(result.completeness.state).toBe(CompletenessState.NOT_MINED);
    expect(result.completeness.reason).toBe(CompletenessReason.NO_COMMITS);
  });

  it('states 2 and 3 are the only two that can carry MINED', () => {
    const carriers = Object.entries(REASONS_BY_STATE)
      .filter(([, reasons]) => reasons.includes(CompletenessReason.MINED))
      .map(([state]) => state);
    expect(carriers.sort()).toEqual(
      [
        CompletenessState.MINED_NO_QUALIFYING_RELATIONSHIP,
        CompletenessState.QUALIFYING_RELATIONSHIP_OBSERVED,
      ].sort(),
    );
  });

  it('state 1 and state 2 are distinguishable, which is the whole point', async () => {
    const notMined = await mine(fixture(makeEmptyRepo));
    const minedEmpty = await mine(fixture(makeUncoupledRepo));

    // Both report zero pairs. Only one of them examined anything.
    expect(notMined.pairs).toHaveLength(0);
    expect(minedEmpty.pairs).toHaveLength(0);
    expect(notMined.completeness.state).not.toBe(minedEmpty.completeness.state);
  });
});

describe('REQ-006 — shallow clone reports insufficient history, not zero', () => {
  it('reports NOT_MINED / SHALLOW_CLONE where the full history has a real pair', async () => {
    const { source, shallow } = makeShallowCloneOfCoupled();
    created.push(source, shallow);

    // The full clone finds the pair, so the shallow clone's silence is a
    // capability gap and not a property of the repository.
    const full = await mine(source);
    expect(full.completeness.state).toBe(CompletenessState.QUALIFYING_RELATIONSHIP_OBSERVED);

    const result = await mine(shallow);
    expect(result.completeness.state).toBe(CompletenessState.NOT_MINED);
    expect(result.completeness.reason).toBe(CompletenessReason.SHALLOW_CLONE);
    expect(result.completeness.state).not.toBe(
      CompletenessState.MINED_NO_QUALIFYING_RELATIONSHIP,
    );
  });
});

describe('REQ-004 — determinism', () => {
  it('produces byte-identical serialized output across two runs', async () => {
    const root = fixture(makeCoupledRepo);
    const first = serializeObservationSet(await mine(root, { basisRevision: 'HEAD' }));
    const second = serializeObservationSet(await mine(root, { basisRevision: 'HEAD' }));
    expect(first).toBe(second);
  });

  it('carries no wall-clock value, so output cannot move without the repository moving', async () => {
    const root = fixture(makeCoupledRepo);
    const before = serializeObservationSet(await mine(root));
    // Same repository, later moment.
    await new Promise((resolve) => setTimeout(resolve, 25));
    const after = serializeObservationSet(await mine(root));
    expect(after).toBe(before);
  });

  it('moves when — and only when — the basis advances', async () => {
    const root = fixture(makeCoupledRepo);
    const before = serializeObservationSet(await mine(root));

    writeAndAdd(root, 'src/build.ts', 'export const key = () => "changed";\n');
    writeAndAdd(root, 'src/parse.ts', '// changed\n');
    commit(root, 'another coupled change');

    const after = serializeObservationSet(await mine(root));
    expect(after).not.toBe(before);
  });

  it('pins the resolved basis commit so the window is reproducible after refs move', async () => {
    const root = fixture(makeCoupledRepo);
    const result = await mine(root);
    expect(result.basisWindow?.basisCommit).toMatch(/^[0-9a-f]{40,64}$/);
    expect(result.basisWindow?.extractedTransitions).toBe(result.events.length);
    expect(result.basisWindow?.windowTruncated).toBe(false);
  });
});

describe('recorded parameters', () => {
  it('records the qualifying threshold it used rather than implying one', async () => {
    const result = await mine(fixture(makeCoupledRepo));
    expect(result.qualifyingMinCooccurrence).toBe(1);
  });

  it('honours a raised threshold without changing the state machine', async () => {
    const root = fixture(makeCoupledRepo);
    // v2.2.1's rawSupport >= 3 applied early: the pair co-occurs exactly 3
    // times, so it still qualifies; at 4 it does not, and the state flips to
    // "mined, nothing qualifying" rather than to "not mined".
    const atThree = await mine(root, { qualifyingMinCooccurrence: 3 });
    expect(atThree.completeness.state).toBe(CompletenessState.QUALIFYING_RELATIONSHIP_OBSERVED);

    const atFour = await mine(root, { qualifyingMinCooccurrence: 4 });
    expect(atFour.completeness.state).toBe(CompletenessState.MINED_NO_QUALIFYING_RELATIONSHIP);
    expect(atFour.events.length).toBeGreaterThan(0);
  });

  it('carries the path-normalization assumption record in its output', async () => {
    const result = await mine(fixture(makeCoupledRepo));
    expect(result.pathNormalization).toHaveLength(6);
    expect(result.pathNormalization.filter((a) => a.standing === 'assumed')).toHaveLength(4);
  });
});
