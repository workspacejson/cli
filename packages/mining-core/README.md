# `@workspacejson/mining-core` (L0)

Commit-graph mining core for `workspace.json`. Reads git, returns an in-memory
observation set, writes nothing.

Private and unpublished. It exists so that the producer, the META-289 harness,
and the report all take **one** implementation of the org's highest-value logic
rather than three — the META-140 defect class landing in exactly the numbers an
independent producer would be compared against.

## Scope

This package implements META-297 **Phases 1 and 2 only**.

| Requirement | What it means here |
| -- | -- |
| REQ-001 | First-parent event extraction per META-289 v2.2.1's frozen parameters |
| REQ-002 | Empty-tree object computed from the repository, never hardcoded |
| REQ-003 | One exported `normalizePath`, with its unratified assumptions recorded in the output |
| REQ-004 | Two runs at the same basis produce byte-identical serialized output |
| REQ-005 | Four completeness states, never collapsed |
| REQ-006 | A shallow clone reports insufficient history, not zero |

**Not implemented, deliberately:** weighting, position decay, the `fileCount > 50`
exclusion, support thresholds, lift, ranking, pair caps. Those are REQ-007
and REQ-009 and Phase 3 has not started. Extraction returns every event the
window produced, including events Phase 3 will exclude, so that an exclusion
remains countable rather than invisible.

**No artifact projection.** L1 — writing `generated.coChange` — is blocked. The
published schema's `coChange` item requires `rate` and sets
`additionalProperties: false`, so the counts-only shape the 2026-08-03 churn
ruling calls for is *rejected* by the schema rather than merely divergent from
it. That needs a schema admission, not a workaround.

## Layering

```text
L0 (this package)  git only        → in-memory observation set
L1 producer        L0 output       → generated.coChange        [blocked on schema admission]
L2 report          the artifact    → human-readable findings   [never invokes git]
```

`git.ts` is the only module here that spawns git. That is what makes the L2
direction invariant checkable later.

## Usage

```ts
import { mine, serializeObservationSet } from '@workspacejson/mining-core';

const observations = await mine('/path/to/repo', { basisRevision: 'HEAD' });

if (observations.completeness.state === 'QUALIFYING_RELATIONSHIP_OBSERVED') {
  for (const pair of observations.pairs) {
    console.log(pair.files, pair.cooccurrenceCount);
  }
}
```

`mine` does not throw for an absent, shallow, or unreadable history. Those are
completeness states, which is the entire point of REQ-005.

## Completeness states

Four values, and no code path maps two of them onto one:

| State | Meaning |
| -- | -- |
| `NOT_MINED` | History was not mined, or evidence was not recorded. Not a claim about the repository. |
| `MINED_NO_QUALIFYING_RELATIONSHIP` | Mining completed over real history and found nothing qualifying. A claim. |
| `QUALIFYING_RELATIONSHIP_OBSERVED` | Mining completed and observed at least one qualifying relationship. |
| `EVIDENCE_UNAVAILABLE` | Evidence was reachable but malformed or unavailable. A failure, not a result. |

Each carries a `reason`, because "not mined" that does not say *why* is the same
dead end as "0 partners".

The state 2/3 boundary is the `qualifyingMinCooccurrence` option, default `1`,
and the value used is recorded in the output. It is **not** v2.2.1's
`rawSupport >= 3`: that is a scoring threshold, Phase 2 runs before scoring, and
baking it in here would ship a scoring decision under a completeness heading.
Phase 3 raises it without touching the state machine.

## Path identity

ADR-006 does not exist. META-278 poses six questions about canonical path
identity and the Phase 0 audit found zero implementations across
`workspacejson/cli` and `workspacejson/standard`, so `normalizePath` here is the
first one — the de facto rule ahead of ratification.

It answers 2 of the 6 from the published schema's own field descriptions and
**assumes** the other 4 (case sensitivity, Unicode normalization, trailing
slash, symlink and submodule root resolution). Every assumption is declared in
`PATH_NORMALIZATION_ASSUMPTIONS` and carried in every observation set, so a
reader sees the guess as a guess. META-278 governs; this is not a proposal.

## Tests

```sh
pnpm test
```

Tests drive real git against real repositories — a mocked `diff-tree` would
prove nothing about extraction — so the suite takes tens of seconds.

`billfold.test.ts` cross-checks against `workspace-json/billfold`, the one
repository where the correct answer is known in advance. It **skips** when that
clone is absent rather than passing vacuously; point `WORKSPACEJSON_BILLFOLD` at
a checkout to run it.
