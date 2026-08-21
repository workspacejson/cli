# B0-POPULARITY — META-289

**Definition (PREREGISTRATION §15).** `score_B0(t)` is the number of eligible
transactions in the first-parent ancestry of `T0` inclusive in which `t` was
touched in the TEST role. Candidates are restricted to `Suite(T0)`, ordered by
count descending with an ascending-lexical tie-break.

**`B0` is mechanically independent of the queried source files.** Its
computation takes no argument derived from `S(T)`. Invariant **I5** proves
this by reproducing every one of the 800 `B0` lists with an implementation
that never references `sourcePaths`; red test **RT4** proves the checker is
not inert by making `B0` depend on `S(T)` and catching the change on
110/200 queries.

**Purpose.** To answer: does source-conditioned history tell us more than
*"these tests change a lot"*?

## Results — macro-averaged over `POSITIVE` queries

| Stratum | Repository | POSITIVE | Coverage | mean \|L\| | R@1 | R@3 | R@5 | R@10 | P@10 | frac@10 | MRR |
| -- | -- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| Go | `flyteorg/flyte` | 137 | 1.000 | 156.460 | 0.043 | 0.094 | 0.105 | 0.183 | 0.028 | 0.0327 | 0.1199 |
| Java | `LuckPerms/LuckPerms` | 29 | 1.000 | 50.276 | 0.083 | 0.207 | 0.244 | 0.411 | 0.084 | 0.2298 | 0.2597 |
| Python | `kornia/kornia` | 84 | 1.000 | 191.679 | 0.044 | 0.157 | 0.165 | 0.190 | 0.036 | 0.0385 | 0.1801 |
| TypeScript | `remult/remult` | 68 | 1.000 | 104.779 | 0.037 | 0.087 | 0.182 | 0.380 | 0.056 | 0.0754 | 0.1868 |

### Exact numerators / denominators (micro hits over pooled `|G|`)

| Repository | R@1 | R@3 | R@5 | R@10 |
| -- | -- | -- | -- | -- |
| `flyteorg/flyte` | 8/245 | 16/245 | 22/245 | 39/245 |
| `LuckPerms/LuckPerms` | 4/64 | 11/64 | 15/64 | 23/64 |
| `kornia/kornia` | 7/195 | 22/195 | 25/195 | 30/195 |
| `remult/remult` | 6/108 | 13/108 | 20/108 | 38/108 |

## Reading

`B0` has **coverage 1.000 in every repository** — it always produces a list,
because any test touched even once in prior history enters it. Mean list length
runs from 50.276 to
191.679 candidates. A
method that is always willing to answer is not thereby informative, which is
exactly why this control is required.

**`B0` is weak in three of four repositories and competitive in the fourth.**
In `LuckPerms/LuckPerms` it reaches R@10 = 0.411,
within 0.0149 of `H`
(0.426) — below the
frozen `0.05` materiality threshold. In that repository, **test popularity
substantially explains what source-conditioned history achieves**, and §24
records it as `POS = 0`.

That is a preserved negative result, not a rounding artefact: it is why
`LuckPerms/LuckPerms` does not count toward the incremental-value gate despite
`H` beating `B1` there by 0.0879.
