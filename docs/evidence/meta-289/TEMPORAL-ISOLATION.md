# TEMPORAL-ISOLATION — META-289

How this experiment prevents information from `T` or after `T` reaching the
ranking stage, and how that prevention is *proved* rather than asserted.

Normative rules: `PREREGISTRATION.md` §9 (history window), §10 (evaluation
window), §12 (query unit), §20 (outcome isolation).

## 1. The referent

For every evaluation transaction `T`:

```
T0 = the first parent of T
```

`T0` is a real commit, not a timestamp cut. Every candidate test file, every
current-tree feature and every historical count is derived from `T0` or
earlier. `T` and everything after it are readable only by the outcome stage.

Invariant **I2** asserts, for all 800 queries, that `T0 == git rev-parse T^1`
and that `T0` is a strict ancestor of `T`.

## 2. Why the window is structural, not filtered

A filtered implementation — "collect all transactions, then exclude those at or
after `T`" — is correct only if the filter is correct, and a filter bug is
invisible in the output. This experiment does not use one.

`scripts/phase-a.mjs` walks the first-parent chain **oldest → newest**,
maintaining two count tables. On reaching an evaluation transaction it:

1. **snapshots** the tables as they stand,
2. derives `Suite(T0)`, ranks `H`, `H-MAX`, `B0`, `B1`,
3. writes the record,
4. **and only then** folds `T`'s own contribution into the tables.

`T` therefore contributes exactly zero to its own features **by construction**.
There is no filter to get wrong, because at the moment of ranking `T`'s counts
do not yet exist anywhere in the process.

The recorded `historyTxnCount` on each record is the exact number of eligible
transactions folded in before that snapshot. It is monotonically increasing
across a repository's queries, which is a direct consequence of the walk order
and is checked as part of **I3**.

## 3. What the ranking stage is allowed to see

| Quantity | Derived from | Visible to ranking? |
| -- | -- | -- |
| `S(T)` — SOURCE-role touches of `T` | `T` | **yes — this is the query (§12)** |
| `G(T)` — TEST-role touches of `T` | `T` | **no** |
| `Suite(T0)` | `T0` tree | yes |
| `support(s,t)` | transactions strictly before `T` | yes |
| test popularity | transactions strictly before `T` | yes |
| structural similarity | `T0` paths only | yes |

The distinction is the whole design. The question asks what happens *given a
transaction that changes source files*, so the identity of those source files
is the input. The test files touched by the same transaction are the outcome,
and the ranking stage never receives them.

## 4. Separate code paths, separate commits

| Stage | Script | Writes | May read `G(q)` |
| -- | -- | -- | -- |
| Pre-outcome | `scripts/phase-a.mjs` | `raw/pre-outcome.json` | **no** |
| Outcome | `scripts/phase-b.mjs` | `raw/outcomes.json`, `raw/results.json` | yes |

`phase-a.mjs` contains no code that classifies a touch of `T` as an outcome.
Its only use of `t.touched` on an evaluation transaction is
`t.touched.filter(isSource)`.

The two stages are committed **separately, in order**. The pre-outcome commit's
tree contains `raw/pre-outcome.json` and no outcome file and no outcome script.
That ordering is recorded in git and is reproducible by anyone with the
repository:

```
git show --stat <PRE_OUTCOME_SHA>     # no outcomes.json, no phase-b.mjs
git show --stat <OUTCOME_SHA>         # outcomes added here, after the freeze
```

Exact SHAs are listed in `RECEIPT.md`.

## 5. Mechanical assertions run before the pre-outcome commit

**Key allowlist.** A pre-outcome record may carry exactly these keys, and the
assertion fails the run on any extra or missing key:

```
repo  stratum  pin  T  T0  tIndex  sourcePaths  suiteSize  suiteSha256
rankedH  rankedHMax  rankedB0  rankedB1  historyTxnCount
```

There is no key in which an outcome could hide. `sourcePaths` holds SOURCE-role
paths only, and `roleOf` is single-valued, so no TEST-role path can appear
there. The four `ranked*` fields are subsets of `Suite(T0)`, which is derived
from the `T0` tree with no reference to `T`.

**Suite hash.** Each record commits `suiteSha256`. The outcome stage
independently re-derives `Suite(T0)` from git and verifies that hash **before**
reading any outcome, so the §17 denominator cannot drift between stages
(invariant I9).

## 6. The red tests that make this falsifiable

An isolation claim that no test can break is not evidence. Two red tests
deliberately break this one and must be **caught**:

| # | Perturbation | Mechanism |
| -- | -- | -- |
| RT1 | `buildRepo(..., { leakT: true })` folds `T`'s own transaction in **before** its snapshot | this is exactly the temporal leak §9 forbids |
| RT2 | splice `G(q)` members to the head of `L_H(q)` | this is exactly the outcome leak §20 forbids |

Each prints the measured quantity before and after and asserts they differ. A
perturbation that leaves the measurement unchanged is reported `INVALID`, not
`PASS`, and fails the run — because an inert perturbation proves the checker
measures nothing.

Results are in `RECEIPT.md`.

## 7. Known limitation this design does not remove

**Rename chains are not resolved to a stable identity** (§11). A file renamed
mid-history contributes its pre-rename counts under its old path and its
post-rename counts under its new path, and the two are never merged. This
depresses `H` on recently renamed files and depresses `B0` on recently renamed
tests.

It applies identically to `H`, `B0` and `B1`, so it cannot advantage one method
over another — but it is a real limitation of the measurement, and it is
restated in `REPORT.md` rather than left here.
