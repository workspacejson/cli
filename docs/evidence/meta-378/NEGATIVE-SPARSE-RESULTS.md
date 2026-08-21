# NEGATIVE-SPARSE-RESULTS — META-378

Everything the disposition arithmetic could not use, preserved. Nothing here
was deleted, pooled, or backfilled to reach a threshold.

## 1. Bases excluded from the R1 arithmetic

| Basis | Repository | `BOTH_CURRENT` emitted | omitted | Class |
| -- | -- | --: | --: | -- |
| `coretyped-b100` | `clojure/core.typed` | 1 | 51 | SPARSE |

`coretyped-b100` carries just one emitted relationship whose endpoints both
still exist, against 51 omitted. Under the frozen threshold that cell cannot be
compared, so the basis contributes nothing to R1 and is not counted in K.

## 2. Age cells below the threshold

| Basis | Bucket | Emitted | Omitted | Class |
| -- | -- | --: | --: | -- |
| `coretyped-b100` | `0-24` | 0 | 27 | OMITTED_ONLY |
| `coretyped-b100` | `25-99` | 0 | 28 | OMITTED_ONLY |
| `coretyped-b100` | `250-499` | 6 | 101 | SPARSE |
| `coretyped-b250` | `0-24` | 6 | 42 | SPARSE |
| `coretyped-b250` | `100-249` | 5 | 126 | SPARSE |
| `coretyped-b250` | `250-499` | 0 | 3 | OMITTED_ONLY |
| `fabric-b100` | `250-499` | 1 | 25 | SPARSE |
| `fabric-b250` | `25-99` | 2 | 23 | SPARSE |
| `fabric-b250` | `100-249` | 3 | 25 | SPARSE |
| `hydrogen-b100` | `0-24` | 2 | 6 | SPARSE |
| `hydrogen-b100` | `25-99` | 9 | 33 | SPARSE |
| `hydrogen-b100` | `250-499` | 2 | 20 | SPARSE |
| `hydrogen-b250` | `0-24` | 0 | 3 | OMITTED_ONLY |
| `hydrogen-b250` | `100-249` | 9 | 44 | SPARSE |
| `hydrogen-b250` | `250-499` | 4 | 18 | SPARSE |
| `rustos-b100` | `0-24` | 5 | 47 | SPARSE |
| `rustos-b100` | `100-249` | 8 | 43 | SPARSE |
| `rustos-b250` | `0-24` | 8 | 23 | SPARSE |
| `rustos-b250` | `25-99` | 3 | 30 | SPARSE |
| `rustos-b250` | `250-499` | 7 | 58 | SPARSE |
| `scikitimage-b100` | `0-24` | 5 | 8 | SPARSE |
| `scikitimage-b100` | `250-499` | 1 | 17 | SPARSE |
| `scikitimage-b250` | `100-249` | 2 | 151 | SPARSE |
| `scikitimage-b250` | `250-499` | 2 | 25 | SPARSE |

**24 non-comparable age cells.** They remain in the population and in every
denominator; they are excluded only from the comparable-cell tally that §17
operates on.

## 3. Zero-recurrence bases

| Basis | Emitted | Omitted | Note |
| -- | --: | --: | -- |
| `hydrogen-b100` | 0/50 | 0/302 | no held-out co-touch at all under the primary filter |

`hydrogen-b100` produced **zero** recurrence observations across 352
relationships. Its cells are real and comparable in denominator terms but carry
no signal in either direction; the `BOTH_CURRENT` and `100-249` cells contribute
an exact tie (`+0.0pp`) to the tallies rather than being dropped.

## 4. Pin bases

| Basis | Qualifying | Recurrence observations |
| -- | --: | --: |
| `hydrogen-pin` | 384 | 0 (window empty by definition) |
| `rustos-pin` | 269 | 0 (window empty by definition) |
| `coretyped-pin` | 575 | 0 (window empty by definition) |
| `fabric-pin` | 512 | 0 (window empty by definition) |
| `scikitimage-pin` | 218 | 0 (window empty by definition) |

The five pin bases hold 1,958 relationships and contribute zero recurrence
observations, because the held-out window `(basis, pin]` is empty at a pin.
They remain in the population characterization.

## 5. Backfilled selection attempts

Recorded in `SELECTION-RECEIPT.md`: three TypeScript candidates were skipped,
all for the frozen §7 V3 first-parent-count bound, before any co-change output
existed. No entity was replaced for any other reason.
