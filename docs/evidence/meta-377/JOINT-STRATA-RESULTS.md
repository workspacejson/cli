# JOINT-STRATA-RESULTS — META-377

**Phase 5.** The three joint views were frozen in ANALYSIS-PLAN §8 before any
recurrence result existed. No fourth combination was introduced.

Joint views do **not** enter the §7 disposition arithmetic. They corroborate
or contradict the one-dimensional finding, and any reversal is named here with
its exact denominator.

Primary outcome is `overlapUsable` — both endpoints appeared together in at
least one **usable** observed subsequent changed-file set under META-375's
frozen held-out transaction rule. This is an observational co-touch overlap.
It is not impact, dependency, required edit, correctness, or agent value.

Exact X/N is retained behind every rate. No p-value is computed; statistical
significance is not substituted for the denominators. Every non-empty cell is
shown, including sparse and one-sided ones. Bases are never pooled.

## J1 — endpoint-role pair × age bucket

Across the six held-out bases: **6 comparable cells** — emitted > omitted in **1**, equal in **2**, emitted < omitted in **3**.

### `syncpack-b100`

comparable=1 (P=0 Z=0 N=1), other cells=36

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `UNKNOWN↔UNKNOWN | 25-99` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔docs | 25-99` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock | 100-249` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock | 25-99` | 0/0 | — | 2/3 | 66.7% | — | OMITTED_ONLY |
| `UNKNOWN↔source | 100-249` | 0/0 | — | 1/3 | 33.3% | — | OMITTED_ONLY |
| `UNKNOWN↔source | 25-99` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source | 250-499` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔tooling-ci | 25-99` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `docs↔docs | 0-24` | 0/0 | — | 3/9 | 33.3% | — | OMITTED_ONLY |
| `docs↔docs | 25-99` | 0/0 | — | 1/5 | 20.0% | — | OMITTED_ONLY |
| `docs↔docs | 250-499` | 0/1 | 0.0% | 0/36 | 0.0% | — | SPARSE |
| `docs↔manifest-lock | 0-24` | 0/3 | 0.0% | 0/0 | — | — | EMITTED_ONLY |
| `docs↔manifest-lock | 25-99` | 0/1 | 0.0% | 0/1 | 0.0% | — | SPARSE |
| `docs↔manifest-lock | 250-499` | 0/1 | 0.0% | 0/0 | — | — | EMITTED_ONLY |
| `docs↔source | 25-99` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔tooling-ci | 25-99` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | 0-24` | 1/4 | 25.0% | 0/0 | — | — | EMITTED_ONLY |
| `manifest-lock↔manifest-lock | 25-99` | 0/5 | 0.0% | 0/2 | 0.0% | — | SPARSE |
| `manifest-lock↔manifest-lock | 250-499` | 0/1 | 0.0% | 0/0 | — | — | EMITTED_ONLY |
| `manifest-lock↔source | 0-24` | 0/0 | — | 2/5 | 40.0% | — | OMITTED_ONLY |
| `manifest-lock↔source | 25-99` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔source | 250-499` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | 250-499` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci | 0-24` | 1/1 | 100.0% | 1/1 | 100.0% | — | SPARSE |
| `manifest-lock↔tooling-ci | 250-499` | 0/0 | — | 1/2 | 50.0% | — | OMITTED_ONLY |
| `source↔source | 0-24` | 9/13 | 69.2% | 54/77 | 70.1% | -0.9pp | COMPARABLE |
| `source↔source | 100-249` | 0/3 | 0.0% | 4/34 | 11.8% | — | SPARSE |
| `source↔source | 25-99` | 0/0 | — | 2/2 | 100.0% | — | OMITTED_ONLY |
| `source↔source | 250-499` | 0/7 | 0.0% | 0/71 | 0.0% | — | SPARSE |
| `source↔test | 0-24` | 4/6 | 66.7% | 13/22 | 59.1% | — | SPARSE |
| `source↔test | 100-249` | 0/0 | — | 0/9 | 0.0% | — | OMITTED_ONLY |
| `source↔test | 250-499` | 0/0 | — | 0/37 | 0.0% | — | OMITTED_ONLY |
| `source↔tooling-ci | 25-99` | 0/0 | — | 2/4 | 50.0% | — | OMITTED_ONLY |
| `test↔test | 0-24` | 1/1 | 100.0% | 5/6 | 83.3% | — | SPARSE |
| `test↔test | 250-499` | 0/0 | — | 0/168 | 0.0% | — | OMITTED_ONLY |
| `tooling-ci↔tooling-ci | 100-249` | 0/2 | 0.0% | 0/1 | 0.0% | — | SPARSE |
| `tooling-ci↔tooling-ci | 25-99` | 0/1 | 0.0% | 3/3 | 100.0% | — | SPARSE |

### `syncpack-b250`

comparable=1 (P=0 Z=0 N=1), other cells=30

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `UNKNOWN↔manifest-lock | 25-99` | 0/0 | — | 2/2 | 100.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source | 100-249` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source | 25-99` | 0/0 | — | 1/2 | 50.0% | — | OMITTED_ONLY |
| `docs↔docs | 100-249` | 0/0 | — | 0/36 | 0.0% | — | OMITTED_ONLY |
| `docs↔docs | 250-499` | 0/1 | 0.0% | 0/0 | — | — | EMITTED_ONLY |
| `docs↔manifest-lock | 0-24` | 0/4 | 0.0% | 0/0 | — | — | EMITTED_ONLY |
| `docs↔manifest-lock | 250-499` | 0/1 | 0.0% | 0/1 | 0.0% | — | SPARSE |
| `docs↔source | 250-499` | 0/0 | — | 0/17 | 0.0% | — | OMITTED_ONLY |
| `docs↔test | 250-499` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `docs↔tooling-ci | 100-249` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | 0-24` | 3/9 | 33.3% | 0/0 | — | — | EMITTED_ONLY |
| `manifest-lock↔manifest-lock | 250-499` | 0/1 | 0.0% | 0/0 | — | — | EMITTED_ONLY |
| `manifest-lock↔source | 100-249` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔source | 250-499` | 0/0 | — | 0/4 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | 100-249` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | 250-499` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci | 100-249` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci | 250-499` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `source↔source | 0-24` | 5/5 | 100.0% | 12/13 | 92.3% | — | SPARSE |
| `source↔source | 100-249` | 0/19 | 0.0% | 4/74 | 5.4% | -5.4pp | COMPARABLE |
| `source↔source | 25-99` | 0/2 | 0.0% | 29/49 | 59.2% | — | SPARSE |
| `source↔source | 250-499` | 0/5 | 0.0% | 0/192 | 0.0% | — | SPARSE |
| `source↔test | 0-24` | 0/0 | — | 1/3 | 33.3% | — | OMITTED_ONLY |
| `source↔test | 100-249` | 0/0 | — | 3/10 | 30.0% | — | OMITTED_ONLY |
| `source↔test | 25-99` | 0/0 | — | 1/4 | 25.0% | — | OMITTED_ONLY |
| `source↔test | 250-499` | 0/0 | — | 0/120 | 0.0% | — | OMITTED_ONLY |
| `source↔tooling-ci | 25-99` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `source↔tooling-ci | 250-499` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `test↔test | 100-249` | 0/0 | — | 0/28 | 0.0% | — | OMITTED_ONLY |
| `test↔test | 250-499` | 0/1 | 0.0% | 0/161 | 0.0% | — | SPARSE |
| `tooling-ci↔tooling-ci | 0-24` | 1/2 | 50.0% | 0/1 | 0.0% | — | SPARSE |

### `formatjs-b100`

comparable=2 (P=0 Z=2 N=0), other cells=67

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `UNKNOWN↔UNKNOWN | 0-24` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔UNKNOWN | 100-249` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔UNKNOWN | 250-499` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔docs | 0-24` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔docs | 25-99` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `UNKNOWN↔docs | 250-499` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔generated | 100-249` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock | 0-24` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock | 100-249` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source | 100-249` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔test | 25-99` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔tooling-ci | 0-24` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔tooling-ci | 100-249` | 0/0 | — | 0/10 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔tooling-ci | 25-99` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔tooling-ci | 250-499` | 0/0 | — | 0/69 | 0.0% | — | OMITTED_ONLY |
| `docs↔docs | 0-24` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔docs | 100-249` | 0/0 | — | 0/19 | 0.0% | — | OMITTED_ONLY |
| `docs↔docs | 25-99` | 0/0 | — | 1/56 | 1.8% | — | OMITTED_ONLY |
| `docs↔docs | 250-499` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔manifest-lock | 0-24` | 0/0 | — | 0/8 | 0.0% | — | OMITTED_ONLY |
| `docs↔manifest-lock | 100-249` | 0/0 | — | 0/35 | 0.0% | — | OMITTED_ONLY |
| `docs↔manifest-lock | 25-99` | 0/0 | — | 0/42 | 0.0% | — | OMITTED_ONLY |
| `docs↔manifest-lock | 250-499` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `docs↔source | 100-249` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔source | 250-499` | 0/0 | — | 0/7 | 0.0% | — | OMITTED_ONLY |
| `docs↔test | 250-499` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔tooling-ci | 0-24` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `docs↔tooling-ci | 100-249` | 0/0 | — | 0/5 | 0.0% | — | OMITTED_ONLY |
| `docs↔tooling-ci | 25-99` | 0/0 | — | 0/84 | 0.0% | — | OMITTED_ONLY |
| `docs↔tooling-ci | 250-499` | 0/0 | — | 0/53 | 0.0% | — | OMITTED_ONLY |
| `generated↔generated | 100-249` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `generated↔generated | 25-99` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `generated↔manifest-lock | 0-24` | 0/0 | — | 0/4 | 0.0% | — | OMITTED_ONLY |
| `generated↔source | 25-99` | 0/0 | — | 0/6 | 0.0% | — | OMITTED_ONLY |
| `generated↔source | 250-499` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `generated↔test | 25-99` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `generated↔test | 250-499` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `generated↔tooling-ci | 100-249` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `generated↔tooling-ci | 25-99` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `generated↔tooling-ci | 250-499` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | 0-24` | 4/8 | 50.0% | 0/42 | 0.0% | — | SPARSE |
| `manifest-lock↔manifest-lock | 100-249` | 0/0 | — | 0/22 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | 25-99` | 0/0 | — | 2/6 | 33.3% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | 250-499` | 0/0 | — | 0/6 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔source | 0-24` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔source | 100-249` | 0/0 | — | 1/2 | 50.0% | — | OMITTED_ONLY |
| `manifest-lock↔source | 25-99` | 0/0 | — | 1/2 | 50.0% | — | OMITTED_ONLY |
| `manifest-lock↔source | 250-499` | 0/0 | — | 0/6 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | 250-499` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci | 0-24` | 0/1 | 0.0% | 0/10 | 0.0% | — | SPARSE |
| `manifest-lock↔tooling-ci | 100-249` | 0/1 | 0.0% | 0/10 | 0.0% | — | SPARSE |
| `manifest-lock↔tooling-ci | 25-99` | 2/2 | 100.0% | 1/43 | 2.3% | — | SPARSE |
| `manifest-lock↔tooling-ci | 250-499` | 0/0 | — | 0/26 | 0.0% | — | OMITTED_ONLY |
| `source↔source | 100-249` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `source↔source | 25-99` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `source↔source | 250-499` | 0/0 | — | 0/13 | 0.0% | — | OMITTED_ONLY |
| `source↔test | 0-24` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `source↔test | 25-99` | 0/0 | — | 1/4 | 25.0% | — | OMITTED_ONLY |
| `source↔test | 250-499` | 0/0 | — | 0/5 | 0.0% | — | OMITTED_ONLY |
| `source↔tooling-ci | 100-249` | 0/0 | — | 1/2 | 50.0% | — | OMITTED_ONLY |
| `source↔tooling-ci | 25-99` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `source↔tooling-ci | 250-499` | 0/0 | — | 0/67 | 0.0% | — | OMITTED_ONLY |
| `test↔test | 25-99` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `test↔tooling-ci | 25-99` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `test↔tooling-ci | 250-499` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `tooling-ci↔tooling-ci | 0-24` | 0/1 | 0.0% | 0/0 | — | — | EMITTED_ONLY |
| `tooling-ci↔tooling-ci | 100-249` | 0/0 | — | 0/13 | 0.0% | — | OMITTED_ONLY |
| `tooling-ci↔tooling-ci | 25-99` | 0/21 | 0.0% | 0/82 | 0.0% | +0.0pp | COMPARABLE |
| `tooling-ci↔tooling-ci | 250-499` | 0/16 | 0.0% | 0/376 | 0.0% | +0.0pp | COMPARABLE |

### `formatjs-b250`

comparable=1 (P=0 Z=0 N=1), other cells=59

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `UNKNOWN↔UNKNOWN | 100-249` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔UNKNOWN | 25-99` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `UNKNOWN↔docs | 100-249` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock | 0-24` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock | 100-249` | 0/0 | — | 0/7 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock | 25-99` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock | 250-499` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source | 100-249` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔tooling-ci | 100-249` | 0/0 | — | 2/101 | 2.0% | — | OMITTED_ONLY |
| `UNKNOWN↔tooling-ci | 25-99` | 0/0 | — | 1/5 | 20.0% | — | OMITTED_ONLY |
| `UNKNOWN↔tooling-ci | 250-499` | 0/0 | — | 0/25 | 0.0% | — | OMITTED_ONLY |
| `docs↔docs | 0-24` | 0/0 | — | 0/63 | 0.0% | — | OMITTED_ONLY |
| `docs↔docs | 100-249` | 0/0 | — | 2/3 | 66.7% | — | OMITTED_ONLY |
| `docs↔docs | 25-99` | 0/0 | — | 1/16 | 6.3% | — | OMITTED_ONLY |
| `docs↔docs | 250-499` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔manifest-lock | 0-24` | 0/0 | — | 1/129 | 0.8% | — | OMITTED_ONLY |
| `docs↔manifest-lock | 100-249` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `docs↔manifest-lock | 25-99` | 0/0 | — | 0/25 | 0.0% | — | OMITTED_ONLY |
| `docs↔manifest-lock | 250-499` | 0/0 | — | 1/5 | 20.0% | — | OMITTED_ONLY |
| `docs↔source | 25-99` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔source | 250-499` | 0/0 | — | 0/7 | 0.0% | — | OMITTED_ONLY |
| `docs↔test | 250-499` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔tooling-ci | 100-249` | 0/0 | — | 1/58 | 1.7% | — | OMITTED_ONLY |
| `docs↔tooling-ci | 25-99` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `docs↔tooling-ci | 250-499` | 0/0 | — | 0/10 | 0.0% | — | OMITTED_ONLY |
| `generated↔generated | 100-249` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `generated↔source | 100-249` | 0/0 | — | 3/5 | 60.0% | — | OMITTED_ONLY |
| `generated↔test | 100-249` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `generated↔tooling-ci | 100-249` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | 0-24` | 4/4 | 100.0% | 3/78 | 3.8% | — | SPARSE |
| `manifest-lock↔manifest-lock | 100-249` | 0/0 | — | 1/17 | 5.9% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | 25-99` | 0/0 | — | 2/17 | 11.8% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | 250-499` | 0/0 | — | 1/8 | 12.5% | — | OMITTED_ONLY |
| `manifest-lock↔source | 0-24` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔source | 100-249` | 0/0 | — | 1/6 | 16.7% | — | OMITTED_ONLY |
| `manifest-lock↔source | 250-499` | 0/0 | — | 0/4 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | 0-24` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | 100-249` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | 250-499` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci | 0-24` | 0/0 | — | 4/12 | 33.3% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci | 100-249` | 0/0 | — | 5/48 | 10.4% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci | 25-99` | 0/0 | — | 3/5 | 60.0% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci | 250-499` | 0/0 | — | 0/32 | 0.0% | — | OMITTED_ONLY |
| `source↔source | 100-249` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `source↔source | 25-99` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `source↔source | 250-499` | 0/0 | — | 0/13 | 0.0% | — | OMITTED_ONLY |
| `source↔test | 0-24` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `source↔test | 100-249` | 0/0 | — | 1/3 | 33.3% | — | OMITTED_ONLY |
| `source↔test | 25-99` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `source↔test | 250-499` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `source↔tooling-ci | 0-24` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `source↔tooling-ci | 100-249` | 0/0 | — | 2/8 | 25.0% | — | OMITTED_ONLY |
| `source↔tooling-ci | 250-499` | 0/0 | — | 1/65 | 1.5% | — | OMITTED_ONLY |
| `test↔tooling-ci | 0-24` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `test↔tooling-ci | 100-249` | 0/0 | — | 1/2 | 50.0% | — | OMITTED_ONLY |
| `test↔tooling-ci | 250-499` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `tooling-ci↔tooling-ci | 0-24` | 0/0 | — | 0/8 | 0.0% | — | OMITTED_ONLY |
| `tooling-ci↔tooling-ci | 100-249` | 0/46 | 0.0% | 2/534 | 0.4% | -0.4pp | COMPARABLE |
| `tooling-ci↔tooling-ci | 25-99` | 0/0 | — | 2/10 | 20.0% | — | OMITTED_ONLY |
| `tooling-ci↔tooling-ci | 250-499` | 0/0 | — | 10/351 | 2.8% | — | OMITTED_ONLY |

### `polylith-b100`

comparable=0 (P=0 Z=0 N=0), other cells=59

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `UNKNOWN↔UNKNOWN | 0-24` | 3/3 | 100.0% | 0/0 | — | — | EMITTED_ONLY |
| `UNKNOWN↔UNKNOWN | 100-249` | 0/1 | 0.0% | 0/6 | 0.0% | — | SPARSE |
| `UNKNOWN↔UNKNOWN | 25-99` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔UNKNOWN | 250-499` | 0/0 | — | 0/6 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔docs | 0-24` | 0/0 | — | 16/21 | 76.2% | — | OMITTED_ONLY |
| `UNKNOWN↔docs | 100-249` | 0/6 | 0.0% | 8/29 | 27.6% | — | SPARSE |
| `UNKNOWN↔docs | 25-99` | 0/0 | — | 0/21 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔docs | 250-499` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔generated | 25-99` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock | 0-24` | 0/0 | — | 0/14 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock | 100-249` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock | 250-499` | 0/0 | — | 0/5 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source | 0-24` | 3/3 | 100.0% | 4/27 | 14.8% | — | SPARSE |
| `UNKNOWN↔source | 100-249` | 0/0 | — | 0/18 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source | 25-99` | 0/0 | — | 2/23 | 8.7% | — | OMITTED_ONLY |
| `UNKNOWN↔source | 250-499` | 0/0 | — | 0/4 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔test | 0-24` | 0/0 | — | 3/21 | 14.3% | — | OMITTED_ONLY |
| `UNKNOWN↔test | 100-249` | 0/0 | — | 3/7 | 42.9% | — | OMITTED_ONLY |
| `UNKNOWN↔test | 25-99` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `docs↔docs | 0-24` | 5/5 | 100.0% | 16/23 | 69.6% | — | SPARSE |
| `docs↔docs | 100-249` | 0/2 | 0.0% | 1/53 | 1.9% | — | SPARSE |
| `docs↔docs | 25-99` | 0/1 | 0.0% | 9/47 | 19.1% | — | SPARSE |
| `docs↔docs | 250-499` | 0/0 | — | 0/10 | 0.0% | — | OMITTED_ONLY |
| `docs↔manifest-lock | 0-24` | 0/0 | — | 4/26 | 15.4% | — | OMITTED_ONLY |
| `docs↔manifest-lock | 100-249` | 0/0 | — | 0/19 | 0.0% | — | OMITTED_ONLY |
| `docs↔manifest-lock | 25-99` | 0/0 | — | 0/6 | 0.0% | — | OMITTED_ONLY |
| `docs↔manifest-lock | 250-499` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `docs↔source | 0-24` | 6/6 | 100.0% | 18/54 | 33.3% | — | SPARSE |
| `docs↔source | 100-249` | 0/6 | 0.0% | 0/51 | 0.0% | — | SPARSE |
| `docs↔source | 25-99` | 0/2 | 0.0% | 13/48 | 27.1% | — | SPARSE |
| `docs↔source | 250-499` | 0/1 | 0.0% | 0/12 | 0.0% | — | SPARSE |
| `docs↔test | 0-24` | 1/1 | 100.0% | 6/53 | 11.3% | — | SPARSE |
| `docs↔test | 100-249` | 0/1 | 0.0% | 0/14 | 0.0% | — | SPARSE |
| `docs↔test | 25-99` | 0/0 | — | 0/8 | 0.0% | — | OMITTED_ONLY |
| `docs↔test | 250-499` | 0/0 | — | 0/5 | 0.0% | — | OMITTED_ONLY |
| `generated↔source | 25-99` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | 0-24` | 0/1 | 0.0% | 3/25 | 12.0% | — | SPARSE |
| `manifest-lock↔manifest-lock | 100-249` | 0/0 | — | 0/7 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | 25-99` | 0/0 | — | 4/21 | 19.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | 250-499` | 0/0 | — | 0/4 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔source | 0-24` | 2/3 | 66.7% | 1/34 | 2.9% | — | SPARSE |
| `manifest-lock↔source | 100-249` | 0/0 | — | 0/6 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔source | 25-99` | 0/0 | — | 4/22 | 18.2% | — | OMITTED_ONLY |
| `manifest-lock↔source | 250-499` | 0/0 | — | 0/8 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | 0-24` | 0/0 | — | 6/80 | 7.5% | — | OMITTED_ONLY |
| `manifest-lock↔test | 100-249` | 0/1 | 0.0% | 0/8 | 0.0% | — | SPARSE |
| `manifest-lock↔test | 25-99` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | 250-499` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `source↔source | 0-24` | 1/3 | 33.3% | 5/36 | 13.9% | — | SPARSE |
| `source↔source | 100-249` | 0/0 | — | 1/78 | 1.3% | — | OMITTED_ONLY |
| `source↔source | 25-99` | 0/1 | 0.0% | 12/76 | 15.8% | — | SPARSE |
| `source↔source | 250-499` | 0/0 | — | 0/42 | 0.0% | — | OMITTED_ONLY |
| `source↔test | 0-24` | 1/1 | 100.0% | 4/98 | 4.1% | — | SPARSE |
| `source↔test | 100-249` | 0/1 | 0.0% | 3/22 | 13.6% | — | SPARSE |
| `source↔test | 25-99` | 0/1 | 0.0% | 0/8 | 0.0% | — | SPARSE |
| `source↔test | 250-499` | 0/0 | — | 0/20 | 0.0% | — | OMITTED_ONLY |
| `test↔test | 0-24` | 0/0 | — | 3/106 | 2.8% | — | OMITTED_ONLY |
| `test↔test | 100-249` | 0/0 | — | 3/5 | 60.0% | — | OMITTED_ONLY |
| `test↔test | 250-499` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |

### `polylith-b250`

comparable=1 (P=1 Z=0 N=0), other cells=35

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `UNKNOWN↔UNKNOWN | 0-24` | 3/3 | 100.0% | 1/1 | 100.0% | — | SPARSE |
| `UNKNOWN↔UNKNOWN | 100-249` | 0/1 | 0.0% | 0/5 | 0.0% | — | SPARSE |
| `UNKNOWN↔UNKNOWN | 25-99` | 0/0 | — | 1/2 | 50.0% | — | OMITTED_ONLY |
| `UNKNOWN↔docs | 0-24` | 3/3 | 100.0% | 5/5 | 100.0% | — | SPARSE |
| `UNKNOWN↔docs | 100-249` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔docs | 25-99` | 0/1 | 0.0% | 2/6 | 33.3% | — | SPARSE |
| `UNKNOWN↔manifest-lock | 100-249` | 0/0 | — | 0/5 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source | 0-24` | 0/1 | 0.0% | 6/10 | 60.0% | — | SPARSE |
| `UNKNOWN↔source | 100-249` | 0/0 | — | 0/4 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔test | 0-24` | 0/0 | — | 3/3 | 100.0% | — | OMITTED_ONLY |
| `docs↔docs | 0-24` | 2/2 | 100.0% | 7/7 | 100.0% | — | SPARSE |
| `docs↔docs | 100-249` | 0/0 | — | 0/10 | 0.0% | — | OMITTED_ONLY |
| `docs↔docs | 25-99` | 0/1 | 0.0% | 0/2 | 0.0% | — | SPARSE |
| `docs↔manifest-lock | 100-249` | 0/1 | 0.0% | 0/2 | 0.0% | — | SPARSE |
| `docs↔manifest-lock | 25-99` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔source | 0-24` | 1/1 | 100.0% | 8/13 | 61.5% | — | SPARSE |
| `docs↔source | 100-249` | 0/3 | 0.0% | 0/10 | 0.0% | — | SPARSE |
| `docs↔source | 25-99` | 0/7 | 0.0% | 0/9 | 0.0% | — | SPARSE |
| `docs↔test | 0-24` | 0/0 | — | 2/2 | 100.0% | — | OMITTED_ONLY |
| `docs↔test | 100-249` | 0/0 | — | 0/5 | 0.0% | — | OMITTED_ONLY |
| `docs↔test | 25-99` | 0/1 | 0.0% | 0/2 | 0.0% | — | SPARSE |
| `manifest-lock↔manifest-lock | 0-24` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | 100-249` | 0/1 | 0.0% | 0/3 | 0.0% | — | SPARSE |
| `manifest-lock↔source | 0-24` | 0/0 | — | 2/2 | 100.0% | — | OMITTED_ONLY |
| `manifest-lock↔source | 100-249` | 2/2 | 100.0% | 6/14 | 42.9% | — | SPARSE |
| `manifest-lock↔test | 0-24` | 0/0 | — | 3/3 | 100.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | 100-249` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `source↔source | 0-24` | 6/13 | 46.2% | 9/32 | 28.1% | +18.0pp | COMPARABLE |
| `source↔source | 100-249` | 0/3 | 0.0% | 7/46 | 15.2% | — | SPARSE |
| `source↔source | 25-99` | 0/2 | 0.0% | 0/24 | 0.0% | — | SPARSE |
| `source↔test | 0-24` | 2/4 | 50.0% | 4/13 | 30.8% | — | SPARSE |
| `source↔test | 100-249` | 0/0 | — | 1/21 | 4.8% | — | OMITTED_ONLY |
| `source↔test | 25-99` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `test↔test | 0-24` | 0/0 | — | 3/4 | 75.0% | — | OMITTED_ONLY |
| `test↔test | 100-249` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `test↔test | 25-99` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |

## J2 — endpoint-role pair × endpoint-existence state

Across the six held-out bases: **6 comparable cells** — emitted > omitted in **2**, equal in **2**, emitted < omitted in **2**.

### `syncpack-b100`

comparable=1 (P=1 Z=0 N=0), other cells=34

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `UNKNOWN↔UNKNOWN | BOTH_CURRENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔docs | BOTH_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔docs | BOTH_CURRENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock | BOTH_CURRENT` | 0/0 | — | 2/4 | 50.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source | BOTH_CURRENT` | 0/0 | — | 1/4 | 25.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source | ONE_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔tooling-ci | BOTH_CURRENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `docs↔docs | BOTH_ABSENT` | 0/0 | — | 0/39 | 0.0% | — | OMITTED_ONLY |
| `docs↔docs | BOTH_CURRENT` | 0/0 | — | 4/11 | 36.4% | — | OMITTED_ONLY |
| `docs↔docs | ONE_ABSENT` | 0/1 | 0.0% | 0/0 | — | — | EMITTED_ONLY |
| `docs↔manifest-lock | BOTH_CURRENT` | 0/3 | 0.0% | 0/1 | 0.0% | — | SPARSE |
| `docs↔manifest-lock | ONE_ABSENT` | 0/2 | 0.0% | 0/0 | — | — | EMITTED_ONLY |
| `docs↔source | BOTH_CURRENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔tooling-ci | BOTH_CURRENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | BOTH_CURRENT` | 1/6 | 16.7% | 0/0 | — | — | EMITTED_ONLY |
| `manifest-lock↔manifest-lock | ONE_ABSENT` | 0/4 | 0.0% | 0/2 | 0.0% | — | SPARSE |
| `manifest-lock↔source | BOTH_CURRENT` | 0/0 | — | 2/6 | 33.3% | — | OMITTED_ONLY |
| `manifest-lock↔source | ONE_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | BOTH_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | ONE_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci | BOTH_CURRENT` | 1/1 | 100.0% | 2/2 | 100.0% | — | SPARSE |
| `manifest-lock↔tooling-ci | ONE_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `source↔source | BOTH_ABSENT` | 1/12 | 8.3% | 2/67 | 3.0% | +5.3pp | COMPARABLE |
| `source↔source | BOTH_CURRENT` | 4/4 | 100.0% | 50/63 | 79.4% | — | SPARSE |
| `source↔source | ONE_ABSENT` | 4/7 | 57.1% | 8/54 | 14.8% | — | SPARSE |
| `source↔test | BOTH_ABSENT` | 0/0 | — | 0/32 | 0.0% | — | OMITTED_ONLY |
| `source↔test | BOTH_CURRENT` | 4/6 | 66.7% | 11/22 | 50.0% | — | SPARSE |
| `source↔test | ONE_ABSENT` | 0/0 | — | 2/14 | 14.3% | — | OMITTED_ONLY |
| `source↔tooling-ci | BOTH_CURRENT` | 0/0 | — | 2/4 | 50.0% | — | OMITTED_ONLY |
| `test↔test | BOTH_ABSENT` | 0/0 | — | 0/168 | 0.0% | — | OMITTED_ONLY |
| `test↔test | BOTH_CURRENT` | 1/1 | 100.0% | 5/5 | 100.0% | — | SPARSE |
| `test↔test | ONE_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `tooling-ci↔tooling-ci | BOTH_ABSENT` | 0/1 | 0.0% | 0/0 | — | — | EMITTED_ONLY |
| `tooling-ci↔tooling-ci | BOTH_CURRENT` | 0/0 | — | 3/3 | 100.0% | — | OMITTED_ONLY |
| `tooling-ci↔tooling-ci | ONE_ABSENT` | 0/2 | 0.0% | 0/1 | 0.0% | — | SPARSE |

### `syncpack-b250`

comparable=1 (P=0 Z=1 N=0), other cells=28

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `UNKNOWN↔manifest-lock | BOTH_CURRENT` | 0/0 | — | 2/2 | 100.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source | BOTH_CURRENT` | 0/0 | — | 1/2 | 50.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source | ONE_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔docs | BOTH_ABSENT` | 0/0 | — | 0/36 | 0.0% | — | OMITTED_ONLY |
| `docs↔docs | ONE_ABSENT` | 0/1 | 0.0% | 0/0 | — | — | EMITTED_ONLY |
| `docs↔manifest-lock | BOTH_CURRENT` | 0/4 | 0.0% | 0/1 | 0.0% | — | SPARSE |
| `docs↔manifest-lock | ONE_ABSENT` | 0/1 | 0.0% | 0/0 | — | — | EMITTED_ONLY |
| `docs↔source | ONE_ABSENT` | 0/0 | — | 0/17 | 0.0% | — | OMITTED_ONLY |
| `docs↔test | ONE_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `docs↔tooling-ci | BOTH_CURRENT` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | BOTH_CURRENT` | 3/9 | 33.3% | 0/0 | — | — | EMITTED_ONLY |
| `manifest-lock↔manifest-lock | ONE_ABSENT` | 0/1 | 0.0% | 0/0 | — | — | EMITTED_ONLY |
| `manifest-lock↔source | BOTH_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔source | ONE_ABSENT` | 0/0 | — | 0/5 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | BOTH_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | ONE_ABSENT` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci | BOTH_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci | BOTH_CURRENT` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci | ONE_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `source↔source | BOTH_ABSENT` | 0/25 | 0.0% | 0/247 | 0.0% | +0.0pp | COMPARABLE |
| `source↔source | BOTH_CURRENT` | 5/5 | 100.0% | 45/53 | 84.9% | — | SPARSE |
| `source↔source | ONE_ABSENT` | 0/1 | 0.0% | 0/28 | 0.0% | — | SPARSE |
| `source↔test | BOTH_ABSENT` | 0/0 | — | 0/122 | 0.0% | — | OMITTED_ONLY |
| `source↔test | BOTH_CURRENT` | 0/0 | — | 5/12 | 41.7% | — | OMITTED_ONLY |
| `source↔test | ONE_ABSENT` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `source↔tooling-ci | BOTH_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `source↔tooling-ci | BOTH_CURRENT` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `test↔test | BOTH_ABSENT` | 0/1 | 0.0% | 0/189 | 0.0% | — | SPARSE |
| `tooling-ci↔tooling-ci | BOTH_CURRENT` | 1/2 | 50.0% | 0/1 | 0.0% | — | SPARSE |

### `formatjs-b100`

comparable=1 (P=0 Z=1 N=0), other cells=42

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `UNKNOWN↔UNKNOWN | BOTH_CURRENT` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔docs | BOTH_CURRENT` | 0/0 | — | 1/4 | 25.0% | — | OMITTED_ONLY |
| `UNKNOWN↔generated | BOTH_CURRENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock | BOTH_CURRENT` | 0/0 | — | 0/5 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source | BOTH_CURRENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔test | BOTH_CURRENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔tooling-ci | BOTH_CURRENT` | 0/0 | — | 0/76 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔tooling-ci | ONE_ABSENT` | 0/0 | — | 0/6 | 0.0% | — | OMITTED_ONLY |
| `docs↔docs | BOTH_CURRENT` | 0/0 | — | 1/77 | 1.3% | — | OMITTED_ONLY |
| `docs↔manifest-lock | BOTH_CURRENT` | 0/0 | — | 0/85 | 0.0% | — | OMITTED_ONLY |
| `docs↔manifest-lock | ONE_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `docs↔source | BOTH_CURRENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔source | ONE_ABSENT` | 0/0 | — | 0/7 | 0.0% | — | OMITTED_ONLY |
| `docs↔test | ONE_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔tooling-ci | BOTH_CURRENT` | 0/0 | — | 0/142 | 0.0% | — | OMITTED_ONLY |
| `docs↔tooling-ci | ONE_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `generated↔generated | BOTH_CURRENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `generated↔manifest-lock | BOTH_CURRENT` | 0/0 | — | 0/4 | 0.0% | — | OMITTED_ONLY |
| `generated↔source | BOTH_CURRENT` | 0/0 | — | 0/8 | 0.0% | — | OMITTED_ONLY |
| `generated↔test | BOTH_CURRENT` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `generated↔tooling-ci | BOTH_CURRENT` | 0/0 | — | 0/5 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | BOTH_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | BOTH_CURRENT` | 4/8 | 50.0% | 2/70 | 2.9% | — | SPARSE |
| `manifest-lock↔manifest-lock | ONE_ABSENT` | 0/0 | — | 0/5 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔source | BOTH_ABSENT` | 0/0 | — | 0/4 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔source | BOTH_CURRENT` | 0/0 | — | 2/8 | 25.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | BOTH_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci | BOTH_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci | BOTH_CURRENT` | 2/4 | 50.0% | 1/84 | 1.2% | — | SPARSE |
| `manifest-lock↔tooling-ci | ONE_ABSENT` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `source↔source | BOTH_ABSENT` | 0/0 | — | 0/12 | 0.0% | — | OMITTED_ONLY |
| `source↔source | BOTH_CURRENT` | 0/0 | — | 0/6 | 0.0% | — | OMITTED_ONLY |
| `source↔test | BOTH_ABSENT` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `source↔test | BOTH_CURRENT` | 0/0 | — | 1/7 | 14.3% | — | OMITTED_ONLY |
| `source↔tooling-ci | BOTH_ABSENT` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `source↔tooling-ci | BOTH_CURRENT` | 0/0 | — | 1/9 | 11.1% | — | OMITTED_ONLY |
| `source↔tooling-ci | ONE_ABSENT` | 0/0 | — | 0/60 | 0.0% | — | OMITTED_ONLY |
| `test↔test | BOTH_CURRENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `test↔tooling-ci | BOTH_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `test↔tooling-ci | BOTH_CURRENT` | 0/0 | — | 0/4 | 0.0% | — | OMITTED_ONLY |
| `tooling-ci↔tooling-ci | BOTH_ABSENT` | 0/0 | — | 0/15 | 0.0% | — | OMITTED_ONLY |
| `tooling-ci↔tooling-ci | BOTH_CURRENT` | 0/38 | 0.0% | 0/454 | 0.0% | +0.0pp | COMPARABLE |
| `tooling-ci↔tooling-ci | ONE_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |

### `formatjs-b250`

comparable=1 (P=0 Z=0 N=1), other cells=42

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `UNKNOWN↔UNKNOWN | BOTH_CURRENT` | 0/0 | — | 1/4 | 25.0% | — | OMITTED_ONLY |
| `UNKNOWN↔docs | BOTH_CURRENT` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock | BOTH_CURRENT` | 0/0 | — | 0/14 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source | BOTH_CURRENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔tooling-ci | BOTH_CURRENT` | 0/0 | — | 3/106 | 2.8% | — | OMITTED_ONLY |
| `UNKNOWN↔tooling-ci | ONE_ABSENT` | 0/0 | — | 0/25 | 0.0% | — | OMITTED_ONLY |
| `docs↔docs | BOTH_CURRENT` | 0/0 | — | 3/82 | 3.7% | — | OMITTED_ONLY |
| `docs↔docs | ONE_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔manifest-lock | BOTH_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔manifest-lock | BOTH_CURRENT` | 0/0 | — | 3/157 | 1.9% | — | OMITTED_ONLY |
| `docs↔manifest-lock | ONE_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `docs↔source | BOTH_CURRENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔source | ONE_ABSENT` | 0/0 | — | 0/7 | 0.0% | — | OMITTED_ONLY |
| `docs↔test | ONE_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `docs↔tooling-ci | BOTH_CURRENT` | 0/0 | — | 1/69 | 1.4% | — | OMITTED_ONLY |
| `docs↔tooling-ci | ONE_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `generated↔generated | BOTH_CURRENT` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `generated↔source | BOTH_CURRENT` | 0/0 | — | 3/5 | 60.0% | — | OMITTED_ONLY |
| `generated↔test | BOTH_CURRENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `generated↔tooling-ci | BOTH_CURRENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | BOTH_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | BOTH_CURRENT` | 4/4 | 100.0% | 7/115 | 6.1% | — | SPARSE |
| `manifest-lock↔manifest-lock | ONE_ABSENT` | 0/0 | — | 0/4 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔source | BOTH_ABSENT` | 0/0 | — | 0/4 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔source | BOTH_CURRENT` | 0/0 | — | 1/9 | 11.1% | — | OMITTED_ONLY |
| `manifest-lock↔test | BOTH_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | BOTH_CURRENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci | BOTH_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci | BOTH_CURRENT` | 0/0 | — | 12/92 | 13.0% | — | OMITTED_ONLY |
| `manifest-lock↔tooling-ci | ONE_ABSENT` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `source↔source | BOTH_ABSENT` | 0/0 | — | 0/12 | 0.0% | — | OMITTED_ONLY |
| `source↔source | BOTH_CURRENT` | 0/0 | — | 0/5 | 0.0% | — | OMITTED_ONLY |
| `source↔source | ONE_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `source↔test | BOTH_ABSENT` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `source↔test | BOTH_CURRENT` | 0/0 | — | 2/5 | 40.0% | — | OMITTED_ONLY |
| `source↔tooling-ci | BOTH_ABSENT` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `source↔tooling-ci | BOTH_CURRENT` | 0/0 | — | 3/10 | 30.0% | — | OMITTED_ONLY |
| `source↔tooling-ci | ONE_ABSENT` | 0/0 | — | 0/61 | 0.0% | — | OMITTED_ONLY |
| `test↔tooling-ci | BOTH_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `test↔tooling-ci | BOTH_CURRENT` | 0/0 | — | 1/3 | 33.3% | — | OMITTED_ONLY |
| `tooling-ci↔tooling-ci | BOTH_ABSENT` | 0/0 | — | 0/213 | 0.0% | — | OMITTED_ONLY |
| `tooling-ci↔tooling-ci | BOTH_CURRENT` | 0/46 | 0.0% | 14/684 | 2.0% | -2.0pp | COMPARABLE |
| `tooling-ci↔tooling-ci | ONE_ABSENT` | 0/0 | — | 0/6 | 0.0% | — | OMITTED_ONLY |

### `polylith-b100`

comparable=0 (P=0 Z=0 N=0), other cells=46

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `UNKNOWN↔UNKNOWN | BOTH_ABSENT` | 0/0 | — | 0/4 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔UNKNOWN | BOTH_CURRENT` | 3/3 | 100.0% | 0/3 | 0.0% | — | SPARSE |
| `UNKNOWN↔UNKNOWN | ONE_ABSENT` | 0/1 | 0.0% | 0/8 | 0.0% | — | SPARSE |
| `UNKNOWN↔docs | BOTH_ABSENT` | 0/0 | — | 0/11 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔docs | BOTH_CURRENT` | 0/0 | — | 24/35 | 68.6% | — | OMITTED_ONLY |
| `UNKNOWN↔docs | ONE_ABSENT` | 0/6 | 0.0% | 0/27 | 0.0% | — | SPARSE |
| `UNKNOWN↔generated | BOTH_CURRENT` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock | BOTH_ABSENT` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock | BOTH_CURRENT` | 0/0 | — | 0/15 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock | ONE_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source | BOTH_ABSENT` | 0/0 | — | 0/4 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source | BOTH_CURRENT` | 3/3 | 100.0% | 6/50 | 12.0% | — | SPARSE |
| `UNKNOWN↔source | ONE_ABSENT` | 0/0 | — | 0/18 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔test | BOTH_CURRENT` | 0/0 | — | 6/21 | 28.6% | — | OMITTED_ONLY |
| `UNKNOWN↔test | ONE_ABSENT` | 0/0 | — | 0/9 | 0.0% | — | OMITTED_ONLY |
| `docs↔docs | BOTH_ABSENT` | 0/3 | 0.0% | 0/51 | 0.0% | — | SPARSE |
| `docs↔docs | BOTH_CURRENT` | 5/5 | 100.0% | 26/49 | 53.1% | — | SPARSE |
| `docs↔docs | ONE_ABSENT` | 0/0 | — | 0/33 | 0.0% | — | OMITTED_ONLY |
| `docs↔manifest-lock | BOTH_ABSENT` | 0/0 | — | 0/5 | 0.0% | — | OMITTED_ONLY |
| `docs↔manifest-lock | BOTH_CURRENT` | 0/0 | — | 4/26 | 15.4% | — | OMITTED_ONLY |
| `docs↔manifest-lock | ONE_ABSENT` | 0/0 | — | 0/23 | 0.0% | — | OMITTED_ONLY |
| `docs↔source | BOTH_ABSENT` | 0/1 | 0.0% | 0/12 | 0.0% | — | SPARSE |
| `docs↔source | BOTH_CURRENT` | 6/6 | 100.0% | 31/91 | 34.1% | — | SPARSE |
| `docs↔source | ONE_ABSENT` | 0/8 | 0.0% | 0/62 | 0.0% | — | SPARSE |
| `docs↔test | BOTH_ABSENT` | 0/0 | — | 0/14 | 0.0% | — | OMITTED_ONLY |
| `docs↔test | BOTH_CURRENT` | 1/1 | 100.0% | 6/43 | 14.0% | — | SPARSE |
| `docs↔test | ONE_ABSENT` | 0/1 | 0.0% | 0/23 | 0.0% | — | SPARSE |
| `generated↔source | BOTH_CURRENT` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | BOTH_ABSENT` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | BOTH_CURRENT` | 0/1 | 0.0% | 7/40 | 17.5% | — | SPARSE |
| `manifest-lock↔manifest-lock | ONE_ABSENT` | 0/0 | — | 0/14 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔source | BOTH_ABSENT` | 0/0 | — | 0/4 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔source | BOTH_CURRENT` | 2/3 | 66.7% | 5/48 | 10.4% | — | SPARSE |
| `manifest-lock↔source | ONE_ABSENT` | 0/0 | — | 0/18 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | BOTH_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | BOTH_CURRENT` | 0/0 | — | 6/56 | 10.7% | — | OMITTED_ONLY |
| `manifest-lock↔test | ONE_ABSENT` | 0/1 | 0.0% | 0/33 | 0.0% | — | SPARSE |
| `source↔source | BOTH_ABSENT` | 0/0 | — | 0/16 | 0.0% | — | OMITTED_ONLY |
| `source↔source | BOTH_CURRENT` | 1/4 | 25.0% | 18/168 | 10.7% | — | SPARSE |
| `source↔source | ONE_ABSENT` | 0/0 | — | 0/48 | 0.0% | — | OMITTED_ONLY |
| `source↔test | BOTH_ABSENT` | 0/0 | — | 0/14 | 0.0% | — | OMITTED_ONLY |
| `source↔test | BOTH_CURRENT` | 1/2 | 50.0% | 6/81 | 7.4% | — | SPARSE |
| `source↔test | ONE_ABSENT` | 0/1 | 0.0% | 1/53 | 1.9% | — | SPARSE |
| `test↔test | BOTH_ABSENT` | 0/0 | — | 0/12 | 0.0% | — | OMITTED_ONLY |
| `test↔test | BOTH_CURRENT` | 0/0 | — | 6/49 | 12.2% | — | OMITTED_ONLY |
| `test↔test | ONE_ABSENT` | 0/0 | — | 0/53 | 0.0% | — | OMITTED_ONLY |

### `polylith-b250`

comparable=2 (P=1 Z=0 N=1), other cells=34

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `UNKNOWN↔UNKNOWN | BOTH_ABSENT` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔UNKNOWN | BOTH_CURRENT` | 3/3 | 100.0% | 2/3 | 66.7% | — | SPARSE |
| `UNKNOWN↔UNKNOWN | ONE_ABSENT` | 0/1 | 0.0% | 0/2 | 0.0% | — | SPARSE |
| `UNKNOWN↔docs | BOTH_CURRENT` | 3/4 | 75.0% | 7/12 | 58.3% | — | SPARSE |
| `UNKNOWN↔docs | ONE_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock | BOTH_ABSENT` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔manifest-lock | ONE_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source | BOTH_ABSENT` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔source | BOTH_CURRENT` | 0/1 | 0.0% | 6/8 | 75.0% | — | SPARSE |
| `UNKNOWN↔source | ONE_ABSENT` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `UNKNOWN↔test | BOTH_CURRENT` | 0/0 | — | 3/3 | 100.0% | — | OMITTED_ONLY |
| `docs↔docs | BOTH_ABSENT` | 0/0 | — | 0/10 | 0.0% | — | OMITTED_ONLY |
| `docs↔docs | BOTH_CURRENT` | 2/3 | 66.7% | 7/9 | 77.8% | — | SPARSE |
| `docs↔manifest-lock | BOTH_CURRENT` | 0/1 | 0.0% | 0/0 | — | — | EMITTED_ONLY |
| `docs↔manifest-lock | ONE_ABSENT` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `docs↔source | BOTH_CURRENT` | 1/11 | 9.1% | 8/28 | 28.6% | -19.5pp | COMPARABLE |
| `docs↔source | ONE_ABSENT` | 0/0 | — | 0/4 | 0.0% | — | OMITTED_ONLY |
| `docs↔test | BOTH_CURRENT` | 0/1 | 0.0% | 2/4 | 50.0% | — | SPARSE |
| `docs↔test | ONE_ABSENT` | 0/0 | — | 0/5 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | BOTH_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | BOTH_CURRENT` | 0/0 | — | 1/1 | 100.0% | — | OMITTED_ONLY |
| `manifest-lock↔manifest-lock | ONE_ABSENT` | 0/1 | 0.0% | 0/1 | 0.0% | — | SPARSE |
| `manifest-lock↔source | BOTH_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔source | BOTH_CURRENT` | 2/2 | 100.0% | 8/8 | 100.0% | — | SPARSE |
| `manifest-lock↔source | ONE_ABSENT` | 0/0 | — | 0/6 | 0.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | BOTH_CURRENT` | 0/0 | — | 3/4 | 75.0% | — | OMITTED_ONLY |
| `manifest-lock↔test | ONE_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `source↔source | BOTH_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `source↔source | BOTH_CURRENT` | 6/18 | 33.3% | 16/90 | 17.8% | +15.6pp | COMPARABLE |
| `source↔source | ONE_ABSENT` | 0/0 | — | 0/11 | 0.0% | — | OMITTED_ONLY |
| `source↔test | BOTH_ABSENT` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `source↔test | BOTH_CURRENT` | 2/4 | 50.0% | 5/22 | 22.7% | — | SPARSE |
| `source↔test | ONE_ABSENT` | 0/0 | — | 0/11 | 0.0% | — | OMITTED_ONLY |
| `test↔test | BOTH_ABSENT` | 0/0 | — | 0/1 | 0.0% | — | OMITTED_ONLY |
| `test↔test | BOTH_CURRENT` | 0/0 | — | 3/5 | 60.0% | — | OMITTED_ONLY |
| `test↔test | ONE_ABSENT` | 0/0 | — | 0/2 | 0.0% | — | OMITTED_ONLY |

## J3 — age bucket × persistence X/Y

Across the six held-out bases: **12 comparable cells** — emitted > omitted in **5**, equal in **4**, emitted < omitted in **3**.

### `syncpack-b100`

comparable=1 (P=1 Z=0 N=0), other cells=15

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `0-24 | 1/5` | 0/0 | — | 2/9 | 22.2% | — | OMITTED_ONLY |
| `0-24 | 2/5` | 2/3 | 66.7% | 51/66 | 77.3% | — | SPARSE |
| `0-24 | 3/5` | 7/10 | 70.0% | 23/42 | 54.8% | +15.2pp | COMPARABLE |
| `0-24 | 4/5` | 7/14 | 50.0% | 2/3 | 66.7% | — | SPARSE |
| `0-24 | 5/5` | 0/1 | 0.0% | 0/0 | — | — | EMITTED_ONLY |
| `100-249 | 1/5` | 0/0 | — | 1/4 | 25.0% | — | OMITTED_ONLY |
| `100-249 | 2/5` | 0/0 | — | 4/37 | 10.8% | — | OMITTED_ONLY |
| `100-249 | 3/5` | 0/3 | 0.0% | 0/7 | 0.0% | — | SPARSE |
| `100-249 | 4/5` | 0/2 | 0.0% | 0/0 | — | — | EMITTED_ONLY |
| `25-99 | 1/5` | 0/0 | — | 0/7 | 0.0% | — | OMITTED_ONLY |
| `25-99 | 2/5` | 0/0 | — | 5/17 | 29.4% | — | OMITTED_ONLY |
| `25-99 | 3/5` | 0/3 | 0.0% | 5/5 | 100.0% | — | SPARSE |
| `25-99 | 4/5` | 0/2 | 0.0% | 0/1 | 0.0% | — | SPARSE |
| `25-99 | 5/5` | 0/2 | 0.0% | 0/0 | — | — | EMITTED_ONLY |
| `250-499 | 1/5` | 0/3 | 0.0% | 0/209 | 0.0% | — | SPARSE |
| `250-499 | 2/5` | 0/7 | 0.0% | 1/111 | 0.9% | — | SPARSE |

### `syncpack-b250`

comparable=2 (P=0 Z=1 N=1), other cells=12

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `0-24 | 1/5` | 0/0 | — | 2/2 | 100.0% | — | OMITTED_ONLY |
| `0-24 | 2/5` | 7/14 | 50.0% | 11/14 | 78.6% | -28.6pp | COMPARABLE |
| `0-24 | 3/5` | 1/3 | 33.3% | 0/0 | — | — | EMITTED_ONLY |
| `0-24 | 4/5` | 1/2 | 50.0% | 0/1 | 0.0% | — | SPARSE |
| `0-24 | 5/5` | 0/1 | 0.0% | 0/0 | — | — | EMITTED_ONLY |
| `100-249 | 1/5` | 0/1 | 0.0% | 7/72 | 9.7% | — | SPARSE |
| `100-249 | 2/5` | 0/11 | 0.0% | 0/77 | 0.0% | +0.0pp | COMPARABLE |
| `100-249 | 3/5` | 0/7 | 0.0% | 0/3 | 0.0% | — | SPARSE |
| `100-249 | 4/5` | 0/0 | — | 2/2 | 100.0% | — | OMITTED_ONLY |
| `25-99 | 1/5` | 0/0 | — | 7/8 | 87.5% | — | OMITTED_ONLY |
| `25-99 | 2/5` | 0/2 | 0.0% | 27/50 | 54.0% | — | SPARSE |
| `250-499 | 1/5` | 0/0 | — | 0/214 | 0.0% | — | OMITTED_ONLY |
| `250-499 | 2/5` | 0/2 | 0.0% | 0/285 | 0.0% | — | SPARSE |
| `250-499 | 3/5` | 0/7 | 0.0% | 0/6 | 0.0% | — | SPARSE |

### `formatjs-b100`

comparable=2 (P=0 Z=2 N=0), other cells=14

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `0-24 | 1/5` | 0/0 | — | 0/34 | 0.0% | — | OMITTED_ONLY |
| `0-24 | 2/5` | 0/1 | 0.0% | 0/9 | 0.0% | — | SPARSE |
| `0-24 | 3/5` | 0/1 | 0.0% | 0/29 | 0.0% | — | SPARSE |
| `0-24 | 4/5` | 0/1 | 0.0% | 0/4 | 0.0% | — | SPARSE |
| `0-24 | 5/5` | 4/7 | 57.1% | 0/0 | — | — | EMITTED_ONLY |
| `100-249 | 1/5` | 0/0 | — | 0/8 | 0.0% | — | OMITTED_ONLY |
| `100-249 | 2/5` | 0/0 | — | 2/87 | 2.3% | — | OMITTED_ONLY |
| `100-249 | 3/5` | 0/0 | — | 0/26 | 0.0% | — | OMITTED_ONLY |
| `100-249 | 4/5` | 0/1 | 0.0% | 0/9 | 0.0% | — | SPARSE |
| `25-99 | 2/5` | 0/0 | — | 6/252 | 2.4% | — | OMITTED_ONLY |
| `25-99 | 3/5` | 2/2 | 100.0% | 1/55 | 1.8% | — | SPARSE |
| `25-99 | 4/5` | 0/10 | 0.0% | 0/37 | 0.0% | +0.0pp | COMPARABLE |
| `25-99 | 5/5` | 0/11 | 0.0% | 0/0 | — | — | EMITTED_ONLY |
| `250-499 | 1/5` | 0/0 | — | 0/137 | 0.0% | — | OMITTED_ONLY |
| `250-499 | 2/5` | 0/0 | — | 0/159 | 0.0% | — | OMITTED_ONLY |
| `250-499 | 3/5` | 0/16 | 0.0% | 0/346 | 0.0% | +0.0pp | COMPARABLE |

### `formatjs-b250`

comparable=1 (P=0 Z=0 N=1), other cells=15

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `0-24 | 1/5` | 0/0 | — | 2/16 | 12.5% | — | OMITTED_ONLY |
| `0-24 | 2/5` | 0/0 | — | 3/98 | 3.1% | — | OMITTED_ONLY |
| `0-24 | 3/5` | 0/0 | — | 3/147 | 2.0% | — | OMITTED_ONLY |
| `0-24 | 4/5` | 0/0 | — | 0/30 | 0.0% | — | OMITTED_ONLY |
| `0-24 | 5/5` | 4/4 | 100.0% | 1/9 | 11.1% | — | SPARSE |
| `100-249 | 1/5` | 0/0 | — | 11/77 | 14.3% | — | OMITTED_ONLY |
| `100-249 | 2/5` | 0/0 | — | 5/112 | 4.5% | — | OMITTED_ONLY |
| `100-249 | 3/5` | 0/0 | — | 4/232 | 1.7% | — | OMITTED_ONLY |
| `100-249 | 4/5` | 0/46 | 0.0% | 3/386 | 0.8% | -0.8pp | COMPARABLE |
| `25-99 | 2/5` | 0/0 | — | 5/50 | 10.0% | — | OMITTED_ONLY |
| `25-99 | 3/5` | 0/0 | — | 1/29 | 3.4% | — | OMITTED_ONLY |
| `25-99 | 4/5` | 0/0 | — | 4/7 | 57.1% | — | OMITTED_ONLY |
| `25-99 | 5/5` | 0/0 | — | 0/3 | 0.0% | — | OMITTED_ONLY |
| `250-499 | 1/5` | 0/0 | — | 3/53 | 5.7% | — | OMITTED_ONLY |
| `250-499 | 2/5` | 0/0 | — | 10/323 | 3.1% | — | OMITTED_ONLY |
| `250-499 | 3/5` | 0/0 | — | 0/154 | 0.0% | — | OMITTED_ONLY |

### `polylith-b100`

comparable=2 (P=1 Z=0 N=1), other cells=7

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `0-24 | 1/5` | 12/12 | 100.0% | 67/498 | 13.5% | +86.5pp | COMPARABLE |
| `0-24 | 2/5` | 8/9 | 88.9% | 20/104 | 19.2% | — | SPARSE |
| `0-24 | 3/5` | 2/5 | 40.0% | 2/16 | 12.5% | — | SPARSE |
| `100-249 | 1/5` | 0/12 | 0.0% | 9/194 | 4.6% | -4.6pp | COMPARABLE |
| `100-249 | 2/5` | 0/6 | 0.0% | 10/130 | 7.7% | — | SPARSE |
| `25-99 | 1/5` | 0/0 | — | 27/94 | 28.7% | — | OMITTED_ONLY |
| `25-99 | 2/5` | 0/2 | 0.0% | 16/141 | 11.3% | — | SPARSE |
| `25-99 | 3/5` | 0/3 | 0.0% | 3/53 | 5.7% | — | SPARSE |
| `250-499 | 1/5` | 0/1 | 0.0% | 0/126 | 0.0% | — | SPARSE |

### `polylith-b250`

comparable=4 (P=3 Z=1 N=0), other cells=1

| Stratum | Emitted X/N | Emitted rate | Omitted X/N | Omitted rate | Diff | Class |
| -- | --: | --: | --: | --: | --: | -- |
| `0-24 | 1/5` | 9/10 | 90.0% | 37/47 | 78.7% | +11.3pp | COMPARABLE |
| `0-24 | 2/5` | 8/17 | 47.1% | 17/49 | 34.7% | +12.4pp | COMPARABLE |
| `100-249 | 1/5` | 2/11 | 18.2% | 14/132 | 10.6% | +7.6pp | COMPARABLE |
| `25-99 | 1/5` | 0/2 | 0.0% | 3/9 | 33.3% | — | SPARSE |
| `25-99 | 2/5` | 0/10 | 0.0% | 0/40 | 0.0% | +0.0pp | COMPARABLE |

