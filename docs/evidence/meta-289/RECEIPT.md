# RECEIPT — META-289

**Date:** 2026-08-21. **Scope:** execution record — environment, freeze chain,
validation, red tests, deviations. Findings: `REPORT.md`.

## Environment

| | |
| -- | -- |
| Host | darwin arm64 |
| Node | v22.19.0 |
| git | git version 2.52.0 |
| Network | GitHub Search API (universe snapshot) and `git clone` only |
| Model runs | **none** |
| Maintainers contacted | **none** |
| Producer / schema changes | **none** |

## Freeze chain

Verifiable from `git log`, not from this file's assertion.

| Step | Commit | What it established |
| -- | -- | -- |
| META-378 predecessor receipt | `f3c7a0741acd14620a4fe8535c65d1908087fa30` | verified present before phase 0 completed; `NEITHER_PATTERN_REPLICATES` recorded as context only |
| META-376 | *(none — Canceled)* | verified Canceled in Linear; not reopened, not executed |
| **Preregistration** | `8f3f762dbc6ae7006f2317fb6137e6e2a754a92a` | all 24 required parameters, the disposition ladder and its thresholds — **before any repository was selected** |
| **Phase A** | `7bd2f17c1b715875d0dc8dbace5d2002f46a29dd` | universe snapshot, seeded selection, V1–V6 verification, classifiers, `T0` denominators, all three rankings — **before any outcome was read** |
| Phase B results | this commit | first source↔test outcome numbers |

## Outcome isolation (PREREGISTRATION §20)

`scripts/phase-a.mjs` is the only script that ranks, and its sole use of an
evaluation transaction's changed-file set is `filter(isSource)`. Records carry
a fixed 14-key allowlist asserted before the phase-A commit; there is no key in
which an outcome could hide.

`scripts/phase-b.mjs` is the only script that reads TEST-role touches of an
evaluation transaction. It never re-ranks — it consumes the lists frozen at
`7bd2f17c1b71` and scores them.

Invariant **I4** re-proves the ordering over the committed artifacts: the
phase-A commit tree contains no `outcomes.json`, no `results.json` and no
`phase-b.mjs`.

## Temporal isolation (PREREGISTRATION §9, §10)

Enforced structurally rather than by filtering: the miner snapshots its count
tables, ranks, and only then folds `T` in. `T` contributes zero to its own
features by construction.

Invariants **I3** and **I7** re-prove this by **independent reimplementation** —
`checks.mjs` rebuilds `H`, `B0` and `B1` for all 800 queries using an
explicit `index(X) < index(T)` ancestry filter, a different mechanism from the
oldest→newest structural fold, and requires exact agreement. Agreement between
two mechanisms is evidence; one mechanism agreeing with itself is not.

## Invariants — all must hold

| # | Status | Detail |
| -- | -- | -- |
| **I1** | `PASS` | orderKeys recomputed from seed alone; order sorted; selected == frozen rank — Go:rank9=flyteorg/flyte Java:rank6=LuckPerms/LuckPerms Python:rank5=kornia/kornia TypeScript:rank1=remult/remult |
| **I2** | `PASS` | 800 queries: T0 == git rev-parse T^1, and T0 is a strict ancestor of T |
| **I3** | `PASS` | historyTxnCount equals the count of eligible transactions with index strictly < index(T), for all 800 queries — T contributes zero to itself (flyteorg/flyte:H0/B00/B10/hist0 LuckPerms/LuckPerms:H0/B00/B10/hist0 kornia/kornia:H0/B00/B10/hist0 remult/remult:H0/B00/B10/hist0) |
| **I7** | `PASS` | H reproduced exactly by an independent explicit-ancestry-filter implementation for all 800 queries |
| **I5** | `PASS` | B0 reproduced exactly by an implementation that never references sourcePaths — source-independent for all 800 queries |
| **I6** | `PASS` | B1 reproduced exactly by an implementation that never references the history maps — history-independent for all 800 queries |
| **I4** | `PASS` | key allowlist holds for 800 records; no TEST path in any sourcePaths; pre-outcome commit 7bd2f17c1b71 tree contains 0 outcome artifacts (expected 0) |
| **I8** | `PASS` | 1342 ranked candidates all classify TEST; 2718 query paths all classify SOURCE and none classifies TEST (roles exclusive) |
| **I9** | `PASS` | 800 suites re-derived from git ls-tree -r T0 match the frozen suiteSha256 and suiteSize exactly — only T0-extant tests are in the denominator |
| **I10** | `PASS` | every reported rate carries num/den recomputed from raw/outcomes.json; class counts partition the 200 queries — flyteorg/flyte:137+19+44=200 LuckPerms/LuckPerms:29+11+160=200 kornia/kornia:84+17+99=200 remult/remult:68+6+126=200 |
| **I11** | `PASS` | no repository skipped without a recorded V-failure; selected is the first passing entry in the frozen order — Go:9 attempts, 8 recorded V-failures Java:6 attempts, 5 recorded V-failures Python:5 attempts, 4 recorded V-failures TypeScript:1 attempts, 0 recorded V-failures |

## Red tests — all must be CAUGHT, and all must be proven non-inert

Each perturbation prints the measured quantity before and after and asserts
they differ. **An inert perturbation is reported `INVALID`, not `PASS`,** and
fails the run.

| # | Status | Perturbation and proof of non-inertness |
| -- | -- | -- |
| **RT1** | `CAUGHT` | folding T's own transaction in BEFORE its snapshot changed rankedH on 26/200 queries in LuckPerms/LuckPerms (before: frozen lists; after: leaked lists). Perturbation is NOT inert. |
| **RT4** | `CAUGHT` | making B0 add +1 where the candidate co-occurred with S(T) changed rankedB0 on 110/200 queries — the source-independence checker measures a real quantity. |
| **RT5** | `CAUGHT` | adding historical support to structuralScore changed rankedB1 on 110/200 queries — the history-independence checker measures a real quantity. |
| **RT3** | `CAUGHT` | inverting the T-GO test rule changed Suite(T0) in flyteorg/flyte from 683 to 1587 tests, and S(T) on query 0 from 4 paths ["common_operator.go","mpi.go","pytorch.go","tensorflow.go"] to 4 paths ["common_operator_test.go","mpi_test.go","pytorch_test.go","tensorflow_test.go"]. Role labels are load-bearing. |
| **RT6** | `CAUGHT` | injecting one non-extant (pre-T0-deleted) path into every Suite(T0) in flyteorg/flyte moved mean fraction@10 for H from 0.021812 to 0.021735. The denominator is load-bearing. |
| **RT2** | `CAUGHT` | splicing G(q) to the head of L_H in flyteorg/flyte raised macro recall@10 from 0.715085 to 1.000000. An outcome leak into ranking is detectable. |
| **RT7** | `CAUGHT` | flipping the outcome set of query 0 (T=893b704d8bee) in flyteorg/flyte moved macro recall@10 from 0.715085 to 0.707786. The outcome is load-bearing. |

**0 failures.**

## Corpus integrity

- Universe is the **committed snapshot** `raw/universe.json`, not the live API.
- Ordering key `sha256("META-289/OQ-15/source-test-coupdate/v1" + ":" + full_name)` recomputed from the
  seed alone in **I1**.
- Backfill fired only on recorded V1–V6 failures:
  Go 8, Java 5, Python 4, TypeScript 0 recorded
  `INELIGIBLE_ON_VERIFICATION` entries respectively, all visible in
  `SELECTION-RECEIPT.md`.
- **No repository was replaced for sparsity, abstention, or a negative result.**

## Deviations

**One, non-semantic.** `scripts/gitmine.mjs` initially passed
`--no-renames-empty` to `git log`; git 2.52.0 rejects it and the script's
fallback re-ran the identical command without it. The flag was removed from the
source after cohort verification. No output changed and no frozen parameter was
touched.

**No protocol deviation.** No preregistered parameter was changed after outcomes
became visible; no disposition was renamed or redefined.

## Reproduction

```
bash docs/evidence/meta-289/rerun.sh <workDir>
```

Selection reproduces from the committed `raw/universe.json` without touching
the GitHub API. Re-materializing the universe from the live API is a separate
opt-in step and will **not** reproduce the snapshot, because GitHub result sets
drift — which is exactly why the snapshot is committed.
