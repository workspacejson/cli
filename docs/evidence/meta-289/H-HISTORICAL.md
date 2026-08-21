# H-HISTORICAL — META-289

**Definition (PREREGISTRATION §14).** The simplest count-based
source-conditioned signal that answers the question:

```
support_{<T}(s,t) = number of eligible transactions strictly before T in which
                    source path s and test path t were both touched

score_H(t) = SUM over s in S(T) of support_{<T}(s,t)      for t in Suite(T0)
```

Ordered by score descending, ties broken by ascending lexical path. No decay,
no normalization, no confidence, no lift, no learned weight, no semantic
inference, no author or commit-purpose feature.

**Temporal isolation** is structural, not filtered: the miner snapshots its
count tables, ranks, and only then folds `T` in — so `T` contributes exactly
zero to its own features by construction (`TEMPORAL-ISOLATION.md` §2).
Invariant **I3** confirms `historyTxnCount` equals the count of eligible
transactions with index strictly below `index(T)` for all 800 queries, and
**I7** reproduces every `H` list with an independent explicit-ancestry-filter
implementation. Red test **RT1** proves the checker is not inert: folding
`T` in before its snapshot changed `rankedH` on 26/200 queries.

## Results — macro-averaged over `POSITIVE` queries

| Stratum | Repository | POSITIVE | Coverage | Abstention | mean \|L\| | R@1 | R@3 | R@5 | R@10 | P@10 | frac@10 | MRR |
| -- | -- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| Go | `flyteorg/flyte` | 137 | 0.891 | 0.109 | 13.007 | 0.460 | 0.613 | 0.650 | 0.715 | 0.229 | 0.0218 | 0.6789 |
| Java | `LuckPerms/LuckPerms` | 29 | 0.828 | 0.172 | 12.517 | 0.103 | 0.233 | 0.324 | 0.426 | 0.166 | 0.1079 | 0.2458 |
| Python | `kornia/kornia` | 84 | 0.857 | 0.143 | 9.786 | 0.283 | 0.361 | 0.421 | 0.465 | 0.200 | 0.0214 | 0.4205 |
| TypeScript | `remult/remult` | 68 | 0.985 | 0.015 | 37.838 | 0.458 | 0.552 | 0.608 | 0.682 | 0.201 | 0.0586 | 0.6152 |

### Exact numerators / denominators

| Repository | R@1 | R@3 | R@5 | R@10 |
| -- | -- | -- | -- | -- |
| `flyteorg/flyte` | 84/245 | 121/245 | 133/245 | 151/245 |
| `LuckPerms/LuckPerms` | 3/64 | 10/64 | 16/64 | 22/64 |
| `kornia/kornia` | 30/195 | 42/195 | 50/195 | 57/195 |
| `remult/remult` | 36/108 | 47/108 | 54/108 | 65/108 |

## H is the most concentrated method everywhere

`H` has the **shortest candidate list and the lowest candidate-set fraction**
of the three methods in three of four repositories, and the highest P@10 in
two. It buys nothing by breadth: the §24 non-inflation clause holds in every
repository (`NONINFLATED = true` for all four).

## Preregistered secondary — SUM vs MAX aggregation (§13)

Both aggregation rules were named in the preregistration before outcomes, so
neither could be chosen after seeing which predicts better.

| Stratum | Repository | R@10 (SUM, primary) | R@10 (MAX) | Δ | MRR SUM | MRR MAX |
| -- | -- | --: | --: | --: | --: | --: |
| Go | `flyteorg/flyte` | 0.715 | 0.714 | -0.0015 | 0.6789 | 0.6535 |
| Java | `LuckPerms/LuckPerms` | 0.426 | 0.433 | +0.0069 | 0.2458 | 0.3313 |
| Python | `kornia/kornia` | 0.465 | 0.464 | -0.0007 | 0.4205 | 0.3904 |
| TypeScript | `remult/remult` | 0.682 | 0.667 | -0.0147 | 0.6152 | 0.5610 |

**The aggregation choice does not drive any result.** The largest divergence at
R@10 is 0.0147,
well inside the `0.05` materiality threshold, and no repository's `POS`
verdict would change under `MAX`. The §24 disposition is unaffected.
