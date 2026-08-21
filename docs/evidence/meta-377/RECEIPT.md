# RECEIPT — META-377

**Date:** 2026-08-21. **Scope:** execution record — environment, freeze chain,
validation, red tests, deviations. Findings: `REPORT.md`. Freeze:
`ANALYSIS-PLAN.md`. Input pin: `INPUT-RECEIPT.md`.

## Environment

| | |
| -- | -- |
| Host | darwin arm64 |
| Node | v22.19.0 |
| Network access during analysis | none |
| Miner runs | none |
| Model runs | none |

Every result is computed from committed JSON under `docs/evidence/meta-375/`.

## Freeze chain

The ordering below is the methodological guarantee. It is verifiable from
`git log`, not from this file's assertion.

| Step | Commit | What it established |
| -- | -- | -- |
| META-375 merged | `0af756a18cf376ee5b7063a98ce63deb2ad97ff4` | immutable input |
| META-377 input pin + analysis freeze | `f09a1c96ce7c9c868adc65ef7ed8fbb42d1d3a0d` | all grouping rules, the comparability threshold, the disposition rule, and the three joint views — **before any conditioned rate existed** |
| Denominator audit | `b09ac06b35f5f0b0159ca29a67aeba10af7d0765` | cell classes for all nine bases, produced by a script that **cannot read the outcome** |
| Results | this commit | first conditioned recurrence rates |

`scripts/denominators.mjs` calls `load(..., { withOutcome: false })`, which omits
`overlapUsable`/`overlapAll` from every row, then asserts those keys are absent
and throws if they are not. The Phase 3 audit therefore could not have been
shaped by the outcome.

`scripts/condition.mjs` is the first script permitted to read the outcome.

## Input gate

`node scripts/verify-input.mjs docs/evidence/meta-375` — **100/100 PASS**.

46 input files, 9,203 relationships, 6 held-out bases. Digests recomputed from
disk match META-375's own `RECEIPT.md` attestation for all 36 `runs/` artifacts
plus `aggregate.json`. No stop condition fired.

## Invariants (ANALYSIS-PLAN §10)

`node scripts/checks.mjs` — **12/12 PASS**.

| ID | Proves | Result |
| -- | -- | -- |
| V1 | relationship count == META-375 input count (9,203) | PASS |
| V2 | emitted/omitted identities unchanged (9,203/9,203) | PASS |
| V3 | held-out outcome identities unchanged (9,203/9,203) | PASS |
| V4 | role labels unchanged, drawn from META-375's vocabulary (9,203/9,203) | PASS |
| V5 | age labels unchanged, within the frozen buckets (9,203/9,203) | PASS |
| V6 | persistence X/Y unchanged, exact (9,203/9,203) | PASS |
| V7 | endpoint-existence labels unchanged (9,203/9,203) | PASS |
| V8 | exposure labels unchanged, UNKNOWN preserved (9,203/9,203) | PASS |
| V9 | pin bases contribute zero recurrence observations (3,100 relationships, 0 observations) | PASS |
| V10 | six and only six bases contribute frozen held-out outcomes | PASS |
| V11 | recomputed marginals reproduce META-375 `aggregate.json` at all six bases | PASS |
| V12 | red-test baselines are non-degenerate | PASS |

V4–V8 are enforced by construction: every label the analysis groups on is
recomputed directly from the frozen record by `lib.mjs`, with no lookaside
table, no override map, and no reclassification path. There is no code path by
which META-377 could assign a label META-375 did not record.

## Red tests (ANALYSIS-PLAN §10)

**5/5 CAUGHT.** Each red test asserts two things, and passes only if both hold:

1. the perturbation actually **moved** the analysis quantity its paired checker
   reads — verified by digesting that quantity before and after;
2. the invariant then **fails**.

A perturbation that changes nothing observable is reported as
`INVALID (perturbation inert)`, not as a pass. During construction R2 initially
returned `INVALID` — its measure was the corpus-wide set of distinct role-pair
strata, which was unchanged because other bases already contained the target
labels. It was rewritten to measure the per-basis stratum→count map at the
perturbed basis, which is what the analysis actually groups on. That guard
working on a real mistake is the evidence that these red tests are not
self-confirming.

| ID | Perturbation | Measured movement | Verdict |
| -- | -- | -- | -- |
| R1 | emitted status flipped at `syncpack-b100` | marginal `16/50,94/518` → `94/518,16/50` | CAUGHT |
| R2 | role label `source`→`test` at `polylith-b100` | D3 strata at that basis 17 → 12 | CAUGHT |
| R3 | held-out `overlapUsable` flipped at `polylith-b250` | disposition tally `C=94;P=64;Z=6;N=24` → `C=94;P=53;Z=6;N=35` | CAUGHT |
| R4 | `existsB` forced true at `syncpack-b250` | D4 strata 3 → 2; `BOTH_ABSENT=625` → absent | CAUGHT |
| R5 | age `deltaPos` shifted +100 at `formatjs-b100` | D5 strata 4 → 2; `0-24=86` → absent | CAUGHT |

R3 is the sharpest: perturbing only the outcome at one basis moves the
disposition arithmetic from 64/24 to 53/35, which under §7 would still be
`MIXED_CONDITIONAL_EFFECTS` but with materially different reversal counts. The
disposition is therefore demonstrably sensitive to the outcome it reads.

## Result

**Primary disposition: `MIXED_CONDITIONAL_EFFECTS`** (ANALYSIS-PLAN §7 branch 4,
fallback).

`|C| = 94, P = 64, Z = 6, N = 24, B = 6`. `P/|C| = 0.681` clears the 2/3
supermajority and no basis is net-negative, but `N/|C| = 0.255` exceeds the 1/6
reversal ceiling, so branch 2 is not taken; `P/|C| > 1/2` blocks branch 3.

Preregistered sensitivity view `overlapAll` reaches
`SEPARATION_SURVIVES_CONDITIONING` (`P=79, Z=3, N=12`). The two measures
disagree. Reported in `REPORT.md`, not suppressed; the primary stands because it
was designated primary before any result existed.

## Artifacts

| File | Content |
| -- | -- |
| `INPUT-RECEIPT.md` | META-375 SHA, manifest verification, input SHA-256 |
| `ANALYSIS-PLAN.md` | frozen grouping rules, threshold, disposition rule, joint views |
| `DENOMINATOR-AUDIT.md` | cell classes, all nine bases, built without the outcome |
| `ONE-DIMENSIONAL-RESULTS.md` | every non-empty D3–D7 cell with exact X/N |
| `JOINT-STRATA-RESULTS.md` | every non-empty J1–J3 cell with exact X/N |
| `REPORT.md` | disposition, named exceptions, boundaries |
| `FIBERY-RECONCILIATION-DRAFT.md` | OQ-13 draft |
| `MANIFEST.json` | SHA-256 of every META-377 artifact |
| `tables/denominators.json` | machine-readable cell classes |
| `tables/conditioned.overlapUsable.json` | primary results + disposition arithmetic |
| `tables/conditioned.overlapAll.json` | sensitivity results |
| `tables/composition.json` | emitted vs omitted stratum composition, TVD |
| `scripts/` | `lib.mjs`, `verify-input.mjs`, `denominators.mjs`, `render-denominators.mjs`, `condition.mjs`, `composition.mjs`, `render-results.mjs`, `checks.mjs`, `manifest.mjs` |
| `rerun.sh` | deterministic end-to-end reproduction |

## Rerun

```
bash docs/evidence/meta-377/rerun.sh
```

No network access, no miner, no model. Reads only committed JSON; writes only
under `docs/evidence/meta-377/`.

## Deviations

1. **R2 red test rewritten during construction.** Its first form measured the
   corpus-wide set of distinct role-pair strata and was correctly reported
   `INVALID (perturbation inert)`. Rewritten to measure the per-basis
   stratum→count map at the perturbed basis. The perturbation itself was not
   weakened; the measure was corrected to observe what the analysis groups on.
   Recorded because it is a change made after the plan was frozen, even though
   ANALYSIS-PLAN §10 required exactly this property.

2. **`overlapAll` sensitivity view disagrees with the primary.** Not a
   deviation from the plan — §2 froze both measures and designated
   `overlapUsable` primary in advance — but recorded here because the
   disagreement materially qualifies the result and must not be lost.

3. **D7 dominates the pooled cell count.** Exposure is multi-label, so it
   contributes six strata per relationship and 54 of the 94 comparable cells.
   This follows from the §4 rule frozen before results, not from a later choice.
   The per-dimension breakdown is reported alongside the pooled tally so the
   weighting is visible rather than hidden.

No repository, basis, threshold, dimension, joint view, or classification was
added, removed, substituted, or retuned after any recurrence result was
observed. No stop condition fired.
