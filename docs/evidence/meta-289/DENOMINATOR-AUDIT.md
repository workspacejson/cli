# DENOMINATOR-AUDIT — META-289

> **Stage marker.** Part 1 was committed in the **pre-outcome** commit before
> any outcome existed; part 2 was added in the outcome commit. The git history
> of this file is itself the ordering proof.

## §17 candidate test-suite denominator

`Suite(T0) = { p ∈ git ls-tree -r --name-only T0 : TEST(p) }`

Every method ranks a subset of `Suite(T0)` and nothing else. The suite holds
only tests extant in the `T0` tree — never a test deleted before `T0`, never a
test created by `T` itself.

| Stratum | Repository | Queries | Suite min | Suite mean | Suite max | History txns @ first query | @ last query |
| -- | -- | --: | --: | --: | --: | --: | --: |
| Go | `flyteorg/flyte` | 200 | 235 | 390.9 | 687 | 1,852 | 2,348 |
| Java | `LuckPerms/LuckPerms` | 200 | 8 | 45.6 | 84 | 1,943 | 2,182 |
| Python | `kornia/kornia` | 200 | 232 | 261.1 | 279 | 2,024 | 2,330 |
| TypeScript | `remult/remult` | 200 | 126 | 132.7 | 142 | 2,414 | 2,861 |

Each record carries `suiteSha256` = `sha256` of the newline-joined sorted
suite. The outcome stage re-derives `Suite(T0)` from git independently and
**verifies that hash before reading any outcome**, so the denominator cannot
drift between stages.

## Candidate-list occupancy, before any outcome is known

These counts require no outcome and are therefore reported here, in the
pre-outcome commit. "Non-empty" means the method produced at least one
candidate; it says nothing about whether any candidate is correct.

| Stratum | Repository | H non-empty | B0 non-empty | B1 non-empty | mean \|L_H\| | mean \|L_B0\| | mean \|L_B1\| |
| -- | -- | --: | --: | --: | --: | --: | --: |
| Go | `flyteorg/flyte` | 161/200 | 200/200 | 198/200 | 11.1 | 165.9 | 97.0 |
| Java | `LuckPerms/LuckPerms` | 115/200 | 200/200 | 152/200 | 5.3 | 41.1 | 26.1 |
| Python | `kornia/kornia` | 161/200 | 200/200 | 187/200 | 9.2 | 192.8 | 5.6 |
| TypeScript | `remult/remult` | 174/200 | 200/200 | 197/200 | 23.9 | 104.5 | 110.5 |

`B0` is non-empty on every query in every repository, as expected: any test
touched even once in prior history enters its list. That is precisely why `B0`
is the required base-rate control — a method that is always willing to answer
is not thereby informative.

## Part 2 — outcome-side query classification (§19.2)

Every one of the 800 queries falls into exactly one class, and the three counts
partition 200 per repository. Invariant **I10** re-derives these counts from
`raw/outcomes.json` and checks the partition.

| Stratum | Repository | queries | POSITIVE | NEW_TEST_ONLY | ZERO_TEST_TOUCH | Σ\|G\| | new test files |
| -- | -- | --: | --: | --: | --: | --: | --: |
| Go | `flyteorg/flyte` | 200 | 137 | 19 | 44 | 245 | 46 |
| Java | `LuckPerms/LuckPerms` | 200 | 29 | 11 | 160 | 64 | 71 |
| Python | `kornia/kornia` | 200 | 84 | 17 | 99 | 195 | 48 |
| TypeScript | `remult/remult` | 200 | 68 | 6 | 126 | 108 | 13 |

`NEW_TEST_ONLY` queries touched only test files absent from `Suite(T0)` —
structurally unreachable for every method by §17. `ZERO_TEST_TOUCH` queries
touched no test file at all.

## Recall numerators and denominators, exactly as reported

Micro form: pooled hits over pooled \|G\| across `POSITIVE` queries. The macro
figures in the result documents are per-query means over the same query set.
The final column is the number of queries on which `precision@K` is defined for
`H` (§19.1 excludes abstentions from the precision mean only).

| Repository | K | H hits/Σ\|G\| | B0 hits/Σ\|G\| | B1 hits/Σ\|G\| | H precision defined |
| -- | --: | -- | -- | -- | -- |
| `flyte` | 1 | 84/245 | 8/245 | 98/245 | 122/137 |
| `flyte` | 3 | 121/245 | 16/245 | 161/245 | 122/137 |
| `flyte` | 5 | 133/245 | 22/245 | 181/245 | 122/137 |
| `flyte` | 10 | 151/245 | 39/245 | 190/245 | 122/137 |
| `LuckPerms` | 1 | 3/64 | 4/64 | 9/64 | 24/29 |
| `LuckPerms` | 3 | 10/64 | 11/64 | 16/64 | 24/29 |
| `LuckPerms` | 5 | 16/64 | 15/64 | 18/64 | 24/29 |
| `LuckPerms` | 10 | 22/64 | 23/64 | 24/64 | 24/29 |
| `kornia` | 1 | 30/195 | 7/195 | 35/195 | 72/84 |
| `kornia` | 3 | 42/195 | 22/195 | 52/195 | 72/84 |
| `kornia` | 5 | 50/195 | 25/195 | 57/195 | 72/84 |
| `kornia` | 10 | 57/195 | 30/195 | 68/195 | 72/84 |
| `remult` | 1 | 36/108 | 6/108 | 10/108 | 67/68 |
| `remult` | 3 | 47/108 | 13/108 | 21/108 | 67/68 |
| `remult` | 5 | 54/108 | 20/108 | 26/108 | 67/68 |
| `remult` | 10 | 65/108 | 38/108 | 34/108 | 67/68 |

## Denominators survive to reporting

Invariant **I10** asserts that every rate in `raw/results.json` carries a
numerator and denominator recomputed from `raw/outcomes.json`, and that
`POSITIVE + NEW_TEST_ONLY + ZERO_TEST_TOUCH == 200` in every repository.
Result: `PASS`.

## Integrity

| File | sha256 |
| -- | -- |
| `raw/pre-outcome.json` | `82e17524e267f55d99e3c13097458fafc0220a46f1b049ac8660da6f00676347` |
| `raw/outcomes.json` | `57fda7c06b3cff158876af8a79bc43b817bb2306e750ca4d9303c2ff361b759b` |
| `raw/results.json` | `70cc7b877d3f60c389438bd3b15f47cf6f1277dbb9b0e2698b29b13aa842e00f` |
