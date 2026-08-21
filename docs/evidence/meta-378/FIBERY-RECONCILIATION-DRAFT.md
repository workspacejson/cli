# FIBERY RECONCILIATION DRAFT — OQ-14

**Target:** Fibery **OQ-14** — *Do the two strongest conditional patterns
discovered in META-377 — endpoint-existence dilution/reversal within
`BOTH_CURRENT` and age-conditioned reversal — reproduce on unseen historical
bases and/or unseen repositories under a preregistered protocol?*

**Execution:** Linear META-378. **Evidence:**
`workspacejson/cli` → `docs/evidence/meta-378/`.
**Inputs:** META-375 `@0af756a1…`, META-377 `@59ca94a3…` (both immutable).

---

## Exact disposition

## `NEITHER_PATTERN_REPLICATES`

| Component | Disposition |
| -- | -- |
| **R1** endpoint-existence dilution/reversal | **`R1_NOT_REPLICATED`** |
| **R2** age-conditioned reversal | **`R2_NOT_REPLICATED`** |

**Replication scope: `CROSS_REPOSITORY_REPLICATION`** — five unseen repositories
across five language strata, no temporal-only component, nothing pooled.

**OQ-14 is answered: no.** Neither META-377 pattern reproduces out of sample,
and both fail in the direction opposite to the discovery claim.

Reached mechanically by rules frozen at
`c95f7f9001bc80453af39da784d894e984b6ff87`, before any repository was selected
and before any recurrence result existed.

## Exact denominators

**Cohort.** `nteract/hydrogen` (TypeScript), `thepowersgang/rust_os` (Rust),
`clojure/core.typed` (Clojure), `hyperledger/fabric` (Go),
`scikit-image/scikit-image` (Python). Selected by ascending
`sha256("META-378/OQ-14/replication/v1" + ":" + full_name)` over a committed
3,823-record universe snapshot.

**Population.** 15 bases, 5,509 relationships. Five pin bases (1,958
relationships) carry an empty held-out window by definition and contribute zero
recurrence observations. **10 recurrence-contributing bases, 3,551
relationships** — against six bases in discovery.

### R1 — all nine comparable `BOTH_CURRENT` cells

| Basis | Emitted | Omitted | `d_cond` | `d_uncond` | reversal |
| -- | --: | --: | --: | --: | -- |
| `coretyped-b250` | 13/39 (33.3%) | 7/340 (2.1%) | +31.3pp | +24.5pp | no |
| `fabric-b100` | 14/50 (28.0%) | 12/444 (2.7%) | +25.3pp | +25.3pp | no |
| `fabric-b250` | 36/41 (87.8%) | 23/91 (25.3%) | +62.5pp | +54.2pp | no |
| `hydrogen-b100` | 0/21 (0.0%) | 0/72 (0.0%) | +0.0pp | +0.0pp | no |
| `hydrogen-b250` | 3/20 (15.0%) | 6/78 (7.7%) | +7.3pp | +4.0pp | no |
| `rustos-b100` | 8/50 (16.0%) | 13/231 (5.6%) | +10.4pp | +10.6pp | no |
| `rustos-b250` | 19/48 (39.6%) | 56/268 (20.9%) | +18.7pp | +17.4pp | no |
| `scikitimage-b100` | 15/23 (65.2%) | 14/48 (29.2%) | +36.1pp | +20.8pp | no |
| `scikitimage-b250` | 18/23 (78.3%) | 38/244 (15.6%) | +62.7pp | +25.8pp | no |

**K = 9 · Rv = 0 · At = 1.** `Rv/K = 0.000` against a required 1/3;
`At/K = 0.111` against a required 1/2.

`coretyped-b100` is excluded from K (1 emitted vs 51 omitted, below the frozen
threshold), remains in the denominator, and is reported.

### R2 — 16 comparable age cells

**C2 = 16 · P2 = 12 · Z2 = 2 · N2 = 2.** `P2/C2 = 0.750`. Branch 2 required
`N2 >= P2`; the result is the reverse of discovery's 5-versus-7.

The only two negative cells:

| Basis | Bucket | Emitted | Omitted | Diff |
| -- | -- | --: | --: | --: |
| `scikitimage-b250` | `0-24` | 9/33 (27.3%) | 32/78 (41.0%) | −13.8pp |
| `fabric-b100` | `0-24` | 6/12 (50.0%) | 9/17 (52.9%) | −2.9pp |

## Supported observations

1. **Conditioning on endpoint existence does not attenuate the emitted advantage
   out of sample.** Zero reversals in nine comparable bases. In six of nine the
   conditioned difference is *larger* than the unconditioned one, in two
   identical, in one marginally smaller.

2. **Conditioning on age does not remove the advantage out of sample.** It
   persists in 12 of 16 comparable cells, in several substantially —
   `scikitimage-b250` `25-99` +72.2pp (10/13 vs 1/21), `fabric-b250` `0-24`
   +41.2pp (35/35 vs 20/34).

3. **Both patterns were tested with more support than they were discovered
   with** — nine comparable R1 bases against six, sixteen R2 cells against
   thirteen — and neither approached its bar.

4. **The transaction-filter sensitivity persists but inverts.** In discovery
   `overlapAll` produced the stronger result; here it produces the weaker one
   (both components `INDETERMINATE`, composite
   `INSUFFICIENT_REPLICATION_SUPPORT`). The sensitivity is a property of the
   measurement, not of any finding.

5. **The most likely reading — which this issue cannot confirm — is that both
   META-377 patterns were syncpack-specific.** Discovery's two syncpack bases
   carried 12 of 24 reversals in 34 of 94 comparable cells, and supplied both R1
   reversals and every R2 reverse-in-all-cells basis. A pattern concentrated in
   one repository of three is the kind that fails to generalize, and it did.

## Negative and reversal findings

1. **The headline is itself the negative finding.** Both candidate patterns fail
   to replicate. This is a negative replication, not a null result.

2. `hydrogen-b100` produced **zero** recurrence observations across 352
   relationships under the primary filter. Its cells contribute exact ties
   (`+0.0pp`) rather than being dropped.

3. `coretyped-b100` is the only base excluded from the R1 arithmetic — one
   emitted `BOTH_CURRENT` relationship against 51 omitted.

4. `coretyped-b100` is also the one base where the *unconditioned* emitted rate
   trails the omitted rate (0/50 vs 1/468, −0.2pp) — on a single omitted
   recurrence.

5. Under the secondary `overlapAll` filter, two `BOTH_CURRENT` cells reverse
   (`coretyped-b250` −1.7pp, `fabric-b100` −13.1pp) where none reversed under the
   primary, and negative age cells rise from 2 to 4.

6. Three TypeScript candidates were skipped in selection for the mechanical §7
   V3 first-parent-count bound. All are recorded with their reason.

## What remains unresolved

- **Why the syncpack reversals occurred.** They were measured and remain
  measured; this replication shows only that they do not generalize to this
  cohort. Whether they reflect something specific to that repository's history is
  not established.
- **Whether the emitted advantage means anything.** That it survives conditioning
  here is a statement about measured recurrence separation, not about value,
  usefulness, or planning relevance.
- **Whether any conditional structure exists at all.** META-378 tested two named
  patterns and found neither. It did not search for others, and must not — that
  would turn a confirmatory replication back into an exploratory one.
- **Behaviour outside the frozen universe.** Three of five strata were truncated
  at GitHub's 1,000-result search cap, so the sampling frame is the enumerable
  slice, not the full population.

## Is a further replication warranted?

**Not for R1 or R2.** Both were preregistered, tested with more support than
discovery had, and failed. Re-testing them on a third cohort would be searching
for a cohort that agrees, which is exactly what the exploratory/confirmatory
boundary exists to prevent.

The open question this result creates is different and belongs to a separate
issue if anyone wants it: *why* the syncpack bases behaved as they did. That is
diagnostic work on discovery data, not a replication, and it cannot produce a
generalized claim.

## META-376 status

**META-376 remains BLOCKED.**

This replication weakens rather than strengthens the case for an agent-value
experiment. The conditional structure META-377 discovered does not generalize,
which means the evidence base is less stable than a single exploratory result
made it appear.

Nothing in META-378 authorizes a workspace.json schema change, a producer change,
a ranking or cap change, a threshold or bucket change, a transaction-filter
change, filtering any class of relationship, or an agent run.

## Interpretation boundary

Even a fully successful replication would have established only that historical
same-transaction observations show a reproducible conditional pattern in later
observational co-touch recurrence. This one was not successful, and it
establishes nothing about dependency, causality, semantic coupling, required
companion edits, impact, blast radius, risk, correctness, agent planning value,
or any reason the standard should tell an agent what to do.

## Related questions

**OQ-13** (does the top-50 advantage survive class conditioning) was answered
`MIXED_CONDITIONAL_EFFECTS` by META-377 on discovery data. OQ-14's negative
result means OQ-13's conditional patterns should not be carried forward as
generalized claims. **OQ-12** (planning headroom) is untouched.
