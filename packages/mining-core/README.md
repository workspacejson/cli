# `@workspacejson/mining-core` (L0)

Commit-graph mining core for `workspace.json`. Reads git, returns an in-memory
observation set, writes nothing.

Private and unpublished. It exists so that the producer, the META-289 harness,
and the report all take **one** implementation of the org's highest-value logic
rather than three — the META-140 defect class landing in exactly the numbers an
independent producer would be compared against.

## Scope

This package implements META-297 **Phases 1 to 3**.

| Requirement | What it means here |
| -- | -- |
| REQ-001 | First-parent event extraction per META-289 v2.2.1's frozen parameters |
| REQ-002 | Empty-tree object computed from the repository, never hardcoded |
| REQ-003 | One exported `normalizePath`, with its unratified assumptions recorded in the output |
| REQ-004 | Two runs at the same basis produce byte-identical serialized output |
| REQ-005 | Four completeness states, never collapsed |
| REQ-006 | A shallow clone reports insufficient history, not zero |

Those six are the only requirement identifiers written down for this package,
so they are the only ones cited. Phase 3 adds four behaviors that carry no
issue number, and they are therefore **named rather than numbered** — an
invented identifier reads as a citation and cites nothing:

| Behavior | What it means here |
| -- | -- |
| **Weighting** | v2.2.1's `size_weight` and `position_decay`, implemented verbatim |
| **Scoring exclusion** | Events with `fileCount > 50` are excluded from scoring, and named |
| **Basis pinning** | The basis is a full-length object name, or it is not emitted at all |
| **Selection rule** | Threshold, rank, cap at 50, with an execution receipt |

The generated-classifier question is **not** in this package; it is tracked
separately as META-316. See the note on `generated` below.

**No artifact projection.** L1 — writing `generated.coChange` — is not here. The
schema is no longer the blocker it was during Phases 1 and 2: the standard's
A-009 amendment merged and admits the observation form (`support` +
`occurrences` + a pinned `generated.basisRevision`). But the package carrying it
is unpublished, and A-009 is an explicitly staged transition — widen the reader,
verify consumer adoption, *then* enable producer emission. Emission is step 3,
and this package does not authorize it.

## Scoring

`score(observationSet, { minSupport })` is a pure function. It spawns no
process, reads no filesystem and consults no clock; everything it needs was
extracted in Phase 1. That is what keeps the exclusion auditable — the same
observation set can be scored twice with different parameters, and the
difference is attributable to the parameters rather than to a second walk of a
repository that may have moved.

Two vocabularies meet here, and are deliberately kept apart.

**v2.2.1 supplies the weighting**, implemented verbatim.

| Parameter | Value |
| -- | -- |
| `size_weight` | `min(1, 10/fileCount)` |
| `position_decay` | `2^(-Δpos/250)` |
| Window | 500 first-parent transitions |
| Scoring exclusion | events with `fileCount > 50` |
| Support threshold | `support >= 3` (`DEFAULT_MIN_SUPPORT`, overridable, recorded) |

Δpos is measured from the newest **extracted** event, never the newest scored
one — excluding a large event must not shift the decay of everything older than
it. The recorded file-role and path exclusion set is **empty**: no path is
excluded for being documentation, a lockfile or generated output, so the size
rule above is the only exclusion L0 applies, and it applies to whole events
rather than to paths. Excluded events stay in the observation set and are named
by commit in `exclusions.excludedCommits`, because an exclusion nobody can point
at is not auditable.

**A-009 supplies the counts**, and they are integers.

- `support` — distinct scored events in which **both** files changed.
- `occurrences` — distinct scored events in which **at least one** changed. The
  symmetric union, so reversing the pair changes nothing. Never a per-file
  marginal.

`weightedSupport` is emitted alongside the counts, never instead of them.
Nothing derived is stored: a rate is a reader's question.

A repository longer than the window is **valid**. The bounded window is recorded
in `basisWindow` (`availableTransitions`, `extractedTransitions`,
`windowTruncated`), and truncation by the window is a fact rather than an error.

## Basis pinning

`scoringBasis` carries everything needed to recount a result: the frozen
weighting identifiers, the pinned basis, and both edges of the window.

`basisRevision` is a full-length lowercase Git object name — A-009's
`^([0-9a-f]{40}|[0-9a-f]{64})$` — never a symbolic ref, because a pin that does
not name exactly one commit permanently cannot be recounted against. A basis
failing that shape **throws**: it is a caller bug, not a repository condition,
and a bug must not disguise itself as one. Where there is no window to pin,
`scoringBasis` is **absent**, not a placeholder that reads as a real pin.

## Selection rule (provisional producer profile)

`select(scoredSet, { minSupport, cap })` decides what a producer would emit.
Three steps, in this order:

1. **Threshold** — keep pairs at `support >= 3`.
2. **Rank** — `support` DESC, then `occurrences` ASC, then `files[0]` ASC by
   **UTF-8 bytes**, then `files[1]` ASC by UTF-8 bytes.
3. **Cap** — keep the first **50**, *after* ranking.

Every ranking key is an integer or a byte sequence. Nothing continuous
participates, so the order cannot shift with floating-point precision.

**UTF-8 byte order is not `a < b`.** A bare JavaScript comparison is UTF-16 code
unit order, and the two genuinely disagree: U+1F600 is a surrogate pair
beginning `0xD83D`, which sorts *before* U+E000 under UTF-16, while its UTF-8
encoding `F0 9F 98 80` sorts *after* U+E000's `EE 80 80`. `compareUtf8` is
exported and is the only comparator the ranking uses.

**Capping is a presentation step, not a data-loss step.** `select` is pure: the
scored set it was handed still carries every pair and every weight afterwards,
and the extracted events behind that are untouched. The cap changes what is
emitted, never what was observed.

### Execution receipt

A truncated list must be visibly truncated, never silently short — the same
doctrine as the completeness states, one layer up. `receipt` records:

| Field | Meaning |
| -- | -- |
| `minSupport` | The threshold applied before ranking |
| `pairsBeforeCap` | Pairs that cleared the threshold — the population the cap cut from |
| `pairsEmitted` | Pairs actually emitted; `min(pairsBeforeCap, cap)` |
| `cap` | The cap in force |
| `rankingRule` | The complete rule, as text, so two artifacts can be compared without reading this file |
| `capBound` | Whether the cap actually bound |

A reader can therefore distinguish an emitted 50 that is everything from an
emitted 50 that is the top of 1,848, without access to the repository.

### No floats in artifact-bound output

`SelectedPair` carries `files`, `support` and `occurrences`. It does **not**
carry `weightedSupport`, and `serializeSelection` **throws** on any non-integer
number rather than rounding or dropping it. Rounding would invent precision the
measurement does not have; dropping would remove a field a reader was told to
expect; both are quieter than the bug.

The reason is measured, not stylistic: `weightedSupport` is a double from
`2 ** x`, whose precision ECMAScript leaves implementation-defined. A float in a
committed artifact is the churn class A-009 exists to prevent. It remains
available in memory on the scored set, and `serializeScoredSet` will emit it for
diagnostics that never reach `workspace.json`.

**This constrains L1 too, and L1 is still not authorized.**

## The `generated` flag — a finding, not a feature

The schema requires `generated` on every `coChange` entry, documented as
`"true = tooling-coupled pair (e.g. lockfile + package.json); consumers skip
these"`. **L0 has no rule that can ever produce `true`.** The recorded
file-role and path exclusion set is empty, so nothing classifies a pair as
tooling-coupled and the field would be constant `false` on every entry a
producer emitted.

The concrete case is worse than merely constant. On a 500-transition window of
`motdotla/dotenv` pinned at `2fc7eac8`, the **highest-ranked pair under the
selection rule above** is `package-lock.json` ↔ `package.json` at support 80 —
literally the example the field's own documentation cites. L0 would label it
`generated: false`. The field does not merely carry no information; it carries
the wrong answer on its own canonical example.

Removing it is a schema change, not a producer choice, so this package records
the finding and changes nothing. Tracked as **META-316**.

## Refresh model

History mining is an **explicit refresh operation**, not part of default
generation. A bound 500-transition window costs 7.3–8.2 s with a short `PATH`
and 27.2–29.9 s with a long one on an Apple M4 Pro; adding that to every
generate is not viable, and the result is pinned to a commit rather than
recomputed per run.

A-009 already supplies the staleness protocol: compare `generated.basisRevision`
against the current revision, where "pin ≠ current revision" is a defined reader
state meaning *stale observation*. That only works if the pin is allowed to lag,
which presupposes an explicit refresh.

**The public command name is deliberately not chosen here.** Naming it is a
separate decision and this package does not pre-empt it.

## Layering

```text
L0 (this package)  git only        → observation set → scored set → selection
L1 producer        L0 output       → generated.coChange        [held: A-009 step 3]
L2 report          the artifact    → human-readable findings   [never invokes git]
```

`git.ts` is the only module here that spawns git. That is what makes the L2
direction invariant checkable later.

## Usage

```ts
import { mine, score, select } from '@workspacejson/mining-core';

const observations = await mine('/path/to/repo', { basisRevision: 'HEAD' });
const scored = score(observations);
const selection = select(scored);

if (selection.completeness.state === 'QUALIFYING_RELATIONSHIP_OBSERVED') {
  console.log('basis', selection.scoringBasis!.basisRevision);
  console.log('receipt', selection.receipt); // threshold, counts, cap, rule, capBound
  for (const pair of selection.pairs) {
    console.log(pair.files, pair.support, pair.occurrences);
  }
}

// `scored` is untouched by `select` — every pair and every weight is still
// there, which is what makes the cap auditable.
```

`mine` does not throw for an absent, shallow, or unreadable history, and `score`
does not invent one. Those are completeness states, which is the entire point of
REQ-005 — and `score` gates on the state rather than on whether an events array
happens to be non-empty, because a `--depth 1` clone can hand over real events
that would otherwise produce a structurally identical answer at reduced
magnitude.

### Cost

Scoring is free; extraction is not. On an Apple M4 Pro, a bound 500-transition
window costs **7.3–8.2 s** with a short `PATH` and **27.2–29.9 s** with this
machine's 36-entry `PATH`, because v2.2.1's frozen parameters spend two `git`
subprocesses per commit and Node resolves the binary through `PATH` on every
one. Scoring the resulting 500 events costs **1–24 ms**. Plan the calling
interface around the extraction number, not the scoring one.

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
