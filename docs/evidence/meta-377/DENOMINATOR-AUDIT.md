# DENOMINATOR-AUDIT — META-377

**Phase 3. Built before any held-out recurrence rate was calculated.**

`scripts/denominators.mjs` loads the frozen relationships with
`load(..., { withOutcome: false })`, which strips `overlapUsable` and
`overlapAll` from every row, and then asserts the outcome fields are absent.
The grouping tables below therefore could not have been shaped by the
outcome — the script that produced them cannot see it.

Comparability rule, frozen in ANALYSIS-PLAN §5 and not lowered afterwards:

```
COMPARABLE  iff  emitted N >= 10  AND  omitted N >= 10
```

All non-empty cells are reported. Nothing is deleted, and no sparse cell is
pooled across strata, bases, or repositories.

## 1. Population and recurrence eligibility (all nine bases)

| Basis | Qualifying | Emitted | Omitted | Held-out window | Contributes recurrence |
| -- | --: | --: | --: | -- | -- |
| `syncpack-pin` | 729 | 50 | 679 | **empty by definition** | **no** |
| `syncpack-b100` | 568 | 50 | 518 | non-empty | yes |
| `syncpack-b250` | 784 | 50 | 734 | non-empty | yes |
| `formatjs-pin` | 713 | 50 | 663 | **empty by definition** | **no** |
| `formatjs-b100` | 1,242 | 50 | 1,192 | non-empty | yes |
| `formatjs-b250` | 1,776 | 50 | 1,726 | non-empty | yes |
| `polylith-pin` | 1,658 | 50 | 1,608 | **empty by definition** | **no** |
| `polylith-b100` | 1,406 | 50 | 1,356 | non-empty | yes |
| `polylith-b250` | 327 | 50 | 277 | non-empty | yes |
| **total** | **9,203** | **450** | **8,753** | | |

The three pin bases (`syncpack-pin`, `formatjs-pin`, `polylith-pin`) hold
3,100 relationships. They remain in the population
characterization and contribute **zero** recurrence observations, because the
held-out window is `(basis, pin]` and is empty at a pin (META-375
PREREGISTRATION §13). This is definitional, not a measurement.

The recurrence denominator is the 6 bases with a non-empty window:
6,103 relationships.

## 2. One-dimensional cells (D3–D7)

Cell counts by class, per basis. `COMPARABLE@held-out` counts only the six
bases that contribute a recurrence result.

### D3 — endpoint-role pair

| Basis | EMPTY | EMITTED_ONLY | OMITTED_ONLY | SPARSE | COMPARABLE | Distinct strata |
| -- | --: | --: | --: | --: | --: | --: |
| `syncpack-pin` *(pin)* | 0 | 0 | 14 | 4 | 1 | 19 |
| `syncpack-b100` | 0 | 0 | 10 | 7 | 1 | 18 |
| `syncpack-b250` | 0 | 1 | 10 | 4 | 1 | 16 |
| `formatjs-pin` *(pin)* | 0 | 0 | 19 | 5 | 1 | 25 |
| `formatjs-b100` | 0 | 0 | 24 | 2 | 1 | 27 |
| `formatjs-b250` | 0 | 0 | 21 | 1 | 1 | 23 |
| `polylith-pin` *(pin)* | 0 | 0 | 10 | 6 | 3 | 19 |
| `polylith-b100` | 0 | 0 | 6 | 10 | 1 | 17 |
| `polylith-b250` | 0 | 0 | 4 | 9 | 2 | 15 |
| **all nine** | **0** | **1** | **118** | **48** | **12** | |

**COMPARABLE@held-out = 7**

### D4 — endpoint-existence state

| Basis | EMPTY | EMITTED_ONLY | OMITTED_ONLY | SPARSE | COMPARABLE | Distinct strata |
| -- | --: | --: | --: | --: | --: | --: |
| `syncpack-pin` *(pin)* | 0 | 0 | 0 | 2 | 1 | 3 |
| `syncpack-b100` | 0 | 0 | 0 | 0 | 3 | 3 |
| `syncpack-b250` | 0 | 0 | 0 | 1 | 2 | 3 |
| `formatjs-pin` *(pin)* | 0 | 0 | 0 | 1 | 1 | 2 |
| `formatjs-b100` | 0 | 0 | 2 | 0 | 1 | 3 |
| `formatjs-b250` | 0 | 0 | 2 | 0 | 1 | 3 |
| `polylith-pin` *(pin)* | 0 | 0 | 0 | 1 | 2 | 3 |
| `polylith-b100` | 0 | 0 | 0 | 1 | 2 | 3 |
| `polylith-b250` | 0 | 0 | 1 | 1 | 1 | 3 |
| **all nine** | **0** | **0** | **5** | **7** | **14** | |

**COMPARABLE@held-out = 10**

### D5 — age bucket

| Basis | EMPTY | EMITTED_ONLY | OMITTED_ONLY | SPARSE | COMPARABLE | Distinct strata |
| -- | --: | --: | --: | --: | --: | --: |
| `syncpack-pin` *(pin)* | 0 | 0 | 1 | 1 | 2 | 4 |
| `syncpack-b100` | 0 | 0 | 0 | 2 | 2 | 4 |
| `syncpack-b250` | 0 | 0 | 0 | 2 | 2 | 4 |
| `formatjs-pin` *(pin)* | 0 | 0 | 0 | 2 | 2 | 4 |
| `formatjs-b100` | 0 | 0 | 0 | 1 | 3 | 4 |
| `formatjs-b250` | 0 | 0 | 2 | 1 | 1 | 4 |
| `polylith-pin` *(pin)* | 0 | 0 | 1 | 1 | 2 | 4 |
| `polylith-b100` | 0 | 0 | 0 | 2 | 2 | 4 |
| `polylith-b250` | 0 | 0 | 0 | 0 | 3 | 3 |
| **all nine** | **0** | **0** | **4** | **12** | **19** | |

**COMPARABLE@held-out = 13**

### D6 — persistence X/Y

| Basis | EMPTY | EMITTED_ONLY | OMITTED_ONLY | SPARSE | COMPARABLE | Distinct strata |
| -- | --: | --: | --: | --: | --: | --: |
| `syncpack-pin` *(pin)* | 0 | 0 | 1 | 2 | 2 | 5 |
| `syncpack-b100` | 0 | 1 | 0 | 2 | 2 | 5 |
| `syncpack-b250` | 0 | 1 | 0 | 3 | 1 | 5 |
| `formatjs-pin` *(pin)* | 0 | 0 | 1 | 2 | 2 | 5 |
| `formatjs-b100` | 0 | 1 | 1 | 1 | 2 | 5 |
| `formatjs-b250` | 0 | 0 | 3 | 1 | 1 | 5 |
| `polylith-pin` *(pin)* | 0 | 0 | 0 | 2 | 2 | 4 |
| `polylith-b100` | 0 | 0 | 0 | 1 | 2 | 3 |
| `polylith-b250` | 0 | 0 | 0 | 0 | 2 | 2 |
| **all nine** | **0** | **3** | **6** | **14** | **16** | |

**COMPARABLE@held-out = 10**

### D7 — current-tree exposure

| Basis | EMPTY | EMITTED_ONLY | OMITTED_ONLY | SPARSE | COMPARABLE | Distinct strata |
| -- | --: | --: | --: | --: | --: | --: |
| `syncpack-pin` *(pin)* | 0 | 0 | 0 | 7 | 7 | 14 |
| `syncpack-b100` | 0 | 0 | 0 | 5 | 9 | 14 |
| `syncpack-b250` | 0 | 1 | 0 | 2 | 11 | 14 |
| `formatjs-pin` *(pin)* | 0 | 0 | 0 | 3 | 10 | 13 |
| `formatjs-b100` | 0 | 0 | 2 | 3 | 9 | 14 |
| `formatjs-b250` | 0 | 0 | 3 | 3 | 8 | 14 |
| `polylith-pin` *(pin)* | 0 | 0 | 0 | 5 | 8 | 13 |
| `polylith-b100` | 0 | 0 | 0 | 5 | 8 | 13 |
| `polylith-b250` | 0 | 0 | 1 | 2 | 9 | 12 |
| **all nine** | **0** | **1** | **6** | **35** | **79** | |

**COMPARABLE@held-out = 54**

## 3. Joint cells (J1–J3)

Cell counts by class, per basis. `COMPARABLE@held-out` counts only the six
bases that contribute a recurrence result.

### J1 — endpoint-role pair × age bucket

| Basis | EMPTY | EMITTED_ONLY | OMITTED_ONLY | SPARSE | COMPARABLE | Distinct strata |
| -- | --: | --: | --: | --: | --: | --: |
| `syncpack-pin` *(pin)* | 0 | 2 | 37 | 7 | 1 | 47 |
| `syncpack-b100` | 0 | 4 | 22 | 10 | 1 | 37 |
| `syncpack-b250` | 0 | 4 | 20 | 6 | 1 | 31 |
| `formatjs-pin` *(pin)* | 0 | 0 | 45 | 11 | 1 | 57 |
| `formatjs-b100` | 0 | 1 | 62 | 4 | 2 | 69 |
| `formatjs-b250` | 0 | 0 | 58 | 1 | 1 | 60 |
| `polylith-pin` *(pin)* | 0 | 1 | 43 | 16 | 0 | 60 |
| `polylith-b100` | 0 | 1 | 38 | 20 | 0 | 59 |
| `polylith-b250` | 0 | 0 | 18 | 17 | 1 | 36 |
| **all nine** | **0** | **13** | **343** | **92** | **8** | |

**COMPARABLE@held-out = 6**

### J2 — endpoint-role pair × endpoint-existence state

| Basis | EMPTY | EMITTED_ONLY | OMITTED_ONLY | SPARSE | COMPARABLE | Distinct strata |
| -- | --: | --: | --: | --: | --: | --: |
| `syncpack-pin` *(pin)* | 0 | 2 | 26 | 6 | 1 | 35 |
| `syncpack-b100` | 0 | 4 | 22 | 8 | 1 | 35 |
| `syncpack-b250` | 0 | 4 | 19 | 5 | 1 | 29 |
| `formatjs-pin` *(pin)* | 0 | 1 | 19 | 6 | 1 | 27 |
| `formatjs-b100` | 0 | 0 | 40 | 2 | 1 | 43 |
| `formatjs-b250` | 0 | 0 | 41 | 1 | 1 | 43 |
| `polylith-pin` *(pin)* | 0 | 0 | 35 | 13 | 0 | 48 |
| `polylith-b100` | 0 | 0 | 29 | 17 | 0 | 46 |
| `polylith-b250` | 0 | 1 | 24 | 9 | 2 | 36 |
| **all nine** | **0** | **12** | **255** | **67** | **8** | |

**COMPARABLE@held-out = 6**

### J3 — age bucket × persistence X/Y

| Basis | EMPTY | EMITTED_ONLY | OMITTED_ONLY | SPARSE | COMPARABLE | Distinct strata |
| -- | --: | --: | --: | --: | --: | --: |
| `syncpack-pin` *(pin)* | 0 | 1 | 8 | 8 | 0 | 17 |
| `syncpack-b100` | 0 | 3 | 5 | 7 | 1 | 16 |
| `syncpack-b250` | 0 | 2 | 4 | 6 | 2 | 14 |
| `formatjs-pin` *(pin)* | 0 | 1 | 9 | 5 | 2 | 17 |
| `formatjs-b100` | 0 | 2 | 7 | 5 | 2 | 16 |
| `formatjs-b250` | 0 | 0 | 14 | 1 | 1 | 16 |
| `polylith-pin` *(pin)* | 0 | 0 | 3 | 9 | 1 | 13 |
| `polylith-b100` | 0 | 0 | 1 | 6 | 2 | 9 |
| `polylith-b250` | 0 | 0 | 0 | 1 | 4 | 5 |
| **all nine** | **0** | **9** | **51** | **48** | **15** | |

**COMPARABLE@held-out = 12**

## 4. Comparable-cell budget for the disposition rule

ANALYSIS-PLAN §7 runs on `COMPARABLE` cells of **D3–D7** at the six held-out
bases. That budget is:

| Dimension | COMPARABLE@held-out |
| -- | --: |
| D3 endpoint-role pair | 7 |
| D4 endpoint-existence state | 10 |
| D5 age bucket | 13 |
| D6 persistence X/Y | 10 |
| D7 current-tree exposure | 54 |
| **|C|** | **94** |

Bases contributing ≥1 comparable cell: **B = 6** of 6.

Per ANALYSIS-PLAN §7 branch 1, `INSUFFICIENT_WITHIN_STRATUM_SUPPORT` fires
if `|C| == 0` or `B < 4`. Here |C| = 94 and B = 6, so the corpus **does**
support the conditioning comparison under the frozen threshold and the
analysis proceeds to Phase 4.

## 5. What the sparsity itself shows

The dominant non-comparable class is `OMITTED_ONLY` — strata populated
entirely by omitted relationships with no emitted counterpart at that basis.
This is a direct consequence of the cap: 50 emitted relationships per basis
must cover the same stratum space as hundreds or thousands of omitted ones,
so most fine-grained strata can never be compared within-basis at all.

That is a structural property of the frozen design, recorded here before any
outcome was read. It bounds what any conditioning analysis on this corpus can
answer, independent of what the recurrence numbers turn out to be.
