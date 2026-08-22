# UNIVERSE-RECEIPT — META-380

**The committed snapshot, not the live API, is the universe.** Selection
reproduces from `raw/universe.json` regardless of later GitHub drift.

**Snapshot (UTC):** `2026-08-22T02:08:47.221Z`

**API:** `search/repositories`, `sort=stars`, `order=desc`, `per_page=100`, paginated to GitHub's hard 1000-result cap.

## Frozen query template (PREREGISTRATION §5.1)

```
language:TypeScript stars:1000..40000 created:<2022-01-01 pushed:>2026-01-01
fork:false archived:false size:5000..400000
```

## Stratum

Single stratum: TypeScript. The META-289 discovery found the residual signal
only in the TypeScript repository (remult/remult), and META-379 confirmed it
diagnostically on that same repository. This replication tests whether that
residual survives on previously unseen TypeScript repositories.

| Stratum | `total_count` | Materialized | Pages | Note |
| -- | --: | --: | --: | -- |
| TypeScript | 1,609 | 1,000 | 10 | truncated at GitHub's 1,000 cap |

The stratum exceeds GitHub's hard 1,000-result search cap and is therefore
truncated. The universe is defined as **exactly the enumerable slice recorded
here**, not as the full `total_count`. That is a stated limit of the sampling
frame, fixed before selection, not a filter applied afterwards.

## Eligibility applied (PREREGISTRATION §5.2)

Every predicate E1-E10 is re-verified offline from the snapshot record.

| Stratum | Distinct | Eligible | Rejected by predicate |
| -- | --: | --: | -- |
| TypeScript | 1,000 | 998 | `E9` x 2 |

## Anti-leak exclusion fired (PREREGISTRATION §4)

Predicate `E9` excludes every META-289 cohort repository, every META-375
discovery repository, every META-378 cohort repository, and any repository
owned by `workspacejson`. Repositories already examined by predecessor
experiments were present in this universe and were removed by it:

| Stratum | Repository encountered and excluded |
| -- | -- |
| TypeScript | `remult/remult` (META-289), `formatjs/formatjs` (META-375), `nteract/hydrogen` (META-378) |

## Integrity

| File | sha256 |
| -- | -- |
| `raw/universe.json` | `c19e1469c6d62bc55365ca54547a06cf946fabe7f73678bdb8f67dff15ecd678` |
