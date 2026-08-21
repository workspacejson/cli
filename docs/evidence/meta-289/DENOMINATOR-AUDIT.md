# DENOMINATOR-AUDIT — META-289 (part 1 of 2: PRE-OUTCOME)

> **Stage marker.** This file is committed in the **pre-outcome** commit with
> part 1 only. Part 2 — the outcome-side breakdown of `POSITIVE` /
> `NEW_TEST_ONLY` / `ZERO_TEST_TOUCH` queries — is added by
> `scripts/render-results.mjs` in the outcome commit. The git history of this
> file is itself the ordering proof.

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

## Integrity

| File | sha256 |
| -- | -- |
| `raw/pre-outcome.json` | `82e17524e267f55d99e3c13097458fafc0220a46f1b049ac8660da6f00676347` |
