# REPORT — META-378

**Do the two strongest conditional patterns discovered in META-377 reproduce on
unseen historical bases and/or unseen repositories under a preregistered
protocol?**

Confirmatory replication. Owns execution for Fibery **OQ-14**. No model run, no
maintainer contacted, no change to workspace.json semantics, producer behavior,
ranking, cap, thresholds, age buckets, or transaction filters.

---

## Overall disposition

# `NEITHER_PATTERN_REPLICATES`

| Component | Disposition |
| -- | -- |
| **R1** endpoint-existence dilution/reversal | **`R1_NOT_REPLICATED`** |
| **R2** age-conditioned reversal | **`R2_NOT_REPLICATED`** |

Both reached mechanically by rules frozen at
`c95f7f9001bc80453af39da784d894e984b6ff87`, before any repository was selected
and before any recurrence result existed.

**Replication scope: `CROSS_REPOSITORY_REPLICATION`.** All five repositories are
absent from the META-375 corpus and no new basis was taken inside any prior
repository, so there is no temporal-only component and nothing is pooled across
scopes.

---

## What was tested

META-377 closed `MIXED_CONDITIONAL_EFFECTS` on the nine META-375 bases
(|C|=94, P=64, Z=6, N=24) and named two patterns as its strongest candidates:

| | Discovery observation |
| -- | -- |
| **R1** | Within `BOTH_CURRENT`, both syncpack bases reversed — `syncpack-b100` emitted 11/21 (52.4%) < omitted 82/131 (62.6%), −10.2pp; `syncpack-b250` emitted 9/20 (45.0%) < omitted 56/74 (75.7%), −30.7pp. The other four bases survived. |
| **R2** | D5 was net negative: 5 positive, 1 tie, 7 negative across 13 comparable cells. Both syncpack bases reversed in every comparable age cell. Largest reversal `syncpack-b250` `0-24`, emitted 9/20 (45.0%) < omitted 13/17 (76.5%), −31.5pp. |

META-377 was exploratory on a corpus whose aggregate answer was already known,
so neither was a claim. META-378 tests them where they cannot be circular.

## Cohort

Five unseen repositories, one per frozen language stratum, selected by ascending
`sha256(seed + ":" + full_name)` over a committed 3,823-record universe
snapshot:

| Stratum | Repository | Rank taken | First-parent commits |
| -- | -- | --: | --: |
| TypeScript | `nteract/hydrogen` | 4 | 1,324 |
| Rust | `thepowersgang/rust_os` | 1 | 1,907 |
| Clojure | `clojure/core.typed` | 1 | 2,615 |
| Go | `hyperledger/fabric` | 1 | 9,284 |
| Python | `scikit-image/scikit-image` | 1 | 3,812 |

15 bases, 5,509 relationships. The five pin bases (1,958 relationships) carry an
empty held-out window by definition and contribute zero recurrence
observations. **10 recurrence-contributing bases, 3,551 relationships** — against
six bases in discovery.

Backfill fired three times, all in TypeScript, all for the mechanical §7 V3
first-parent-count bound frozen before selection. Every skip is recorded.

## Unconditioned reference point

Primary outcome `overlapUsable`:

| Basis | Emitted | Omitted | Diff |
| -- | --: | --: | --: |
| `coretyped-b100` | 0/50 (0.0%) | 1/468 (0.2%) | −0.2pp |
| `coretyped-b250` | 13/50 (26.0%) | 7/466 (1.5%) | +24.5pp |
| `fabric-b100` | 14/50 (28.0%) | 12/444 (2.7%) | +25.3pp |
| `fabric-b250` | 36/50 (72.0%) | 23/129 (17.8%) | +54.2pp |
| `hydrogen-b100` | 0/50 (0.0%) | 0/302 (0.0%) | +0.0pp |
| `hydrogen-b250` | 3/50 (6.0%) | 6/302 (2.0%) | +4.0pp |
| `rustos-b100` | 8/50 (16.0%) | 13/240 (5.4%) | +10.6pp |
| `rustos-b250` | 19/50 (38.0%) | 56/272 (20.6%) | +17.4pp |
| `scikitimage-b100` | 15/50 (30.0%) | 14/153 (9.2%) | +20.8pp |
| `scikitimage-b250` | 20/50 (40.0%) | 39/275 (14.2%) | +25.8pp |

Emitted exceeds omitted at 8 of 10 bases, ties at one, and trails at one by
0.2pp on a single omitted recurrence. This is the baseline the conditioning
tests operate against.

---

## R1 — endpoint existence: `R1_NOT_REPLICATED`

**K = 9** comparable `BOTH_CURRENT` bases · **Rv = 0** reversals · **At = 1**
attenuations. `Rv/K = 0.000`, `At/K = 0.111`.

| Basis | Emitted | Omitted | `d_cond` | `d_uncond` |
| -- | --: | --: | --: | --: |
| `coretyped-b250` | 13/39 (33.3%) | 7/340 (2.1%) | **+31.3pp** | +24.5pp |
| `fabric-b100` | 14/50 (28.0%) | 12/444 (2.7%) | **+25.3pp** | +25.3pp |
| `fabric-b250` | 36/41 (87.8%) | 23/91 (25.3%) | **+62.5pp** | +54.2pp |
| `hydrogen-b100` | 0/21 (0.0%) | 0/72 (0.0%) | **+0.0pp** | +0.0pp |
| `hydrogen-b250` | 3/20 (15.0%) | 6/78 (7.7%) | **+7.3pp** | +4.0pp |
| `rustos-b100` | 8/50 (16.0%) | 13/231 (5.6%) | **+10.4pp** | +10.6pp |
| `rustos-b250` | 19/48 (39.6%) | 56/268 (20.9%) | **+18.7pp** | +17.4pp |
| `scikitimage-b100` | 15/23 (65.2%) | 14/48 (29.2%) | **+36.1pp** | +20.8pp |
| `scikitimage-b250` | 18/23 (78.3%) | 38/244 (15.6%) | **+62.7pp** | +25.8pp |

Branch 1 (`K < 4`) did not fire — nine comparable bases against discovery's six.
Branch 2 required `Rv/K >= 1/3`, the rate discovery itself produced; the
replication produced **zero reversals in nine bases**. Branch 3 fired.

**Not one comparable base reverses.** In six of nine the conditioned difference
is *larger* than the unconditioned one, in two identical, in one marginally
smaller (`rustos-b100`, +10.4pp vs +10.6pp). Conditioning on endpoint existence
does not attenuate the advantage out of sample — if anything it sharpens it,
which is the opposite of the dilution mechanism discovery proposed.

`coretyped-b100` is excluded from K: it carries one emitted `BOTH_CURRENT`
relationship against 51 omitted, below the frozen threshold. It remains in the
denominator and is reported.

## R2 — age: `R2_NOT_REPLICATED`

**C2 = 16** comparable cells · **P2 = 12** · **Z2 = 2** · **N2 = 2**.
`P2/C2 = 0.750`.

Branch 1 (`C2 < 8`) did not fire — 16 comparable cells against discovery's 13.
Branch 2 required `N2 >= P2`; the result is 12 positive against 2 negative, the
reverse of discovery's 5-versus-7. Branch 3 fired.

The two negative cells:

| Basis | Bucket | Emitted | Omitted | Diff |
| -- | -- | --: | --: | --: |
| `scikitimage-b250` | `0-24` | 9/33 (27.3%) | 32/78 (41.0%) | **−13.8pp** |
| `fabric-b100` | `0-24` | 6/12 (50.0%) | 9/17 (52.9%) | **−2.9pp** |

Both are isolated — neither repository reverses in any other bucket, and no
basis reverses more than once. Discovery's signature was the opposite: *both*
syncpack bases reversing in *every* comparable age cell.

The largest positive cells run the other way: `scikitimage-b250` `25-99`
+72.2pp (10/13 vs 1/21), `fabric-b250` `0-24` +41.2pp (35/35 vs 20/34),
`fabric-b100` `25-99` +33.3pp (4/12 vs 0/26).

**Out of sample the emitted advantage persists within like-aged strata.**

---

## Transaction-filter sensitivity

| | `overlapUsable` (PRIMARY) | `overlapAll` (secondary) |
| -- | -- | -- |
| R1 | **`R1_NOT_REPLICATED`** (K=9, Rv=0, At=1) | `R1_INDETERMINATE` (K=9, Rv=2, At=3) |
| R2 | **`R2_NOT_REPLICATED`** (C2=16, P2=12, Z2=2, N2=2) | `R2_INDETERMINATE` (C2=16, P2=9, Z2=3, N2=4) |
| Composite | **`NEITHER_PATTERN_REPLICATES`** | `INSUFFICIENT_REPLICATION_SUPPORT` |

**The sensitivity META-377 found does persist out of sample — the filter choice
still changes the answer.** But its direction does not carry over. In discovery
`overlapAll` produced the stronger result; here it produces the weaker one, with
both components falling to `INDETERMINATE`.

The magnitude shift is not subtle. `overlapAll` admits bulk, release, revert, and
dependency transactions, which mechanically manufacture co-touch: at
`coretyped-b250` the omitted recurrence rate rises from 1.5% to 72.3%; at
`fabric-b100` from 2.7% to 65.1%. Under `overlapAll` two `BOTH_CURRENT` cells
reverse (`coretyped-b250` −1.7pp, `fabric-b100` −13.1pp) where none reversed
under the primary.

So the sensitivity is a **stable property of the measurement, not of the
finding**. That argues for keeping the two filters permanently separate, and
against ever reading whichever looks cleaner as the result. The primary stands;
it was designated primary before any result existed and is not displaced in
either direction.

Full detail: `TRANSACTION-FILTER-SENSITIVITY.md`.

---

## Why this is a negative replication rather than a null result

Both patterns were tested with **more** support than they were discovered with —
nine comparable R1 bases against six, sixteen comparable R2 cells against
thirteen — across five repositories in five languages, none of which supplied the
discovery signal. The bars were set at the discovery effect sizes and named as
such before outcomes. Neither pattern approached its bar; both failed in the
direction opposite to the discovery claim.

The most likely reading, which this issue cannot confirm, is that both META-377
patterns were **syncpack-specific**. Discovery's `MIXED_CONDITIONAL_EFFECTS` was
driven overwhelmingly by the two syncpack bases: they carried 12 of the 24
reversals in 34 of 94 comparable cells, and both R1 reversals and every R2
reversal-in-all-cells came from them. A pattern concentrated in one repository of
three is exactly the kind that fails to generalize, and it did.

## What this establishes

- Under the preregistered protocol, on five unseen repositories in five
  languages, **neither META-377 conditional pattern reproduces**.
- Conditioning on endpoint existence does not attenuate the emitted recurrence
  advantage out of sample: zero reversals in nine comparable bases, with the
  conditioned difference larger than the unconditioned one in six.
- Conditioning on age does not remove the advantage out of sample: it persists in
  12 of 16 comparable cells.
- The transaction-filter sensitivity is real and persists, but is a property of
  the measurement rather than of any finding.
- META-377's exploratory patterns must not be promoted to generalized claims.

## What this does not establish

- **Nothing about dependency, causality, semantic coupling, required companion
  edits, impact, blast radius, risk, correctness, agent planning value, or any
  reason the standard should tell an agent what to do.** The outcome is
  observational held-out co-touch recurrence and nothing else.
- Not that the top-50 projection is useful, correct, or worth acting on. That the
  emitted advantage survives conditioning here is a statement about measured
  recurrence separation, not about value.
- Not that the syncpack reversals were wrong. They were measured and remain
  measured; they simply do not generalize to this cohort.
- Not a claim about repositories outside the frozen universe. Three of five
  strata were truncated at GitHub's 1,000-result search cap, so the sampling
  frame is the enumerable slice, not the full population.
- Not a result about exposure, persistence, role pairs, or the joint views. Those
  were out of scope by §21 and were not computed.

## Validation

`scripts/checks.mjs` — **15/15 invariants PASS, 7/7 red tests CAUGHT**.

Anti-leak is proven three ways: no confirmation row comes from a discovery
repository, a discovery basis SHA, or a discovery basis label. Red test X1
injects `syncpack-b100` into the confirmation set and is caught.

Measurement compatibility is proven by re-deriving a META-375 basis with the
META-378 harness: **6/6 PASS** on qualifying count (568), emitted count, full
ranking order, support/occurrences, endpoint existence, and age delta.

Details in `RECEIPT.md`.

## META-376 status

**BLOCKED.** Unchanged.

This replication weakens rather than strengthens the case for an agent-value
experiment. The conditional structure META-377 discovered turns out not to
generalize, which means the evidence base is less stable than a single
exploratory result made it look. Nothing here authorizes a schema change, a
producer change, a ranking or cap change, or an agent run.
