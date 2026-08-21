# ONE-DIMENSIONAL-RESULTS — META-377

**Phase 4.** The first results computed after the ANALYSIS-PLAN freeze
(commit `f09a1c96ce7c9c868adc65ef7ed8fbb42d1d3a0d`) and the denominator audit
(commit `b09ac06b35f5f0b0159ca29a67aeba10af7d0765`).

Primary outcome is `overlapUsable` — both endpoints appeared together in at
least one **usable** observed subsequent changed-file set under META-375's
frozen held-out transaction rule. This is an observational co-touch overlap.
It is not impact, dependency, required edit, correctness, or agent value.

Exact X/N is retained behind every rate. No p-value is computed; statistical
significance is not substituted for the denominators. Every non-empty cell is
shown, including sparse and one-sided ones. Bases are never pooled.

## Reference point — D1/D2 per-basis marginal (unconditioned)

This is META-375's headline measure, recomputed from the frozen records.
Every conditioned cell below is read against it.

| Basis | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff |
| -- | --: | --: | --: | --: | --: |
| `syncpack-b100` | 16/50 | 32.0% | 94/518 | 18.1% | +13.9pp |
| `syncpack-b250` | 9/50 | 18.0% | 56/734 | 7.6% | +10.4pp |
| `formatjs-b100` | 6/50 | 12.0% | 9/1192 | 0.8% | +11.2pp |
| `formatjs-b250` | 4/50 | 8.0% | 55/1726 | 3.2% | +4.8pp |
| `polylith-b100` | 22/50 | 44.0% | 154/1356 | 11.4% | +32.6pp |
| `polylith-b250` | 19/50 | 38.0% | 71/277 | 25.6% | +12.4pp |

Emitted exceeds omitted at **6 / 6** bases unconditioned. That is the
separation META-377 tests.

## D3 — endpoint-role pair

Across the six held-out bases: **7 comparable cells** — emitted > omitted in **4**, equal in **1**, emitted < omitted in **2**.

### `syncpack-b100`

comparable=1 (P=1 Z=0 N=0), other cells=17

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `UNKNOWN↔UNKNOWN` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔docs` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock` | 0/0 | — | 2/4 | 50.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source` | 0/0 | — | 1/6 | 16.7% | — | OMITTED_ONLY |
| `UNKNOWN↔tooling-ci` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `docs↔docs` | 0/1 | 0.0% | 4/50 | 8.0% | — | SPARSE |
| `docs↔manifest-lock` | 0/5 | 0.0% | 0/1 | 0.0% | — | SPARSE |
| `docs↔source` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔tooling-ci` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock` | 1/10 | 10.0% | 0/2 | 0.0% | — | SPARSE |
| `manifest-lock↔source` | 0/0 | — | 2/8 | 25.0% | — | OMITTED_ONLY |
| `manifest-lock↔test` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci` | 1/1 | 100.0% | 2/3 | 66.7% | — | SPARSE |
| `source↔source` | 9/23 | 39.1% | 60/184 | 32.6% | +6.5pp | COMPARABLE |
| `source↔test` | 4/6 | 66.7% | 13/68 | 19.1% | — | SPARSE |
| `source↔tooling-ci` | 0/0 | — | 2/4 | 50.0% | — | OMITTED_ONLY |
| `test↔test` | 1/1 | 100.0% | 5/174 | 2.9% | — | SPARSE |
| `tooling-ci↔tooling-ci` | 0/3 | 0.0% | 3/4 | 75.0% | — | SPARSE |

### `syncpack-b250`

comparable=1 (P=1 Z=0 N=0), other cells=15

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `UNKNOWN↔manifest-lock` | 0/0 | — | 2/2 | 100.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source` | 0/0 | — | 1/3 | 33.3% | — | OMITTED_ONLY |
| `docs↔docs` | 0/1 | 0.0% | 0/36 | 0.0% | — | SPARSE |
| `docs↔manifest-lock` | 0/5 | 0.0% | 0/1 | 0.0% | — | SPARSE |
| `docs↔source` | 0/0 | — | 0/17 | 0.0% | — | OMITTED_ONLY |
| `docs↔test` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `docs↔tooling-ci` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock` | 3/10 | 30.0% | 0/0 | — | — | EMITTED_ONLY |
| `manifest-lock↔source` | 0/0 | — | 0/6 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔test` | 0/0 | — | 0/4 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci` | 0/0 | — | 1/4 | 25.0% | — | OMITTED_ONLY |
| `source↔source` | 5/31 | 16.1% | 45/328 | 13.7% | +2.4pp | COMPARABLE |
| `source↔test` | 0/0 | — | 5/137 | 3.6% | — | OMITTED_ONLY |
| `source↔tooling-ci` | 0/0 | — | 1/3 | 33.3% | — | OMITTED_ONLY |
| `test↔test` | 0/1 | 0.0% | 0/189 | 0.0% | — | SPARSE |
| `tooling-ci↔tooling-ci` | 1/2 | 50.0% | 0/1 | 0.0% | — | SPARSE |

### `formatjs-b100`

comparable=1 (P=0 Z=1 N=0), other cells=26

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `UNKNOWN↔UNKNOWN` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔docs` | 0/0 | — | 1/4 | 25.0% | — | OMITTED_ONLY |
| `UNKNOWN↔generated` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock` | 0/0 | — | 0/5 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔test` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔tooling-ci` | 0/0 | — | 0/82 | 0.0% | — | OMITTED_ONLY |
| `docs↔docs` | 0/0 | — | 1/77 | 1.3% | — | OMITTED_ONLY |
| `docs↔manifest-lock` | 0/0 | — | 0/87 | 0.0% | — | OMITTED_ONLY |
| `docs↔source` | 0/0 | — | 0/8 | 0.0% | — | OMITTED_ONLY |
| `docs↔test` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔tooling-ci` | 0/0 | — | 0/144 | 0.0% | — | OMITTED_ONLY |
| `generated↔generated` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `generated↔manifest-lock` | 0/0 | — | 0/4 | 0.0% | — | OMITTED_ONLY |
| `generated↔source` | 0/0 | — | 0/8 | 0.0% | — | OMITTED_ONLY |
| `generated↔test` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `generated↔tooling-ci` | 0/0 | — | 0/5 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock` | 4/8 | 50.0% | 2/76 | 2.6% | — | SPARSE |
| `manifest-lock↔source` | 0/0 | — | 2/12 | 16.7% | — | OMITTED_ONLY |
| `manifest-lock↔test` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci` | 2/4 | 50.0% | 1/89 | 1.1% | — | SPARSE |
| `source↔source` | 0/0 | — | 0/18 | 0.0% | — | OMITTED_ONLY |
| `source↔test` | 0/0 | — | 1/10 | 10.0% | — | OMITTED_ONLY |
| `source↔tooling-ci` | 0/0 | — | 1/72 | 1.4% | — | OMITTED_ONLY |
| `test↔test` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `test↔tooling-ci` | 0/0 | — | 0/5 | 0.0% | — | OMITTED_ONLY |
| `tooling-ci↔tooling-ci` | 0/38 | 0.0% | 0/471 | 0.0% | +0.0pp | COMPARABLE |

### `formatjs-b250`

comparable=1 (P=0 Z=0 N=1), other cells=22

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `UNKNOWN↔UNKNOWN` | 0/0 | — | 1/4 | 25.0% | — | OMITTED_ONLY |
| `UNKNOWN↔docs` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock` | 0/0 | — | 0/14 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔tooling-ci` | 0/0 | — | 3/131 | 2.3% | — | OMITTED_ONLY |
| `docs↔docs` | 0/0 | — | 3/83 | 3.6% | — | OMITTED_ONLY |
| `docs↔manifest-lock` | 0/0 | — | 3/160 | 1.9% | — | OMITTED_ONLY |
| `docs↔source` | 0/0 | — | 0/8 | 0.0% | — | OMITTED_ONLY |
| `docs↔test` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔tooling-ci` | 0/0 | — | 1/71 | 1.4% | — | OMITTED_ONLY |
| `generated↔generated` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `generated↔source` | 0/0 | — | 3/5 | 60.0% | — | OMITTED_ONLY |
| `generated↔test` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `generated↔tooling-ci` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock` | 4/4 | 100.0% | 7/120 | 5.8% | — | SPARSE |
| `manifest-lock↔source` | 0/0 | — | 1/13 | 7.7% | — | OMITTED_ONLY |
| `manifest-lock↔test` | 0/0 | — | 0/4 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci` | 0/0 | — | 12/97 | 12.4% | — | OMITTED_ONLY |
| `source↔source` | 0/0 | — | 0/18 | 0.0% | — | OMITTED_ONLY |
| `source↔test` | 0/0 | — | 2/8 | 25.0% | — | OMITTED_ONLY |
| `source↔tooling-ci` | 0/0 | — | 3/74 | 4.1% | — | OMITTED_ONLY |
| `test↔tooling-ci` | 0/0 | — | 1/4 | 25.0% | — | OMITTED_ONLY |
| `tooling-ci↔tooling-ci` | 0/46 | 0.0% | 14/903 | 1.6% | -1.6pp | COMPARABLE |

### `polylith-b100`

comparable=1 (P=1 Z=0 N=0), other cells=16

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `UNKNOWN↔UNKNOWN` | 3/4 | 75.0% | 0/15 | 0.0% | — | SPARSE |
| `UNKNOWN↔docs` | 0/6 | 0.0% | 24/73 | 32.9% | — | SPARSE |
| `UNKNOWN↔generated` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock` | 0/0 | — | 0/20 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source` | 3/3 | 100.0% | 6/72 | 8.3% | — | SPARSE |
| `UNKNOWN↔test` | 0/0 | — | 6/30 | 20.0% | — | OMITTED_ONLY |
| `docs↔docs` | 5/8 | 62.5% | 26/133 | 19.5% | — | SPARSE |
| `docs↔manifest-lock` | 0/0 | — | 4/54 | 7.4% | — | OMITTED_ONLY |
| `docs↔source` | 6/15 | 40.0% | 31/165 | 18.8% | +21.2pp | COMPARABLE |
| `docs↔test` | 1/2 | 50.0% | 6/80 | 7.5% | — | SPARSE |
| `generated↔source` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock` | 0/1 | 0.0% | 7/57 | 12.3% | — | SPARSE |
| `manifest-lock↔source` | 2/3 | 66.7% | 5/70 | 7.1% | — | SPARSE |
| `manifest-lock↔test` | 0/1 | 0.0% | 6/91 | 6.6% | — | SPARSE |
| `source↔source` | 1/4 | 25.0% | 18/232 | 7.8% | — | SPARSE |
| `source↔test` | 1/3 | 33.3% | 7/148 | 4.7% | — | SPARSE |
| `test↔test` | 0/0 | — | 6/114 | 5.3% | — | OMITTED_ONLY |

### `polylith-b250`

comparable=2 (P=1 Z=0 N=1), other cells=13

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `UNKNOWN↔UNKNOWN` | 3/4 | 75.0% | 2/8 | 25.0% | — | SPARSE |
| `UNKNOWN↔docs` | 3/4 | 75.0% | 7/13 | 53.8% | — | SPARSE |
| `UNKNOWN↔manifest-lock` | 0/0 | — | 0/5 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source` | 0/1 | 0.0% | 6/14 | 42.9% | — | SPARSE |
| `UNKNOWN↔test` | 0/0 | — | 3/3 | 100.0% | — | OMITTED_ONLY |
| `docs↔docs` | 2/3 | 66.7% | 7/19 | 36.8% | — | SPARSE |
| `docs↔manifest-lock` | 0/1 | 0.0% | 0/3 | 0.0% | — | SPARSE |
| `docs↔source` | 1/11 | 9.1% | 8/32 | 25.0% | -15.9pp | COMPARABLE |
| `docs↔test` | 0/1 | 0.0% | 2/9 | 22.2% | — | SPARSE |
| `manifest-lock↔manifest-lock` | 0/1 | 0.0% | 1/4 | 25.0% | — | SPARSE |
| `manifest-lock↔source` | 2/2 | 100.0% | 8/16 | 50.0% | — | SPARSE |
| `manifest-lock↔test` | 0/0 | — | 3/5 | 60.0% | — | OMITTED_ONLY |
| `source↔source` | 6/18 | 33.3% | 16/102 | 15.7% | +17.6pp | COMPARABLE |
| `source↔test` | 2/4 | 50.0% | 5/36 | 13.9% | — | SPARSE |
| `test↔test` | 0/0 | — | 3/8 | 37.5% | — | OMITTED_ONLY |

## D4 — endpoint-existence state

Across the six held-out bases: **10 comparable cells** — emitted > omitted in **6**, equal in **1**, emitted < omitted in **3**.

### `syncpack-b100`

comparable=3 (P=2 Z=0 N=1), other cells=0

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `BOTH_ABSENT` | 1/13 | 7.7% | 2/308 | 0.6% | +7.0pp | COMPARABLE |
| `BOTH_CURRENT` | 11/21 | 52.4% | 82/131 | 62.6% | -10.2pp | COMPARABLE |
| `ONE_ABSENT` | 4/16 | 25.0% | 10/79 | 12.7% | +12.3pp | COMPARABLE |

### `syncpack-b250`

comparable=2 (P=0 Z=1 N=1), other cells=1

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `BOTH_ABSENT` | 0/26 | 0.0% | 0/599 | 0.0% | +0.0pp | COMPARABLE |
| `BOTH_CURRENT` | 9/20 | 45.0% | 56/74 | 75.7% | -30.7pp | COMPARABLE |
| `ONE_ABSENT` | 0/4 | 0.0% | 0/61 | 0.0% | — | SPARSE |

### `formatjs-b100`

comparable=1 (P=1 Z=0 N=0), other cells=2

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `BOTH_ABSENT` | 0/0 | — | 0/43 | 0.0% | — | OMITTED_ONLY |
| `BOTH_CURRENT` | 6/50 | 12.0% | 9/1061 | 0.8% | +11.2pp | COMPARABLE |
| `ONE_ABSENT` | 0/0 | — | 0/88 | 0.0% | — | OMITTED_ONLY |

### `formatjs-b250`

comparable=1 (P=1 Z=0 N=0), other cells=2

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `BOTH_ABSENT` | 0/0 | — | 0/242 | 0.0% | — | OMITTED_ONLY |
| `BOTH_CURRENT` | 4/50 | 8.0% | 55/1371 | 4.0% | +4.0pp | COMPARABLE |
| `ONE_ABSENT` | 0/0 | — | 0/113 | 0.0% | — | OMITTED_ONLY |

### `polylith-b100`

comparable=2 (P=1 Z=0 N=1), other cells=1

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `BOTH_ABSENT` | 0/4 | 0.0% | 0/155 | 0.0% | — | SPARSE |
| `BOTH_CURRENT` | 22/28 | 78.6% | 153/777 | 19.7% | +58.9pp | COMPARABLE |
| `ONE_ABSENT` | 0/18 | 0.0% | 1/424 | 0.2% | -0.2pp | COMPARABLE |

### `polylith-b250`

comparable=1 (P=1 Z=0 N=0), other cells=2

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `BOTH_ABSENT` | 0/0 | — | 0/28 | 0.0% | — | OMITTED_ONLY |
| `BOTH_CURRENT` | 19/48 | 39.6% | 71/197 | 36.0% | +3.5pp | COMPARABLE |
| `ONE_ABSENT` | 0/2 | 0.0% | 0/52 | 0.0% | — | SPARSE |

## D5 — age bucket

Across the six held-out bases: **13 comparable cells** — emitted > omitted in **5**, equal in **1**, emitted < omitted in **7**.

### `syncpack-b100`

comparable=2 (P=0 Z=0 N=2), other cells=2

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `0-24` | 16/28 | 57.1% | 78/120 | 65.0% | -7.9pp | COMPARABLE |
| `100-249` | 0/5 | 0.0% | 5/48 | 10.4% | — | SPARSE |
| `25-99` | 0/7 | 0.0% | 10/30 | 33.3% | — | SPARSE |
| `250-499` | 0/10 | 0.0% | 1/320 | 0.3% | -0.3pp | COMPARABLE |

### `syncpack-b250`

comparable=2 (P=0 Z=0 N=2), other cells=2

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `0-24` | 9/20 | 45.0% | 13/17 | 76.5% | -31.5pp | COMPARABLE |
| `100-249` | 0/19 | 0.0% | 9/154 | 5.8% | -5.8pp | COMPARABLE |
| `25-99` | 0/2 | 0.0% | 34/58 | 58.6% | — | SPARSE |
| `250-499` | 0/9 | 0.0% | 0/505 | 0.0% | — | SPARSE |

### `formatjs-b100`

comparable=3 (P=2 Z=1 N=0), other cells=1

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `0-24` | 4/10 | 40.0% | 0/76 | 0.0% | +40.0pp | COMPARABLE |
| `100-249` | 0/1 | 0.0% | 2/130 | 1.5% | — | SPARSE |
| `25-99` | 2/23 | 8.7% | 7/344 | 2.0% | +6.7pp | COMPARABLE |
| `250-499` | 0/16 | 0.0% | 0/642 | 0.0% | +0.0pp | COMPARABLE |

### `formatjs-b250`

comparable=1 (P=0 Z=0 N=1), other cells=3

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `0-24` | 4/4 | 100.0% | 9/300 | 3.0% | — | SPARSE |
| `100-249` | 0/46 | 0.0% | 23/807 | 2.9% | -2.9pp | COMPARABLE |
| `25-99` | 0/0 | — | 10/89 | 11.2% | — | OMITTED_ONLY |
| `250-499` | 0/0 | — | 13/530 | 2.5% | — | OMITTED_ONLY |

### `polylith-b100`

comparable=2 (P=1 Z=0 N=1), other cells=2

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `0-24` | 22/26 | 84.6% | 89/618 | 14.4% | +70.2pp | COMPARABLE |
| `100-249` | 0/18 | 0.0% | 19/324 | 5.9% | -5.9pp | COMPARABLE |
| `25-99` | 0/5 | 0.0% | 46/288 | 16.0% | — | SPARSE |
| `250-499` | 0/1 | 0.0% | 0/126 | 0.0% | — | SPARSE |

### `polylith-b250`

comparable=3 (P=2 Z=0 N=1), other cells=0

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `0-24` | 17/27 | 63.0% | 54/96 | 56.3% | +6.7pp | COMPARABLE |
| `100-249` | 2/11 | 18.2% | 14/132 | 10.6% | +7.6pp | COMPARABLE |
| `25-99` | 0/12 | 0.0% | 3/49 | 6.1% | -6.1pp | COMPARABLE |

## D6 — persistence X/Y

Across the six held-out bases: **10 comparable cells** — emitted > omitted in **6**, equal in **1**, emitted < omitted in **3**.

### `syncpack-b100`

comparable=2 (P=0 Z=0 N=2), other cells=3

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `1/5` | 0/3 | 0.0% | 3/229 | 1.3% | — | SPARSE |
| `2/5` | 2/10 | 20.0% | 61/231 | 26.4% | -6.4pp | COMPARABLE |
| `3/5` | 7/16 | 43.8% | 28/54 | 51.9% | -8.1pp | COMPARABLE |
| `4/5` | 7/18 | 38.9% | 2/4 | 50.0% | — | SPARSE |
| `5/5` | 0/3 | 0.0% | 0/0 | — | — | EMITTED_ONLY |

### `syncpack-b250`

comparable=1 (P=1 Z=0 N=0), other cells=4

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `1/5` | 0/1 | 0.0% | 16/296 | 5.4% | — | SPARSE |
| `2/5` | 7/29 | 24.1% | 38/426 | 8.9% | +15.2pp | COMPARABLE |
| `3/5` | 1/17 | 5.9% | 0/9 | 0.0% | — | SPARSE |
| `4/5` | 1/2 | 50.0% | 2/3 | 66.7% | — | SPARSE |
| `5/5` | 0/1 | 0.0% | 0/0 | — | — | EMITTED_ONLY |

### `formatjs-b100`

comparable=2 (P=1 Z=1 N=0), other cells=3

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `1/5` | 0/0 | — | 0/179 | 0.0% | — | OMITTED_ONLY |
| `2/5` | 0/1 | 0.0% | 8/507 | 1.6% | — | SPARSE |
| `3/5` | 2/19 | 10.5% | 1/456 | 0.2% | +10.3pp | COMPARABLE |
| `4/5` | 0/12 | 0.0% | 0/50 | 0.0% | +0.0pp | COMPARABLE |
| `5/5` | 4/18 | 22.2% | 0/0 | — | — | EMITTED_ONLY |

### `formatjs-b250`

comparable=1 (P=0 Z=0 N=1), other cells=4

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `1/5` | 0/0 | — | 16/146 | 11.0% | — | OMITTED_ONLY |
| `2/5` | 0/0 | — | 23/583 | 3.9% | — | OMITTED_ONLY |
| `3/5` | 0/0 | — | 8/562 | 1.4% | — | OMITTED_ONLY |
| `4/5` | 0/46 | 0.0% | 7/423 | 1.7% | -1.7pp | COMPARABLE |
| `5/5` | 4/4 | 100.0% | 1/12 | 8.3% | — | SPARSE |

### `polylith-b100`

comparable=2 (P=2 Z=0 N=0), other cells=1

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `1/5` | 12/25 | 48.0% | 103/912 | 11.3% | +36.7pp | COMPARABLE |
| `2/5` | 8/17 | 47.1% | 46/375 | 12.3% | +34.8pp | COMPARABLE |
| `3/5` | 2/8 | 25.0% | 5/69 | 7.2% | — | SPARSE |

### `polylith-b250`

comparable=2 (P=2 Z=0 N=0), other cells=0

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `1/5` | 11/23 | 47.8% | 54/188 | 28.7% | +19.1pp | COMPARABLE |
| `2/5` | 8/27 | 29.6% | 17/89 | 19.1% | +10.5pp | COMPARABLE |

## D7 — current-tree exposure

Across the six held-out bases: **54 comparable cells** — emitted > omitted in **43**, equal in **2**, emitted < omitted in **9**.

### `syncpack-b100`

comparable=9 (P=7 Z=0 N=2), other cells=5

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `E4 UNKNOWN` | 5/29 | 17.2% | 12/387 | 3.1% | +14.1pp | COMPARABLE |
| `E5 UNKNOWN` | 1/13 | 7.7% | 2/308 | 0.6% | +7.0pp | COMPARABLE |
| `has E1` | 1/7 | 14.3% | 0/1 | 0.0% | — | SPARSE |
| `has E2` | 1/6 | 16.7% | 1/22 | 4.5% | — | SPARSE |
| `has E3` | 11/36 | 30.6% | 62/269 | 23.0% | +7.5pp | COMPARABLE |
| `has E4` | 11/19 | 57.9% | 75/108 | 69.4% | -11.5pp | COMPARABLE |
| `has E5` | 1/4 | 25.0% | 2/3 | 66.7% | — | SPARSE |
| `has some preregistered exposure` | 16/45 | 35.6% | 88/332 | 26.5% | +9.0pp | COMPARABLE |
| `no E1` | 15/43 | 34.9% | 94/517 | 18.2% | +16.7pp | COMPARABLE |
| `no E2` | 15/44 | 34.1% | 93/496 | 18.8% | +15.3pp | COMPARABLE |
| `no E3` | 5/14 | 35.7% | 32/249 | 12.9% | +22.9pp | COMPARABLE |
| `no E4` | 0/2 | 0.0% | 7/23 | 30.4% | — | SPARSE |
| `no E5` | 14/33 | 42.4% | 90/207 | 43.5% | -1.1pp | COMPARABLE |
| `no preregistered exposure` | 0/5 | 0.0% | 6/186 | 3.2% | — | SPARSE |

### `syncpack-b250`

comparable=11 (P=7 Z=2 N=2), other cells=3

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `E4 UNKNOWN` | 0/30 | 0.0% | 0/660 | 0.0% | +0.0pp | COMPARABLE |
| `E5 UNKNOWN` | 0/26 | 0.0% | 0/599 | 0.0% | +0.0pp | COMPARABLE |
| `has E1` | 3/7 | 42.9% | 0/0 | — | — | EMITTED_ONLY |
| `has E2` | 1/14 | 7.1% | 1/42 | 2.4% | +4.8pp | COMPARABLE |
| `has E3` | 8/24 | 33.3% | 44/254 | 17.3% | +16.0pp | COMPARABLE |
| `has E4` | 9/14 | 64.3% | 46/59 | 78.0% | -13.7pp | COMPARABLE |
| `has E5` | 1/8 | 12.5% | 1/1 | 100.0% | — | SPARSE |
| `has some preregistered exposure` | 9/37 | 24.3% | 53/297 | 17.8% | +6.5pp | COMPARABLE |
| `no E1` | 6/43 | 14.0% | 56/734 | 7.6% | +6.3pp | COMPARABLE |
| `no E2` | 8/36 | 22.2% | 55/692 | 7.9% | +14.3pp | COMPARABLE |
| `no E3` | 1/26 | 3.8% | 12/480 | 2.5% | +1.3pp | COMPARABLE |
| `no E4` | 0/6 | 0.0% | 10/15 | 66.7% | — | SPARSE |
| `no E5` | 8/16 | 50.0% | 55/134 | 41.0% | +9.0pp | COMPARABLE |
| `no preregistered exposure` | 0/13 | 0.0% | 3/437 | 0.7% | -0.7pp | COMPARABLE |

### `formatjs-b100`

comparable=9 (P=9 Z=0 N=0), other cells=5

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `E4 UNKNOWN` | 0/0 | — | 0/131 | 0.0% | — | OMITTED_ONLY |
| `E5 UNKNOWN` | 0/0 | — | 0/43 | 0.0% | — | OMITTED_ONLY |
| `has E1` | 3/5 | 60.0% | 0/26 | 0.0% | — | SPARSE |
| `has E2` | 1/39 | 2.6% | 1/572 | 0.2% | +2.4pp | COMPARABLE |
| `has E3` | 4/8 | 50.0% | 1/93 | 1.1% | — | SPARSE |
| `has E4` | 5/22 | 22.7% | 5/619 | 0.8% | +21.9pp | COMPARABLE |
| `has E5` | 2/21 | 9.5% | 1/486 | 0.2% | +9.3pp | COMPARABLE |
| `has some preregistered exposure` | 6/49 | 12.2% | 6/1108 | 0.5% | +11.7pp | COMPARABLE |
| `no E1` | 3/45 | 6.7% | 9/1166 | 0.8% | +5.9pp | COMPARABLE |
| `no E2` | 5/11 | 45.5% | 8/620 | 1.3% | +44.2pp | COMPARABLE |
| `no E3` | 2/42 | 4.8% | 8/1099 | 0.7% | +4.0pp | COMPARABLE |
| `no E4` | 1/28 | 3.6% | 4/442 | 0.9% | +2.7pp | COMPARABLE |
| `no E5` | 4/29 | 13.8% | 8/663 | 1.2% | +12.6pp | COMPARABLE |
| `no preregistered exposure` | 0/1 | 0.0% | 3/84 | 3.6% | — | SPARSE |

### `formatjs-b250`

comparable=8 (P=5 Z=0 N=3), other cells=6

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `E4 UNKNOWN` | 0/0 | — | 0/355 | 0.0% | — | OMITTED_ONLY |
| `E5 UNKNOWN` | 0/0 | — | 0/242 | 0.0% | — | OMITTED_ONLY |
| `has E1` | 3/3 | 100.0% | 2/12 | 16.7% | — | SPARSE |
| `has E2` | 1/47 | 2.1% | 16/1056 | 1.5% | +0.6pp | COMPARABLE |
| `has E3` | 3/3 | 100.0% | 16/107 | 15.0% | — | SPARSE |
| `has E4` | 3/19 | 15.8% | 41/805 | 5.1% | +10.7pp | COMPARABLE |
| `has E5` | 1/32 | 3.1% | 19/508 | 3.7% | -0.6pp | COMPARABLE |
| `has some preregistered exposure` | 4/50 | 8.0% | 51/1626 | 3.1% | +4.9pp | COMPARABLE |
| `no E1` | 1/47 | 2.1% | 53/1714 | 3.1% | -1.0pp | COMPARABLE |
| `no E2` | 3/3 | 100.0% | 39/670 | 5.8% | — | SPARSE |
| `no E3` | 1/47 | 2.1% | 39/1619 | 2.4% | -0.3pp | COMPARABLE |
| `no E4` | 1/31 | 3.2% | 14/566 | 2.5% | +0.8pp | COMPARABLE |
| `no E5` | 3/18 | 16.7% | 36/976 | 3.7% | +13.0pp | COMPARABLE |
| `no preregistered exposure` | 0/0 | — | 4/100 | 4.0% | — | OMITTED_ONLY |

### `polylith-b100`

comparable=8 (P=7 Z=0 N=1), other cells=5

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `E4 UNKNOWN` | 0/22 | 0.0% | 1/579 | 0.2% | -0.2pp | COMPARABLE |
| `E5 UNKNOWN` | 0/4 | 0.0% | 0/155 | 0.0% | — | SPARSE |
| `has E2` | 3/7 | 42.9% | 12/164 | 7.3% | — | SPARSE |
| `has E3` | 1/2 | 50.0% | 20/127 | 15.7% | — | SPARSE |
| `has E4` | 20/26 | 76.9% | 122/694 | 17.6% | +59.3pp | COMPARABLE |
| `has E5` | 3/3 | 100.0% | 18/29 | 62.1% | — | SPARSE |
| `has some preregistered exposure` | 20/27 | 74.1% | 127/828 | 15.3% | +58.7pp | COMPARABLE |
| `no E1` | 22/50 | 44.0% | 154/1356 | 11.4% | +32.6pp | COMPARABLE |
| `no E2` | 19/43 | 44.2% | 142/1192 | 11.9% | +32.3pp | COMPARABLE |
| `no E3` | 21/48 | 43.8% | 134/1229 | 10.9% | +32.8pp | COMPARABLE |
| `no E4` | 2/2 | 100.0% | 31/83 | 37.3% | — | SPARSE |
| `no E5` | 19/43 | 44.2% | 136/1172 | 11.6% | +32.6pp | COMPARABLE |
| `no preregistered exposure` | 2/23 | 8.7% | 27/528 | 5.1% | +3.6pp | COMPARABLE |

### `polylith-b250`

comparable=9 (P=8 Z=0 N=1), other cells=3

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `E4 UNKNOWN` | 0/2 | 0.0% | 0/80 | 0.0% | — | SPARSE |
| `E5 UNKNOWN` | 0/0 | — | 0/28 | 0.0% | — | OMITTED_ONLY |
| `has E2` | 5/13 | 38.5% | 7/43 | 16.3% | +22.2pp | COMPARABLE |
| `has E3` | 1/3 | 33.3% | 11/46 | 23.9% | — | SPARSE |
| `has E4` | 16/33 | 48.5% | 60/159 | 37.7% | +10.7pp | COMPARABLE |
| `has some preregistered exposure` | 17/36 | 47.2% | 63/191 | 33.0% | +14.2pp | COMPARABLE |
| `no E1` | 19/50 | 38.0% | 71/277 | 25.6% | +12.4pp | COMPARABLE |
| `no E2` | 14/37 | 37.8% | 64/234 | 27.4% | +10.5pp | COMPARABLE |
| `no E3` | 18/47 | 38.3% | 60/231 | 26.0% | +12.3pp | COMPARABLE |
| `no E4` | 3/15 | 20.0% | 11/38 | 28.9% | -8.9pp | COMPARABLE |
| `no E5` | 19/50 | 38.0% | 71/249 | 28.5% | +9.5pp | COMPARABLE |
| `no preregistered exposure` | 2/14 | 14.3% | 8/86 | 9.3% | +5.0pp | COMPARABLE |

