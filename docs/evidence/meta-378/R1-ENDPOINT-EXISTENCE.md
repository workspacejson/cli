# R1-ENDPOINT-EXISTENCE — META-378

**Confirmatory test of META-377's endpoint-existence dilution/reversal pattern.**

Discovery observed, within `BOTH_CURRENT`, a reversal at both syncpack bases
(`syncpack-b100` −10.2pp, `syncpack-b250` −30.7pp) while the other four bases
survived. The confirmatory question is whether conditioning on current
endpoint existence **attenuates, erases, or reverses** the emitted recurrence
advantage out of sample.

Primary outcome `overlapUsable`. Exact X/N retained behind every rate.
`d_uncond` is reported at every basis so attenuation is **observed rather than
inferred**.

## Comparable `BOTH_CURRENT` cells

| Basis | Repository | Emitted | rate | Omitted | rate | `d_cond` | `d_uncond` | reversal | attenuation |
| -- | -- | --: | --: | --: | --: | --: | --: | -- | -- |
| `coretyped-b250` | `clojure/core.typed` | 13/39 | 33.3% | 7/340 | 2.1% | **+31.3pp** | +24.5pp | no | no |
| `fabric-b100` | `hyperledger/fabric` | 14/50 | 28.0% | 12/444 | 2.7% | **+25.3pp** | +25.3pp | no | no |
| `fabric-b250` | `hyperledger/fabric` | 36/41 | 87.8% | 23/91 | 25.3% | **+62.5pp** | +54.2pp | no | no |
| `hydrogen-b100` | `nteract/hydrogen` | 0/21 | 0.0% | 0/72 | 0.0% | **+0.0pp** | +0.0pp | no | no |
| `hydrogen-b250` | `nteract/hydrogen` | 3/20 | 15.0% | 6/78 | 7.7% | **+7.3pp** | +4.0pp | no | no |
| `rustos-b100` | `thepowersgang/rust_os` | 8/50 | 16.0% | 13/231 | 5.6% | **+10.4pp** | +10.6pp | no | **yes** |
| `rustos-b250` | `thepowersgang/rust_os` | 19/48 | 39.6% | 56/268 | 20.9% | **+18.7pp** | +17.4pp | no | no |
| `scikitimage-b100` | `scikit-image/scikit-image` | 15/23 | 65.2% | 14/48 | 29.2% | **+36.1pp** | +20.8pp | no | no |
| `scikitimage-b250` | `scikit-image/scikit-image` | 18/23 | 78.3% | 38/244 | 15.6% | **+62.7pp** | +25.8pp | no | no |

**K = 9** comparable bases · **Rv = 0** reversals · **At = 1** attenuations.
`Rv/K = 0.000` · `At/K = 0.111`

## Non-comparable `BOTH_CURRENT` cells

Reported, never pooled, never deleted.

| Basis | Emitted N | Omitted N | Class |
| -- | --: | --: | -- |
| `coretyped-b100` | 1 | 51 | SPARSE |

## All three existence states, every basis

| Basis | `BOTH_CURRENT` E / O | `ONE_ABSENT` E / O | `BOTH_ABSENT` E / O |
| -- | -- | -- | -- |
| `coretyped-b100` | 0/1 / 1/51 | 0/6 / 0/22 | 0/43 / 0/395 |
| `coretyped-b250` | 13/39 / 7/340 | 0/9 / 0/97 | 0/2 / 0/29 |
| `fabric-b100` | 14/50 / 12/444 | 0/0 / 0/0 | 0/0 / 0/0 |
| `fabric-b250` | 36/41 / 23/91 | 0/0 / 0/15 | 0/9 / 0/23 |
| `hydrogen-b100` | 0/21 / 0/72 | 0/3 / 0/65 | 0/26 / 0/165 |
| `hydrogen-b250` | 3/20 / 6/78 | 0/1 / 0/63 | 0/29 / 0/161 |
| `rustos-b100` | 8/50 / 13/231 | 0/0 / 0/6 | 0/0 / 0/3 |
| `rustos-b250` | 19/48 / 56/268 | 0/2 / 0/2 | 0/0 / 0/2 |
| `scikitimage-b100` | 15/23 / 14/48 | 0/5 / 0/66 | 0/22 / 0/39 |
| `scikitimage-b250` | 18/23 / 38/244 | 2/7 / 1/25 | 0/20 / 0/6 |

## Disposition

# `R1_NOT_REPLICATED`

Rule: PREREGISTRATION §16, frozen at `c95f7f9001bc80453af39da784d894e984b6ff87`.

**Why:** Rv=0 and At/K=0.111<0.5 (branch 3)

Branch 1 (`K < 4`) did not fire — the replication carries more comparable
bases (9) than discovery had (6). Branch 2 required `Rv/K >= 1/3`, the rate
discovery itself showed; the replication produced **zero** reversals in nine
comparable bases. Branch 3 fired: no basis reversed and attenuation appeared at
only one of nine.

**Every comparable base shows the emitted advantage surviving conditioning on
endpoint existence**, several by a wide margin — `scikitimage-b250` +62.7pp,
`fabric-b250` +62.5pp, `scikitimage-b100` +36.1pp. In six of the nine bases the
conditioned difference is *larger* than the unconditioned one, in two it is
identical, and in one it is marginally smaller (`rustos-b100`, +10.4pp vs
+10.6pp) — the opposite of the dilution mechanism discovery proposed.

This is a **negative replication**, not a null result: the pattern was tested
with more support than it was discovered with, and it did not appear.
