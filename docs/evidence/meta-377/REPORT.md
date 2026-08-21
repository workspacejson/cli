# REPORT — META-377

**Does the current global top-50 held-out recurrence advantage survive when
relationships are conditioned on descriptive characteristics observable at T0?**

Exploratory decomposition of META-375 on the frozen META-375 corpus. Owns the
execution for Fibery **OQ-13**. No miner run, no new repositories or bases, no
producer/standard/ranking change, no model run.

---

## Disposition

# `MIXED_CONDITIONAL_EFFECTS`

Reached mechanically by ANALYSIS-PLAN §7, frozen at commit
`f09a1c96ce7c9c868adc65ef7ed8fbb42d1d3a0d` before any conditioned rate existed.

| | |
| -- | --: |
| Comparable cells (D3–D7, six held-out bases) | **\|C\| = 94** |
| emitted > omitted | **P = 64** |
| emitted = omitted | **Z = 6** |
| emitted < omitted | **N = 24** |
| Bases contributing ≥1 comparable cell | **B = 6 / 6** |
| `P/\|C\|` | 0.681 |
| `N/\|C\|` | 0.255 |
| `(P−N)/\|C\|` | 0.426 |

Branch evaluation, in the frozen order:

1. `INSUFFICIENT_WITHIN_STRATUM_SUPPORT` — **not taken.** |C| = 94 > 0 and
   B = 6 ≥ 4.
2. `SEPARATION_SURVIVES_CONDITIONING` — **not taken.** `P/|C| = 0.681` clears
   the 2/3 supermajority, and no basis is net-negative, but
   `N/|C| = 0.255` exceeds the 1/6 reversal ceiling. **The binding failure is
   the reversal rate, not the majority.**
3. `SEPARATION_EXPLAINED_BY_COMPOSITION` — **not taken.** `P/|C| = 0.681`
   exceeds 1/2; the advantage remains a majority phenomenon within strata.
4. `MIXED_CONDITIONAL_EFFECTS` — **taken (fallback).**

The advantage is neither universal nor abolished. One in four comparable
strata reverses, and the reversals are not scattered noise — they concentrate
by repository and by dimension, as named below.

---

## Reference point

META-375's unconditioned per-basis marginal, recomputed from the frozen records
and verified identical to `runs/aggregate.json` (invariant V11):

| Basis | Emitted | Omitted | Diff |
| -- | --: | --: | --: |
| `syncpack-b100` | 16/50 (32.0%) | 94/518 (18.1%) | +13.9pp |
| `syncpack-b250` | 9/50 (18.0%) | 56/734 (7.6%) | +10.4pp |
| `formatjs-b100` | 6/50 (12.0%) | 9/1,192 (0.8%) | +11.2pp |
| `formatjs-b250` | 4/50 (8.0%) | 55/1,726 (3.2%) | +4.8pp |
| `polylith-b100` | 22/50 (44.0%) | 154/1,356 (11.4%) | +32.6pp |
| `polylith-b250` | 19/50 (38.0%) | 71/277 (25.6%) | +12.4pp |

**6 / 6** unconditioned. That is the separation under test.

---

## The single clearest conditional pattern

**Endpoint existence at T0 (D4), `BOTH_CURRENT` stratum.** Every basis has a
comparable cell here, so it is the one stratum where all six bases can be read
side by side:

| Basis | Emitted | Omitted | Diff |
| -- | --: | --: | --: |
| `syncpack-b100` | 11/21 (52.4%) | 82/131 (62.6%) | **−10.2pp** |
| `syncpack-b250` | 9/20 (45.0%) | 56/74 (75.7%) | **−30.7pp** |
| `formatjs-b100` | 6/50 (12.0%) | 9/1,061 (0.8%) | +11.2pp |
| `formatjs-b250` | 4/50 (8.0%) | 55/1,371 (4.0%) | +4.0pp |
| `polylith-b100` | 22/28 (78.6%) | 153/777 (19.7%) | +58.9pp |
| `polylith-b250` | 19/48 (39.6%) | 71/197 (36.0%) | +3.5pp |

**Both syncpack bases reverse. The other four survive**, one of them
(`polylith-b100`) by a very wide margin. This is the heterogeneity the
disposition refuses to average away.

### Why the reversal is mechanically plausible

Recurrence is almost entirely confined to relationships whose endpoints both
still exist:

- **515** held-out recurrence observations across the six bases;
- **497 (96.5%)** are `BOTH_CURRENT`; 15 are `ONE_ABSENT`; 3 are `BOTH_ABSENT`;
- **2,275 of 6,103 (37.3%)** of the population has at least one absent endpoint,
  and only **18** of those ever recur.

The omitted population carries most of that dead weight. At `syncpack-b250`,
**599 of 734** omitted relationships (81.6%) have both endpoints absent and
**zero** of them recur, while only 74 are `BOTH_CURRENT`. So the unconditioned
+10.4pp is substantially a dilution artifact: once the dead endpoints are
removed from the comparison, the omitted survivors at syncpack recur *more*
often than the emitted ones.

At polylith and formatjs the same conditioning leaves the advantage intact. The
mechanism is real but its magnitude is repository-dependent.

---

## Answers to the six required questions

### 1. Within endpoint-role pairs (D3)? — **Mixed, and barely testable.**

7 comparable cells across six bases: P=4, Z=1, N=2. The cap makes this the
sparsest dimension — 118 of 179 one-sided cells are `OMITTED_ONLY`, because 50
emitted relationships cannot populate 27 role pairs.

Named reversals:
- `polylith-b250` `docs↔source`: emitted **1/11 (9.1%)** < omitted **8/32 (25.0%)**, −15.9pp;
- `formatjs-b250` `tooling-ci↔tooling-ci`: emitted **0/46 (0.0%)** < omitted **14/903 (1.6%)**, −1.6pp.

`formatjs-b100` `source↔source` is exactly equal. No basis has more than two
comparable role cells; `source↔source`, the pair of most interest, is comparable
at only one basis. **This corpus cannot answer the role question.**

### 2. Within endpoint-existence states (D4)? — **Reverses at syncpack, survives elsewhere.**

10 comparable cells: P=6, Z=1, N=3. See the table above. Additional reversal:
`polylith-b100` `ONE_ABSENT`, emitted **0/18** < omitted **1/424** — a −0.2pp
difference on a single omitted recurrence, reported for completeness rather
than as a pattern.

### 3. Within age buckets (D5)? — **Net negative. This dimension does not survive.**

13 comparable cells: P=5, Z=1, **N=7**. The only dimension where reversals
outnumber survivals.

Per basis: `syncpack-b100` **0P/2N**, `syncpack-b250` **0P/2N**,
`formatjs-b250` 0P/1N, `polylith-b100` 1P/1N, `polylith-b250` 2P/1N,
`formatjs-b100` 2P/0N.

Named reversals:
- `syncpack-b250` `0-24`: emitted **9/20 (45.0%)** < omitted **13/17 (76.5%)**, −31.5pp — the largest reversal in the study;
- `syncpack-b100` `0-24`: emitted **16/28 (57.1%)** < omitted **78/120 (65.0%)**, −7.9pp;
- `polylith-b250` `25-99`: emitted **0/12** < omitted **3/49**, −6.1pp;
- `polylith-b100` `100-249`: emitted **0/18** < omitted **19/324**, −5.9pp;
- `syncpack-b250` `100-249`: emitted **0/19** < omitted **9/154**, −5.8pp;
- `formatjs-b250` `100-249`: emitted **0/46** < omitted **23/807**, −2.9pp;
- `syncpack-b100` `250-499`: emitted **0/10** < omitted **1/320**, −0.3pp.

Age is where the composition story is strongest: the top-50 is fresher than the
tail, so much of the aggregate advantage is *being fresh*, not *being ranked*.
Within a bucket, emitted relationships lose their edge and often fall behind.

### 4. Within exact persistence X/Y strata (D6)? — **Mixed.**

10 comparable cells: P=6, Z=1, N=3. `Y = 5` uniformly across this corpus, so
strata are `1/5`–`5/5`; the exact `X/Y` string is what was grouped on and no
normalization was applied.

Named reversals: `syncpack-b100` `3/5` (emitted **7/16 (43.8%)** < omitted
**28/54 (51.9%)**, −8.1pp); `syncpack-b100` `2/5` (**2/10** < **61/231**,
−6.4pp); `formatjs-b250` `4/5` (**0/46** < **7/423**, −1.7pp). Both polylith
bases are 2P/0N.

### 5. Within current-tree exposure states (D7)? — **Survives most strongly.**

54 comparable cells: **P=43**, Z=2, N=9 — the strongest survival of any
dimension, and the reason `P/|C|` clears the 2/3 supermajority at all. Per
basis: `formatjs-b100` **9P/0N**, `polylith-b250` 8P/1N, `polylith-b100` 7P/1N,
`syncpack-b100` 7P/2N, `syncpack-b250` 7P/2N, `formatjs-b250` 5P/3N.

Named reversals, both syncpack bases in the same class:
- `syncpack-b250` `has E4` (static-edge): emitted **9/14 (64.3%)** < omitted **46/59 (78.0%)**, −13.7pp;
- `syncpack-b100` `has E4`: emitted **11/19 (57.9%)** < omitted **75/108 (69.4%)**, −11.5pp;
- `polylith-b250` `no E4`: emitted **3/15 (20.0%)** < omitted **11/38 (28.9%)**, −8.9pp;
- `syncpack-b250` `no preregistered exposure`: emitted **0/13** < omitted **3/437**, −0.7pp.

Note this dimension carries 54 of the 94 comparable cells because exposure is
multi-label — six strata per relationship. It therefore dominates the pooled
count. That weighting is a consequence of the frozen §4 rule, not a choice made
after seeing results, and it is why the per-dimension breakdown above is
reported alongside the pooled tally rather than replaced by it.

### 6. Does the answer differ materially by repository/basis? — **Yes, decisively.**

| Basis | Comparable | P | Z | N |
| -- | --: | --: | --: | --: |
| `syncpack-b100` | 17 | 10 | 0 | **7** |
| `syncpack-b250` | 17 | 9 | 3 | **5** |
| `formatjs-b100` | 16 | 13 | 3 | **0** |
| `formatjs-b250` | 12 | 6 | 0 | **6** |
| `polylith-b100` | 15 | 12 | 0 | 3 |
| `polylith-b250` | 17 | 14 | 0 | 3 |

`formatjs-b100` has **zero** reversals in 16 comparable cells. `formatjs-b250`
is an exact **6–6 split**. The two syncpack bases carry 12 of the 24 reversals
in 34 of the 94 cells. META-375's `MIXED_BY_REPOSITORY_OR_BASIS` heterogeneity
survives conditioning intact — conditioning did not resolve it, it sharpened it.

---

## Composition test (Phase 6)

The emitted and omitted populations do **not** occupy the same strata. Total
variation distance between their stratum mixes (0 = identical, 1 = disjoint):

| Basis | D3 role pair | D4 existence | D5 age | D6 persistence |
| -- | --: | --: | --: | --: |
| `syncpack-b100` | 0.465 | 0.335 | 0.418 | 0.628 |
| `syncpack-b250` | 0.510 | 0.299 | 0.547 | 0.384 |
| `formatjs-b100` | 0.466 | 0.110 | 0.308 | 0.558 |
| `formatjs-b250` | 0.407 | 0.206 | 0.452 | 0.748 |
| `polylith-b100` | 0.391 | 0.047 | 0.185 | 0.173 |
| `polylith-b250` | 0.203 | 0.249 | 0.257 | 0.219 |

(D7 is multi-label; its shares do not sum to 1, so TVD is not defined and is
reported as `null` in `tables/composition.json`.)

Composition differences are **large and present everywhere** — the top-50 is a
systematically different population from the tail on every dimension. That is a
necessary condition for a composition explanation, and it is satisfied.

It is not a sufficient one. If composition were the whole story, the advantage
would vanish within strata; it does not, at four of six bases. So: composition
is a **real and substantial contributor** that fully accounts for the syncpack
reversals, and **not** a complete explanation of the corpus.

---

## Joint strata (Phase 5)

The three joint views were frozen in ANALYSIS-PLAN §8 before any recurrence
result existed. They do not enter the §7 arithmetic. Full cells are in
`JOINT-STRATA-RESULTS.md`.

| View | Comparable | P | Z | N |
| -- | --: | --: | --: | --: |
| J1 role pair × age bucket | 6 | **1** | 2 | **3** |
| J2 role pair × existence state | 6 | 2 | 2 | 2 |
| J3 age bucket × persistence X/Y | 12 | 5 | 4 | 3 |

**This must be stated plainly: the joint views do not corroborate survival.**
Across all three, 8 of 24 comparable cells favour emitted, 8 are exactly equal,
and 8 favour omitted. J1 — the tightest like-with-like comparison in the study —
is net negative (1 vs 3).

Two readings are available and this corpus cannot separate them:

1. the advantage really is largely compositional, and the one-dimensional
   survival is residual confounding that the joint views strip out; or
2. the joint cells are so few (24 comparable cells out of 600 non-empty joint
   cells at the six held-out bases) and so small that they are dominated by
   sampling noise.

Only **6** joint cells clear the threshold in J1 and J2 — from 292 and 232
non-empty cells respectively. The preregistration anticipated exactly this and
is why the joint views were excluded from the disposition arithmetic in advance.
This is a genuine limit of the corpus, recorded rather than resolved.

---

## Preregistered sensitivity view

ANALYSIS-PLAN §2 froze `overlapAll` as a secondary view, reported separately and
never pooled with the primary:

| Outcome | \|C\| | P | Z | N | Disposition under §7 |
| -- | --: | --: | --: | --: | -- |
| `overlapUsable` (**primary**) | 94 | 64 | 6 | 24 | `MIXED_CONDITIONAL_EFFECTS` |
| `overlapAll` (sensitivity) | 94 | 79 | 3 | 12 | `SEPARATION_SURVIVES_CONDITIONING` |

**The two measures disagree on the disposition.** That divergence is itself a
finding and is reported, not suppressed.

The primary stands, for the reason it was made primary before any result was
computed: `overlapUsable` is the measure behind META-375's headline 6/6.
`overlapAll` additionally counts bulk, release, revert, and dependency
transactions. META-375 already recorded that formatjs's post-basis history is
71–168 dependency bumps per window; such a transaction touches many manifests
and locks at once, mechanically manufacturing co-touch for exactly the
relationships the top-50 ranks highest. `overlapAll` is therefore the looser
measure, and its stronger result should not be read as corroboration.

The honest summary: **the conditioning answer is sensitive to the held-out
transaction filter**, which is an additional reason not to treat this
exploratory result as settled.

---

## What this establishes

- Under the frozen threshold, the top-50 held-out recurrence advantage is
  **neither universal nor abolished** once like relationships are compared with
  like: 64 comparable strata favour emitted, 24 favour omitted, 6 tie.
- The reversals are **structured, not random**. They concentrate at syncpack, in
  the freshest age buckets, in `BOTH_CURRENT`, and in `has E4`.
- A **large part** of the unconditioned advantage is dilution: 37.3% of the
  qualifying population has an absent endpoint and essentially never recurs
  (18 of 2,275), and that dead weight sits disproportionately in the omitted
  tail.
- Repository/basis heterogeneity **survives conditioning** and is sharper after
  it than before.
- Current-tree exposure (D7) is the dimension where separation most persists;
  age (D5) is the dimension where it most fails.

## What this does not establish

- **Nothing about semantic coupling, consequentiality, impact, dependency,
  required companion edits, correctness, or agent usefulness.** The outcome is
  an observational co-touch overlap in a held-out window and nothing else.
- Not that rank/support "works" or "does not work". `MIXED_CONDITIONAL_EFFECTS`
  is a statement about measured separation across strata, not about the
  projection's value.
- Not which class matters to an agent. No class is identified as consequential,
  noisy, high-priority, risky, or impactful, and no such label is introduced.
- Not a generalized workspace.json claim. Every pattern here was discovered on a
  corpus whose aggregate answer was already known.
- Not a role-pair result. D3 is too sparse in this corpus to answer.
- Not a stable answer under a different held-out transaction filter — the
  primary and secondary measures disagree.

## Replication status

**An out-of-sample replication is warranted, and is the only way any pattern
here becomes a claim.**

The two candidates worth freezing, in priority order:

1. **Endpoint-existence dilution (D4).** Does the emitted advantage reverse
   within `BOTH_CURRENT` in a repository not in this corpus? The syncpack
   reversal (−10.2pp, −30.7pp) is the strongest and most mechanically explicable
   signal found.
2. **Age-bucket failure (D5).** Does the emitted advantage fail within age
   buckets out of sample? This is the only dimension net-negative here.

Binding constraint: the same nine META-375 bases **may not** both discover and
confirm these. A replication needs unseen historical bases and/or unseen
repositories, preregistered before measurement, in a separate issue.

## META-376 status

**BLOCKED.** Unchanged by this issue.

`MIXED_CONDITIONAL_EFFECTS` does not earn a causal agent experiment. It weakens
rather than strengthens the case: the aggregate separation META-376 would have
leaned on is partly compositional, reverses at a third of the corpus, and is
sensitive to the transaction filter. Nothing here authorizes a schema change, a
producer change, a ranking or cap change, filtering any class of relationship,
or an agent run.

## Validation

`scripts/checks.mjs` — **12/12 invariants PASS, 5/5 red tests CAUGHT**. Each red
test additionally proves its perturbation actually moved the quantity its paired
checker reads; an inert perturbation is reported as `INVALID`, not as a pass.
Details in `RECEIPT.md`.
