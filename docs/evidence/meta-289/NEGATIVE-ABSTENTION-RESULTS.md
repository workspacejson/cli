# NEGATIVE-ABSTENTION-RESULTS — META-289

Every result the execution contract requires to be preserved explicitly. None
of these is averaged away, and none is a footnote to a headline number.

## 1. Most source-changing transactions touch no test file at all

This is the largest single finding in the experiment, and it is about the
proposed use rather than about `H`.

| Stratum | Repository | POSITIVE | NEW_TEST_ONLY | ZERO_TEST_TOUCH | queries | zero-test-touch rate |
| -- | -- | --: | --: | --: | --: | --: |
| Go | `flyteorg/flyte` | 137 | 19 | 44 | 200 | **22.0%** |
| Java | `LuckPerms/LuckPerms` | 29 | 11 | 160 | 200 | **80.0%** |
| Python | `kornia/kornia` | 84 | 17 | 99 | 200 | **49.5%** |
| TypeScript | `remult/remult` | 68 | 6 | 126 | 200 | **63.0%** |
| **cohort** | | **318** | **53** | **429** | **800** | **53.6%** |

**429 of 800 authentic source-changing transactions (53.6%)
touched no test file whatsoever.** In `LuckPerms/LuckPerms` the figure is
80.0%.

No ranking method can be right on those queries, because there is nothing to
rank toward. They are retained in the query denominator by §19.2 and reported
here; they are excluded from ranking metrics only because recall against an
empty target set is undefined rather than zero.

## 2. Only one repository drives the positive effect

`Σ POS(r) = 1` of 4. The single repository is `remult/remult`
(TypeScript). A cohort-level claim that "history adds incremental signal" would
rest on **one** of four repositories.

## 3. H beats B0 but not B1 — Go and Python

| Repository | Δ0 = H−B0 | Δ1 = H−B1 |
| -- | --: | --: |
| `flyteorg/flyte` (Go) | +0.5316 | **-0.1470** |
| `kornia/kornia` (Python) | +0.2756 | **-0.0954** |

Source-conditioned history is far better than base rates in both, and **worse
than a filename-and-directory rule that needs no history at all**.

## 4. H beats B1 but not B0 — Java

| Repository | Δ0 = H−B0 | Δ1 = H−B1 |
| -- | --: | --: |
| `LuckPerms/LuckPerms` (Java) | **+0.0149** | +0.0879 |

`H` R@10 = 0.426 against
`B0` = 0.411. **Test
popularity substantially explains the result there.**

## 5. Test popularity explains the result — where, and where not

`B0` is competitive only in `LuckPerms/LuckPerms`. In the other three it is
far behind (`flyte` 0.183, `kornia` 0.190, `remult` 0.380).
The base-rate explanation is repository-specific, not general — which is itself
why B0 had to be measured per repository rather than assumed weak.

## 6. Current-tree naming/path conventions explain the result — where

`B1` beats `H` in Go (0.862 vs 0.715)
and Python (0.561 vs 0.465).
In Go, `B1` also has the better MRR (0.8003 vs 0.6789).

## 7. H frequently has no historical candidate

| Stratum | Repository | H coverage | H abstention | B1 coverage | B1 abstention | B0 coverage | B0 abstention |
| -- | -- | --: | --: | --: | --: | --: | --: |
| Go | `flyteorg/flyte` | 122/137 | 0.109 | 136/137 | 0.007 | 137/137 | 0.000 |
| Java | `LuckPerms/LuckPerms` | 24/29 | 0.172 | 29/29 | 0.000 | 29/29 | 0.000 |
| Python | `kornia/kornia` | 72/84 | 0.143 | 81/84 | 0.036 | 84/84 | 0.000 |
| TypeScript | `remult/remult` | 67/68 | 0.015 | 68/68 | 0.000 | 68/68 | 0.000 |

`H` abstains on 17.2% of
`POSITIVE` queries in `LuckPerms/LuckPerms` and
14.3% in `kornia/kornia`.
Abstained queries are retained at `recall = 0`, `RR = 0`, `fraction = 0` per
§19.1 — never silently dropped.

Coverage did not fall low enough in two repositories to trigger the `D1`
`INSUFFICIENT_SOURCE_TEST_SIGNAL` rung (0 repositories
below 0.50; two are required), so the disposition rests on the merits rather
than on sparsity.

## 8. High recall bought with a large fraction of the suite

Not observed for `H` — it is the most concentrated method everywhere, and the
non-inflation clause passes in all four repositories.

It **is** observed for the baselines. `B1` in `remult/remult` ranks a mean of
125.103 candidates from a mean
suite of 132.685 and still reaches only
R@10 = 0.413
(P@10 = 0.050).
`B0` in `kornia/kornia` ranks
191.679 of
261.100 for
R@10 = 0.190.

## 9. Testing culture materially changes the result

The sign of Δ1 flips with test-file placement convention: negative where tests
are co-located or conventionally named (Go, Python), positive where they are
not (TypeScript, Java). This is the substance of the
`MIXED_BY_REPOSITORY_OR_TESTING_CULTURE` disposition.

## 10. Thin denominator in the Java stratum

`LuckPerms/LuckPerms` contributes only **29 `POSITIVE` queries of 200**.
Both of its Δ values rest on that small base and should be treated as the least
stable numbers in the report. This is disclosed rather than smoothed; the
repository was **not** replaced, because §5.6 forbids replacing a repository for
sparsity.

## 11. New test files created by T — structurally unreachable

53 of 800 queries (6.6%) touched **only** test files that
did not exist in the `T0` tree. No method could rank them, by §17. They are
reported here and excluded from the primary recall denominator, never silently
dropped.
