# UNIVERSE-RECEIPT — META-289

**The committed snapshot, not the live API, is the universe.** Selection
reproduces from `raw/universe.json` regardless of later GitHub drift.

**Snapshot (UTC):** `2026-08-21T23:04:08.202Z`

**API:** `search/repositories`, `sort=stars`, `order=desc`, `per_page=100`, paginated to GitHub's hard 1000-result cap.

## Frozen query template (PREREGISTRATION §5.1)

```
language:{LANG} stars:1000..40000 created:<2022-01-01 pushed:>2026-01-01
fork:false archived:false size:5000..400000
```

## Strata

Four strata chosen because their testing cultures differ materially in exactly
the dimension B1 measures — how discoverable the source↔test relation is from
the current tree alone.

| Stratum | `total_count` | Materialized | Pages | Note |
| -- | --: | --: | --: | -- |
| Go | 1,126 | 1,000 | 10 | truncated at GitHub's 1,000 cap |
| Java | 887 | 887 | 9 | fully enumerated |
| Python | 1,756 | 1,000 | 10 | truncated at GitHub's 1,000 cap |
| TypeScript | 1,609 | 1,000 | 10 | truncated at GitHub's 1,000 cap |
| **total** | | **3,887** | | |

Three strata exceed GitHub's hard 1,000-result search cap and are therefore
truncated. The universe is defined as **exactly the enumerable slice recorded
here**, not as the full `total_count`. That is a stated limit of the sampling
frame, fixed before selection, not a filter applied afterwards.

## Eligibility applied (PREREGISTRATION §5.2)

Every predicate E1–E10 is re-verified offline from the snapshot record rather
than trusted from the query, so the filter is auditable without network access.

| Stratum | Distinct | Eligible | Rejected by predicate |
| -- | --: | --: | -- |
| Go | 1,000 | 999 | `E9`×1 |
| Java | 887 | 887 | — |
| Python | 1,000 | 999 | `E9`×1 |
| TypeScript | 1,000 | 999 | `E9`×1 |

## Anti-leak exclusion fired (PREREGISTRATION §4)

Predicate `E9` excludes every META-375 discovery repository, every META-378
cohort repository, and any repository owned by `workspacejson`. It was not a
formality — repositories already examined by predecessor experiments were
present in this universe and were removed by it:

| Stratum | Repository encountered and excluded |
| -- | -- |
| Go | `hyperledger/fabric` |
| Python | `scikit-image/scikit-image` |
| TypeScript | `formatjs/formatjs` |

## Integrity

| File | sha256 |
| -- | -- |
| `raw/universe.json` | `a4bd25d48b965ecec12abf6f7d95c3be4336623a7312e7e6b93cbc1a9a90e53e` |
