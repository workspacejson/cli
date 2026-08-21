# TRANSACTION-FILTER-SENSITIVITY — META-378

**Secondary. Never substituted for the primary.**

META-377 showed the held-out transaction filter can flip the disposition:
`overlapUsable` reached `MIXED_CONDITIONAL_EFFECTS` while `overlapAll` reached
`SEPARATION_SURVIVES_CONDITIONING`. META-378 measures whether **that
sensitivity itself persists out of sample**.

The identical cohort, bases, grouping, thresholds, and disposition rules were
re-run under `overlapAll` after all primary results were computed.

## Held-out ledgers

| Basis | Transactions | Merge | Bulk | Release | Revert | Dependency | Usable | Non-merge |
| -- | --: | --: | --: | --: | --: | --: | --: | --: |
| `coretyped-b100` | 100 | 2 | 4 | 0 | 1 | 0 | 93 | 98 |
| `coretyped-b250` | 250 | 5 | 6 | 0 | 2 | 1 | 237 | 245 |
| `fabric-b100` | 100 | 0 | 10 | 0 | 0 | 22 | 74 | 100 |
| `fabric-b250` | 250 | 0 | 16 | 0 | 0 | 36 | 206 | 250 |
| `hydrogen-b100` | 100 | 54 | 4 | 1 | 0 | 1 | 42 | 46 |
| `hydrogen-b250` | 250 | 135 | 4 | 1 | 3 | 6 | 103 | 115 |
| `rustos-b100` | 100 | 0 | 0 | 0 | 0 | 0 | 100 | 100 |
| `rustos-b250` | 250 | 1 | 0 | 0 | 0 | 0 | 249 | 249 |
| `scikitimage-b100` | 100 | 3 | 6 | 0 | 1 | 1 | 89 | 97 |
| `scikitimage-b250` | 250 | 22 | 7 | 0 | 3 | 6 | 212 | 228 |

## Side-by-side dispositions

| | `overlapUsable` (PRIMARY) | `overlapAll` (secondary) |
| -- | -- | -- |
| R1 | **R1_NOT_REPLICATED** | R1_INDETERMINATE |
| R1 arithmetic | K=9, Rv=0, At=1 | K=9, Rv=2, At=3 |
| R2 | **R2_NOT_REPLICATED** | R2_INDETERMINATE |
| R2 arithmetic | C2=16, P2=12, Z2=2, N2=2 | C2=16, P2=9, Z2=3, N2=4 |
| Composite | **NEITHER_PATTERN_REPLICATES** | INSUFFICIENT_REPLICATION_SUPPORT |

## Required answers

**Is the direction unchanged?** Mostly, but not entirely. Under `overlapAll`
two comparable `BOTH_CURRENT` cells reverse where none reversed under the
primary, and the negative age cells rise from 2 to 4.

| Basis | Emitted | Omitted | `d_cond` | `d_uncond` |
| -- | --: | --: | --: | --: |
| `coretyped-b250` | 38/39 (97.4%) | 337/340 (99.1%) | **-1.7pp** | +3.7pp |
| `fabric-b100` | 26/50 (52.0%) | 289/444 (65.1%) | **-13.1pp** | -13.1pp |

**Does the magnitude change materially?** Yes. `overlapAll` admits bulk,
release, revert, and dependency transactions, which mechanically manufacture
co-touch. At `coretyped-b250` the omitted recurrence rate rises from 1.5% under
the primary to 72.3% under the secondary; at `fabric-b100` from 2.7% to 65.1%.
Those are not small shifts in a signal — they are a different measurement.

**Does the R1 disposition change?** Yes: `R1_NOT_REPLICATED` → `R1_INDETERMINATE`.

**Does the R2 disposition change?** Yes: `R2_NOT_REPLICATED` → `R2_INDETERMINATE`.

**Does the overall composite change?** Yes: `NEITHER_PATTERN_REPLICATES` → `INSUFFICIENT_REPLICATION_SUPPORT`.

## What this means

**The filter sensitivity META-377 found does persist out of sample** — the
choice of transaction filter still changes the answer. But its *direction* does
not carry over. In discovery, `overlapAll` produced the stronger, cleaner
result (`SEPARATION_SURVIVES_CONDITIONING`). Here it produces the weaker one:
both components fall to `INDETERMINATE` and the composite becomes
`INSUFFICIENT_REPLICATION_SUPPORT`.

So the sensitivity is a **stable property of the measurement**, not a stable
property of the finding. That is an argument for keeping the two filters
permanently separate, and against ever reading whichever one happens to look
cleaner as the result.

The primary stands. `overlapUsable` was designated primary before any result
existed, and it is not displaced by a secondary view — in either direction.
