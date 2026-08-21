# R2-AGE — META-378

**Confirmatory test of META-377's age-conditioned reversal pattern.**

Discovery found D5 net negative — 5 positive, 1 tie, 7 negative across 13
comparable cells — with both syncpack bases reversing in every comparable age
cell and a largest reversal of −31.5pp. The confirmatory question is whether
the emitted advantage **continues to disappear or reverse** after comparing
like-aged relationships with like, out of sample.

Buckets are META-377's exactly. **No rebucketing was applied.** No decay
function is inferred, no recency weighting added, no age-normalized support
score created.

## Every populated age cell, all ten bases

`*` marks COMPARABLE. Sparse cells are shown, never pooled.

| Basis | Bucket | Emitted | Omitted | Emitted rate | Omitted rate | Diff | Class |
| -- | -- | --: | --: | --: | --: | --: | -- |
| `coretyped-b100` | `0-24` | 0/0 | 1/27 | — | 3.7% | — | OMITTED_ONLY |
| `coretyped-b100` | `25-99` | 0/0 | 0/28 | — | 0.0% | — | OMITTED_ONLY |
| `coretyped-b100` | `100-249` \* | 0/44 | 0/312 | 0.0% | 0.0% | **+0.0pp** | COMPARABLE |
| `coretyped-b100` | `250-499` | 0/6 | 0/101 | 0.0% | 0.0% | — | SPARSE |
| `coretyped-b250` | `0-24` | 1/6 | 2/42 | 16.7% | 4.8% | — | SPARSE |
| `coretyped-b250` | `25-99` \* | 12/39 | 3/295 | 30.8% | 1.0% | **+29.8pp** | COMPARABLE |
| `coretyped-b250` | `100-249` | 0/5 | 2/126 | 0.0% | 1.6% | — | SPARSE |
| `coretyped-b250` | `250-499` | 0/0 | 0/3 | — | 0.0% | — | OMITTED_ONLY |
| `fabric-b100` | `0-24` \* | 6/12 | 9/17 | 50.0% | 52.9% | **-2.9pp** | COMPARABLE |
| `fabric-b100` | `25-99` \* | 4/12 | 0/26 | 33.3% | 0.0% | **+33.3pp** | COMPARABLE |
| `fabric-b100` | `100-249` \* | 4/25 | 2/376 | 16.0% | 0.5% | **+15.5pp** | COMPARABLE |
| `fabric-b100` | `250-499` | 0/1 | 1/25 | 0.0% | 4.0% | — | SPARSE |
| `fabric-b250` | `0-24` \* | 35/35 | 20/34 | 100.0% | 58.8% | **+41.2pp** | COMPARABLE |
| `fabric-b250` | `25-99` | 0/2 | 1/23 | 0.0% | 4.3% | — | SPARSE |
| `fabric-b250` | `100-249` | 0/3 | 2/25 | 0.0% | 8.0% | — | SPARSE |
| `fabric-b250` | `250-499` \* | 1/10 | 0/47 | 10.0% | 0.0% | **+10.0pp** | COMPARABLE |
| `hydrogen-b100` | `0-24` | 0/2 | 0/6 | 0.0% | 0.0% | — | SPARSE |
| `hydrogen-b100` | `25-99` | 0/9 | 0/33 | 0.0% | 0.0% | — | SPARSE |
| `hydrogen-b100` | `100-249` \* | 0/37 | 0/243 | 0.0% | 0.0% | **+0.0pp** | COMPARABLE |
| `hydrogen-b100` | `250-499` | 0/2 | 0/20 | 0.0% | 0.0% | — | SPARSE |
| `hydrogen-b250` | `0-24` | 0/0 | 1/3 | — | 33.3% | — | OMITTED_ONLY |
| `hydrogen-b250` | `25-99` \* | 1/37 | 0/237 | 2.7% | 0.0% | **+2.7pp** | COMPARABLE |
| `hydrogen-b250` | `100-249` | 2/9 | 4/44 | 22.2% | 9.1% | — | SPARSE |
| `hydrogen-b250` | `250-499` | 0/4 | 1/18 | 0.0% | 5.6% | — | SPARSE |
| `rustos-b100` | `0-24` | 1/5 | 3/47 | 20.0% | 6.4% | — | SPARSE |
| `rustos-b100` | `25-99` \* | 4/23 | 4/54 | 17.4% | 7.4% | **+10.0pp** | COMPARABLE |
| `rustos-b100` | `100-249` | 1/8 | 1/43 | 12.5% | 2.3% | — | SPARSE |
| `rustos-b100` | `250-499` \* | 2/14 | 5/96 | 14.3% | 5.2% | **+9.1pp** | COMPARABLE |
| `rustos-b250` | `0-24` | 1/8 | 3/23 | 12.5% | 13.0% | — | SPARSE |
| `rustos-b250` | `25-99` | 0/3 | 4/30 | 0.0% | 13.3% | — | SPARSE |
| `rustos-b250` | `100-249` \* | 17/32 | 44/161 | 53.1% | 27.3% | **+25.8pp** | COMPARABLE |
| `rustos-b250` | `250-499` | 1/7 | 5/58 | 14.3% | 8.6% | — | SPARSE |
| `scikitimage-b100` | `0-24` | 3/5 | 1/8 | 60.0% | 12.5% | — | SPARSE |
| `scikitimage-b100` | `25-99` \* | 6/14 | 6/43 | 42.9% | 14.0% | **+28.9pp** | COMPARABLE |
| `scikitimage-b100` | `100-249` \* | 6/30 | 6/85 | 20.0% | 7.1% | **+12.9pp** | COMPARABLE |
| `scikitimage-b100` | `250-499` | 0/1 | 1/17 | 0.0% | 5.9% | — | SPARSE |
| `scikitimage-b250` | `0-24` \* | 9/33 | 32/78 | 27.3% | 41.0% | **-13.8pp** | COMPARABLE |
| `scikitimage-b250` | `25-99` \* | 10/13 | 1/21 | 76.9% | 4.8% | **+72.2pp** | COMPARABLE |
| `scikitimage-b250` | `100-249` | 1/2 | 4/151 | 50.0% | 2.6% | — | SPARSE |
| `scikitimage-b250` | `250-499` | 0/2 | 2/25 | 0.0% | 8.0% | — | SPARSE |

**C2 = 16** comparable cells · **P2 = 12** emitted > omitted · **Z2 = 2** equal · **N2 = 2** emitted < omitted.
`P2/C2 = 0.750`

## The two negative cells

| Basis | Bucket | Emitted | Omitted | Diff |
| -- | -- | --: | --: | --: |
| `fabric-b100` | `0-24` | 6/12 (50.0%) | 9/17 (52.9%) | **-2.9pp** |
| `scikitimage-b250` | `0-24` | 9/33 (27.3%) | 32/78 (41.0%) | **-13.8pp** |

Both are isolated: neither repository reverses in any other age bucket, and no
basis reverses in more than one.

## Disposition

# `R2_NOT_REPLICATED`

Rule: PREREGISTRATION §17, frozen at `c95f7f9001bc80453af39da784d894e984b6ff87`.

**Why:** P2/C2=0.750>=0.667 (branch 3)

Branch 1 (`C2 < 8`) did not fire — 16 comparable cells against discovery's 13.
Branch 2 required `N2 >= P2`; the replication produced 12 positive against 2
negative, the reverse of discovery's 5-versus-7. Branch 3 fired: the emitted
advantage reproduces positively in three quarters of comparable age strata.

Discovery's claim was that conditioning on age removes the advantage. Out of
sample the advantage **persists within like-aged strata**, in several cells
substantially — `scikitimage-b250` `25-99` +72.2pp, `fabric-b250` `0-24`
+41.2pp, `fabric-b100` `25-99` +33.3pp.
