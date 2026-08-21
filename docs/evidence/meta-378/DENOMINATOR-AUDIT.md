# DENOMINATOR-AUDIT — META-378

**Phase A. Built before any held-out recurrence outcome was read.**

`scripts/phase-a.mjs` writes records carrying no `overlapUsable`,
`overlapAll`, or `heldOut` key, and `assertNoOutcome()` fails the run if any
appears. `scripts/denominators.mjs` re-asserts their absence on input and
again on output. The audit therefore could not have been shaped by the
outcome — the code that produced it cannot see it.

Comparability rule, frozen in PREREGISTRATION §15 and not relaxed: `emitted N >= 10 AND omitted N >= 10`.

## 1. Population and recurrence eligibility

| Basis | Repository | Language | Qualifying | Emitted | Omitted | Held-out window | Contributes recurrence |
| -- | -- | -- | --: | --: | --: | -- | -- |
| `hydrogen-pin` | `nteract/hydrogen` | TypeScript | 384 | 50 | 334 | **empty by definition** | **no** |
| `hydrogen-b100` | `nteract/hydrogen` | TypeScript | 352 | 50 | 302 | non-empty | yes |
| `hydrogen-b250` | `nteract/hydrogen` | TypeScript | 352 | 50 | 302 | non-empty | yes |
| `rustos-pin` | `thepowersgang/rust_os` | Rust | 269 | 50 | 219 | **empty by definition** | **no** |
| `rustos-b100` | `thepowersgang/rust_os` | Rust | 290 | 50 | 240 | non-empty | yes |
| `rustos-b250` | `thepowersgang/rust_os` | Rust | 322 | 50 | 272 | non-empty | yes |
| `coretyped-pin` | `clojure/core.typed` | Clojure | 575 | 50 | 525 | **empty by definition** | **no** |
| `coretyped-b100` | `clojure/core.typed` | Clojure | 518 | 50 | 468 | non-empty | yes |
| `coretyped-b250` | `clojure/core.typed` | Clojure | 516 | 50 | 466 | non-empty | yes |
| `fabric-pin` | `hyperledger/fabric` | Go | 512 | 50 | 462 | **empty by definition** | **no** |
| `fabric-b100` | `hyperledger/fabric` | Go | 494 | 50 | 444 | non-empty | yes |
| `fabric-b250` | `hyperledger/fabric` | Go | 179 | 50 | 129 | non-empty | yes |
| `scikitimage-pin` | `scikit-image/scikit-image` | Python | 218 | 50 | 168 | **empty by definition** | **no** |
| `scikitimage-b100` | `scikit-image/scikit-image` | Python | 203 | 50 | 153 | non-empty | yes |
| `scikitimage-b250` | `scikit-image/scikit-image` | Python | 325 | 50 | 275 | non-empty | yes |
| **total** | | | **5,509** | | | | |

5,509 relationships across 15 repository × basis pairs.
The 5 pin bases (1,958 relationships) carry an empty held-out window
**by definition** — the window is `(basis, pin]` and is empty at a pin — so
they contribute zero recurrence observations. The recurrence denominator is the **10** historical bases
(3,551 relationships), against six in discovery.

## 2. R1 cells — endpoint existence (D4)

All three states at every recurrence-contributing basis. `BOTH_CURRENT` is
R1's primary state; the other two are reported so nothing is dropped.

| Basis | `BOTH_CURRENT` E/O | class | `ONE_ABSENT` E/O | class | `BOTH_ABSENT` E/O | class |
| -- | --: | -- | --: | -- | --: | -- |
| `hydrogen-b100` | 21/72 | COMPARABLE | 3/65 | SPARSE | 26/165 | COMPARABLE |
| `hydrogen-b250` | 20/78 | COMPARABLE | 1/63 | SPARSE | 29/161 | COMPARABLE |
| `rustos-b100` | 50/231 | COMPARABLE | 0/6 | OMITTED_ONLY | 0/3 | OMITTED_ONLY |
| `rustos-b250` | 48/268 | COMPARABLE | 2/2 | SPARSE | 0/2 | OMITTED_ONLY |
| `coretyped-b100` | 1/51 | SPARSE | 6/22 | SPARSE | 43/395 | COMPARABLE |
| `coretyped-b250` | 39/340 | COMPARABLE | 9/97 | SPARSE | 2/29 | SPARSE |
| `fabric-b100` | 50/444 | COMPARABLE | 0/0 | EMPTY | 0/0 | EMPTY |
| `fabric-b250` | 41/91 | COMPARABLE | 0/15 | OMITTED_ONLY | 9/23 | SPARSE |
| `scikitimage-b100` | 23/48 | COMPARABLE | 5/66 | SPARSE | 22/39 | COMPARABLE |
| `scikitimage-b250` | 23/244 | COMPARABLE | 7/25 | SPARSE | 20/6 | SPARSE |

**K = 9** bases have a COMPARABLE `BOTH_CURRENT` cell.

`coretyped-b100` is **SPARSE** at `BOTH_CURRENT` (emitted 1, omitted 51) and is excluded from the R1 arithmetic. It remains in the denominator and is reported.

PREREGISTRATION §16 branch 1 fires `R1_INDETERMINATE` if `K < 4`. K = 9, so R1 proceeds.

## 3. R2 cells — age buckets (D5)

All four frozen buckets at every recurrence-contributing basis. `*` marks a
COMPARABLE cell. No rebucketing was applied.

| Basis | `0-24` | `25-99` | `100-249` | `250-499` | comparable |
| -- | --: | --: | --: | --: | --: |
| `hydrogen-b100` | 2/6 | 9/33 | 37/243\* | 2/20 | 1 |
| `hydrogen-b250` | 0/3 | 37/237\* | 9/44 | 4/18 | 1 |
| `rustos-b100` | 5/47 | 23/54\* | 8/43 | 14/96\* | 2 |
| `rustos-b250` | 8/23 | 3/30 | 32/161\* | 7/58 | 1 |
| `coretyped-b100` | 0/27 | 0/28 | 44/312\* | 6/101 | 1 |
| `coretyped-b250` | 6/42 | 39/295\* | 5/126 | 0/3 | 1 |
| `fabric-b100` | 12/17\* | 12/26\* | 25/376\* | 1/25 | 3 |
| `fabric-b250` | 35/34\* | 2/23 | 3/25 | 10/47\* | 2 |
| `scikitimage-b100` | 5/8 | 14/43\* | 30/85\* | 1/17 | 2 |
| `scikitimage-b250` | 33/78\* | 13/21\* | 2/151 | 2/25 | 2 |
| **total** | | | | | **16** |

**C2 = 16** comparable age cells, against 13 in discovery.

PREREGISTRATION §17 branch 1 fires `R2_INDETERMINATE` if `C2 < 8`. C2 = 16, so R2 proceeds.

## 4. Cell-class totals

| Dimension | EMPTY | EMITTED_ONLY | OMITTED_ONLY | SPARSE | COMPARABLE |
| -- | --: | --: | --: | --: | --: |
| D4 endpoint existence | 2 | 0 | 4 | 11 | 13 |
| D5 age bucket | 0 | 0 | 4 | 20 | 16 |

All non-empty cells above are reported. Sparse and one-sided cells are
preserved in `NEGATIVE-SPARSE-RESULTS.md` and are never pooled to reach the
threshold.
