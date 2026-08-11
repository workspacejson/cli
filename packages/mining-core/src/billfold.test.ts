/**
 * REQ-001 and REQ-002 against the billfold fixture (HAC-184).
 *
 * billfold is the only repository where the correct answer is known in advance,
 * so it is the one place these requirements can be checked against something
 * other than a fixture this package built for itself.
 *
 * It lives in a different repository (`workspace-json/billfold`) and is not a
 * dependency, so these tests skip when it is absent rather than failing. A skip
 * is honest; a green run against a fixture that was never there is not. Point
 * `WORKSPACEJSON_BILLFOLD` at a clone to run them.
 *
 * The expectations below are hand-computed from the Phase 0 audit (comment
 * 4c25d1f9 on META-297) and are committed here as numbers, not as a call to
 * whatever the code currently returns.
 */
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { emptyTreeObject, extractEvents } from './git.js';
import { mine } from './mine.js';

const BILLFOLD = process.env.WORKSPACEJSON_BILLFOLD ?? '/Users/user1/dev/billfold';
const BASIS = 'origin/main';

/** Hand-computed from the Phase 0 census. Change these only with evidence. */
const EXPECTED = {
  /** `git rev-list --first-parent --count origin/main`. */
  firstParentTransitions: 44,
  /** The thesis pair — no import edge between them. */
  thesisPair: ['src/routes/checkout.ts', 'src/webhooks/stripe.ts'] as const,
  /** Its raw co-occurrence WITH empty-tree handling for the root commit. */
  thesisSupportWithEmptyTree: 6,
  /** And WITHOUT it: the root commit drops out, taking one unit of support. */
  thesisSupportWithoutEmptyTree: 5,
  /** The root commit, which only an empty-tree parent makes visible. */
  rootCommitFileCount: 24,
  /** Unweighted pairs at raw support >= 3, from the audit. */
  pairsAtSupport3: [
    { files: ['docs/OPERATIONS.md', 'src/routes/checkout.ts'], support: 9 },
    { files: ['docs/OPERATIONS.md', 'src/webhooks/stripe.ts'], support: 6 },
    { files: ['src/routes/checkout.ts', 'src/webhooks/stripe.ts'], support: 6 },
    { files: ['docs/OPERATIONS.md', 'src/db/client.ts'], support: 4 },
  ],
} as const;

const available = existsSync(BILLFOLD);
const describeBillfold = available ? describe : describe.skip;

describeBillfold('billfold cross-check (REQ-001, REQ-002)', () => {
  it('extracts the expected number of first-parent transitions', async () => {
    const result = await mine(BILLFOLD, { basisRevision: BASIS });
    expect(result.basisWindow?.availableTransitions).toBe(EXPECTED.firstParentTransitions);
    // Window 500 does not bind on a 44-event history.
    expect(result.basisWindow?.windowTruncated).toBe(false);
    expect(result.events).toHaveLength(EXPECTED.firstParentTransitions);
  });

  it('reproduces the audit census at raw support >= 3', async () => {
    const result = await mine(BILLFOLD, { basisRevision: BASIS, qualifyingMinCooccurrence: 3 });
    const observed = result.pairs
      .map((p) => ({ files: [...p.files], support: p.cooccurrenceCount }))
      .sort((a, b) => b.support - a.support || (a.files[0]! < b.files[0]! ? -1 : 1));
    const expected = EXPECTED.pairsAtSupport3
      .map((p) => ({ files: [...p.files], support: p.support }))
      .sort((a, b) => b.support - a.support || (a.files[0]! < b.files[0]! ? -1 : 1));
    expect(observed).toEqual(expected);
  });

  it('REQ-002: empty-tree handling is worth exactly one unit of support on the thesis pair', async () => {
    const events = await extractEvents(BILLFOLD, {
      basisRevision: BASIS,
      windowTransitions: 1000,
    });

    const [left, right] = EXPECTED.thesisPair;
    const countPair = (subset: typeof events): number =>
      subset.filter((e) => e.files.includes(left) && e.files.includes(right)).length;

    const withEmptyTree = countPair(events);
    expect(withEmptyTree).toBe(EXPECTED.thesisSupportWithEmptyTree);

    // The root commit is the only event whose parent is the empty tree. Drop it
    // and you have simulated the hardcoded-literal failure on a repository
    // whose object format the literal does not match.
    const emptyTree = await emptyTreeObject(BILLFOLD);
    const rootEvents = events.filter((e) => e.parent === emptyTree);
    expect(rootEvents).toHaveLength(1);
    expect(rootEvents[0]!.fileCount).toBe(EXPECTED.rootCommitFileCount);

    const withoutEmptyTree = countPair(events.filter((e) => e.parent !== emptyTree));
    expect(withoutEmptyTree).toBe(EXPECTED.thesisSupportWithoutEmptyTree);
    expect(withEmptyTree - withoutEmptyTree).toBe(1);
  });

  it('REQ-004: two runs at the same basis agree byte for byte', async () => {
    const { serializeObservationSet } = await import('./serialize.js');
    const first = serializeObservationSet(await mine(BILLFOLD, { basisRevision: BASIS }));
    const second = serializeObservationSet(await mine(BILLFOLD, { basisRevision: BASIS }));
    expect(first).toBe(second);
  });
});
