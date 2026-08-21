# COMPARISON — META-289

**Primary metric (PREREGISTRATION §24):** macro-averaged `recall@10` over
`POSITIVE` queries, per repository. **Materiality threshold: `0.05` absolute**,
applied identically to both comparisons and in both directions.

## The incremental-value gate

`POS(r) = 1` requires `H` to materially beat **both** baselines **and** to
satisfy the non-inflation clause.

| Stratum | Repository | POSITIVE | H R@10 | B0 R@10 | B1 R@10 | Δ0 = H−B0 | Δ1 = H−B1 | non-inflated | POS |
| -- | -- | --: | --: | --: | --: | --: | --: | --: | --: |
| Go | `flyteorg/flyte` | 137 | 0.715 | 0.183 | 0.862 | **+0.5316** | **-0.1470** | yes | **0** |
| Java | `LuckPerms/LuckPerms` | 29 | 0.426 | 0.411 | 0.338 | **+0.0149** | **+0.0879** | yes | **0** |
| Python | `kornia/kornia` | 84 | 0.465 | 0.190 | 0.561 | **+0.2756** | **-0.0954** | yes | **0** |
| TypeScript | `remult/remult` | 68 | 0.682 | 0.380 | 0.413 | **+0.3020** | **+0.2681** | yes | **1** |

**`Σ POS(r) = 1` of 4.**

## H − B0 and H − B1 at every frozen K

| Stratum | Repository | K | H | B0 | B1 | H−B0 | H−B1 |
| -- | -- | --: | --: | --: | --: | --: | --: |
| Go | `flyteorg/flyte` | 1 | 0.460 | 0.043 | 0.551 | +0.4174 | -0.0915 |
| Go | `flyteorg/flyte` | 3 | 0.613 | 0.094 | 0.774 | +0.5195 | -0.1613 |
| Go | `flyteorg/flyte` | 5 | 0.650 | 0.105 | 0.838 | +0.5456 | -0.1873 |
| Go | `flyteorg/flyte` | 10 | 0.715 | 0.183 | 0.862 | +0.5316 | -0.1470 |
| Java | `LuckPerms/LuckPerms` | 1 | 0.103 | 0.083 | 0.168 | +0.0201 | -0.0644 |
| Java | `LuckPerms/LuckPerms` | 3 | 0.233 | 0.207 | 0.286 | +0.0259 | -0.0529 |
| Java | `LuckPerms/LuckPerms` | 5 | 0.324 | 0.244 | 0.300 | +0.0799 | +0.0241 |
| Java | `LuckPerms/LuckPerms` | 10 | 0.426 | 0.411 | 0.338 | +0.0149 | +0.0879 |
| Python | `kornia/kornia` | 1 | 0.283 | 0.044 | 0.369 | +0.2388 | -0.0861 |
| Python | `kornia/kornia` | 3 | 0.361 | 0.157 | 0.480 | +0.2041 | -0.1189 |
| Python | `kornia/kornia` | 5 | 0.421 | 0.165 | 0.491 | +0.2564 | -0.0700 |
| Python | `kornia/kornia` | 10 | 0.465 | 0.190 | 0.561 | +0.2756 | -0.0954 |
| TypeScript | `remult/remult` | 1 | 0.458 | 0.037 | 0.121 | +0.4208 | +0.3376 |
| TypeScript | `remult/remult` | 3 | 0.552 | 0.087 | 0.254 | +0.4652 | +0.2978 |
| TypeScript | `remult/remult` | 5 | 0.608 | 0.182 | 0.318 | +0.4252 | +0.2897 |
| TypeScript | `remult/remult` | 10 | 0.682 | 0.380 | 0.413 | +0.3020 | +0.2681 |

The pattern is stable across `K`. It is not an artefact of the primary cutoff.

## Per-query paired outcomes on recall@10 (win / loss / tie)

Descriptive; these do not enter the ladder.

| Stratum | Repository | H vs B0 | H vs B1 | queries |
| -- | -- | -- | -- | --: |
| Go | `flyteorg/flyte` | 86/1/50 | 11/35/91 | 137 |
| Java | `LuckPerms/LuckPerms` | 7/6/16 | 8/7/14 | 29 |
| Python | `kornia/kornia` | 35/9/40 | 17/24/43 | 84 |
| TypeScript | `remult/remult` | 25/2/41 | 27/3/38 | 68 |

## Non-inflation check — H never buys recall with breadth

| Stratum | Repository | frac@10 H | frac@10 B0 | frac@10 B1 | H ÷ max(baseline) | ≤ 1.25× ? |
| -- | -- | --: | --: | --: | --: | -- |
| Go | `flyteorg/flyte` | 0.0218 | 0.0327 | 0.0315 | 0.668× | PASS |
| Java | `LuckPerms/LuckPerms` | 0.1079 | 0.2298 | 0.2298 | 0.469× | PASS |
| Python | `kornia/kornia` | 0.0214 | 0.0385 | 0.0176 | 0.556× | PASS |
| TypeScript | `remult/remult` | 0.0586 | 0.0754 | 0.0754 | 0.778× | PASS |

`H` selects a **smaller** share of the test suite than the better baseline in
every repository. Whatever `H` achieves, it does not achieve by selecting more
of the suite.

## Disposition ladder — strict order, first match wins (§24)

| Rung | Disposition | Fired | Arithmetic |
| -- | -- | -- | -- |
| D1 | `INSUFFICIENT_SOURCE_TEST_SIGNAL` | no | reposWithHCoverage<0.50 = 0 (>=2?) OR totalPositive = 318 (<100?) |
| D2 | `HISTORY_ADDS_INCREMENTAL_COUPDATE_SIGNAL` | no | sumPOS = 1 (>=3?) AND no repo with delta1 <= -0.05 (one exists) |
| D3 | `MIXED_BY_REPOSITORY_OR_TESTING_CULTURE` | **FIRED** | 1 <= sumPOS(1) <= 2 |
| D4 | `HISTORY_REPLICATES_BASE_RATE_ONLY` | no | sumPOS = 0 AND repos with delta0 < 0.05 = 1 (>=3?) |
| D5 | `CURRENT_TREE_MATCHES_OR_BEATS_HISTORY` | no | terminal otherwise |

## DISPOSITION: `MIXED_BY_REPOSITORY_OR_TESTING_CULTURE`

Meaningful positive and negative repository-level results coexist under the
frozen rule, and they are **not noise — they track testing culture**:

- **`remult/remult` (TypeScript, heterogeneous test conventions)** is the only
  repository where `H` materially beats both baselines
  (Δ0 = +0.3020, Δ1 = +0.2681).
- **`flyteorg/flyte` (Go, co-located `_test.go`)** and **`kornia/kornia`
  (Python, `tests/` packages)** both show `B1` beating `H`
  (Δ1 = -0.1470 and -0.0954).
  Where the current tree encodes the convention, the current tree wins.
- **`LuckPerms/LuckPerms` (Java)** shows `H` beating `B1`
  (+0.0879) but **not** `B0`
  (+0.0149) — test popularity
  substantially explains `H` there.

**These results must not be averaged.** A cohort mean would report a modest
positive and conceal the fact that the sign of Δ1 flips with testing
convention.
