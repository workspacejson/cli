# UNIVERSE-RECEIPT — META-378

**The committed snapshot, not the live API, is the universe.** Selection
reproduces from `raw/universe.json` regardless of later GitHub drift.

**Snapshot (UTC):** `2026-08-21T21:56:09.976Z`

**API:** `search/repositories`, `sort=stars`, `order=desc`, `per_page=100`, paginated to GitHub's hard 1000-result cap.

## Frozen query template

```
language:{LANG} stars:800..25000 created:<2022-01-01 pushed:>2026-01-01
fork:false archived:false size:2000..250000
```

## Strata

| Stratum | `total_count` | Materialized | Pages | Note |
| -- | --: | --: | --: | -- |
| TypeScript | 2,012 | 1,000 | 10 | truncated at GitHub's 1,000 cap |
| Rust | 775 | 775 | 8 | fully enumerated |
| Clojure | 48 | 48 | 1 | fully enumerated |
| Go | 1,408 | 1,000 | 10 | truncated at GitHub's 1,000 cap |
| Python | 2,358 | 1,000 | 10 | truncated at GitHub's 1,000 cap |
| **total** | | **3,823** | | |

Three strata exceed GitHub's hard 1,000-result search cap and are therefore
truncated. The universe is defined as **exactly the enumerable slice recorded
here**, not as the full `total_count`. That is a stated limit of the sampling
frame, fixed before selection, not a filter applied afterwards.

## Eligibility applied (PREREGISTRATION §6)

| Stratum | Distinct | Eligible | Rejected by predicate |
| -- | --: | --: | -- |
| TypeScript | 1,000 | 998 | `E9`×1, `E8`×1 |
| Rust | 775 | 773 | `E9`×1, `E8`×1 |
| Clojure | 48 | 48 | — |
| Go | 1,000 | 1,000 | — |
| Python | 1,000 | 1,000 | — |

## Anti-leak exclusion fired

Predicate `E9` excludes the three META-375 discovery repositories by exact
`full_name`. It was not a formality — two discovery repositories were present
in the universe and were removed by it:

| Stratum | Discovery repository encountered and excluded |
| -- | -- |
| TypeScript | `formatjs/formatjs` |
| Rust | `JamieMason/syncpack` |

`polyfy/polylith` did not appear in the Clojure universe under the frozen
query and so was never a candidate.
