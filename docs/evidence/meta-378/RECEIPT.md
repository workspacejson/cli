# RECEIPT — META-378

**Date:** 2026-08-21. **Scope:** execution record — environment, freeze chain,
validation, red tests, deviations. Findings: `REPORT.md`.

## Environment

| | |
| -- | -- |
| Host | darwin arm64 |
| Node | v22.19.0 |
| Miner | `@workspacejson/mining-core`, git tree `1ab4f087a39f4526d49484e7260b080443d217f9` |
| Miner compatibility | byte-identical to the META-310 producer pin `031c3504a0977b8d90ac518c82a39a2f4ec741a9` used by META-375 |
| Network | GitHub Search API (universe snapshot) and `git clone` only |
| Model runs | none |
| Maintainers contacted | none |

## Freeze chain

Verifiable from `git log`, not from this file's assertion.

| Step | Commit | What it established |
| -- | -- | -- |
| META-375 input | `0af756a18cf376ee5b7063a98ce63deb2ad97ff4` | discovery corpus (read-only, anti-leak protected) |
| META-377 input | `59ca94a37b05f33d556e9fcd28bf6197648dff68` | discovery result and the two candidate patterns |
| **Preregistration** | `c95f7f9001bc80453af39da784d894e984b6ff87` | universe, eligibility, seed, cohort size, verification, miner pin, all measurement definitions, comparability threshold, and the **R1/R2/composite disposition arithmetic** — before any repository was selected |
| **Phase A** | `4505ba9001cfd3c1ef3e4e6a480a8393257f89a7` | universe snapshot, cohort, selection receipt, mined characterization, denominator audit — **before any outcome was read** |
| Phase B results | this commit | first held-out recurrence numbers |

Both input SHAs were verified to exist remotely before the preregistration was
written.

## Outcome isolation (PREREGISTRATION §20)

`scripts/phase-a.mjs` writes records carrying no `overlapUsable`, `overlapAll`,
or `heldOut` key, and `assertNoOutcome()` throws if any appears — asserted per
basis and again at the root. `scripts/denominators.mjs` re-asserts on input and
on output. `scripts/phase-b.mjs` is the only script that computes a held-out
ledger.

Invariant **A9** re-proves this over the committed artifacts:
`universe.json`, `ranked-order.json`, `cohort.json`, `phase-a.json`, and
`denominators.json` contain no outcome key.

The cohort, bases, and denominator audit were committed at `4505ba9` before
Phase B ran.

## Anti-leak (PREREGISTRATION §3)

Enforced mechanically at three levels and proven three ways:

1. **Universe** — eligibility predicate `E9` excludes the three discovery
   repositories by exact `full_name`. It fired for real: `formatjs/formatjs` was
   present in the TypeScript universe and `JamieMason/syncpack` in the Rust
   universe, and both were removed. `polyfy/polylith` never appeared under the
   frozen query.
2. **Invariants** — `A1` (no discovery repository), `A1b` (no discovery basis
   SHA, checked against all nine frozen SHAs), `A1c` (no discovery basis label).
3. **Red test** — `X1` injects `syncpack-b100` into the confirmation set and is
   caught.

Discovery data was read exactly once, for the compatibility check below, which
the anti-leak rule permits solely to *verify compatibility*. That basis
contributes no numerator, denominator, sign, or disposition and is not in the
cohort.

## Measurement compatibility with discovery

META-375 mined each basis in a detached worktree; META-378 mines via
`mine(repoRoot, { basisRevision })` against a partial clone. Interchangeable only
if identical, so the META-378 harness re-derived META-375's syncpack −100 basis
and was compared against the committed META-375 evidence.

| Check | Proves | Result |
| -- | -- | -- |
| K1 | identical qualifying population size (568) | PASS |
| K2 | identical emitted count under the frozen cap (50) | PASS |
| K3 | identical rank order across the whole population (0 positions differ) | PASS |
| K4 | identical support and occurrences per pair | PASS |
| K5 | identical endpoint existence — the D4 input R1 depends on | PASS |
| K6 | identical age delta — the D5 input R2 depends on | PASS |

**6/6 PASS.** Replication results are measured on the same footing as discovery.

**This check earned its place.** On first run K6 failed on all 568 pairs: the
META-378 harness derived age from the *minimum* supporting event position, where
META-375 uses `origin − maximum position` (`origin = events.length − 1`). That is
the difference between oldest and newest supporting observation, and it would
have silently corrupted every R2 result. It was found and fixed **before any
outcome was read**, and the fix is recorded as Deviation 1.

## Invariants

`node scripts/checks.mjs` — **15/15 PASS**.

| ID | Proves | Result |
| -- | -- | -- |
| A1 | no confirmation row from a discovery repository | PASS |
| A1b | no confirmation basis SHA matches any of the nine discovery SHAs | PASS |
| A1c | no confirmation basis label matches a discovery label | PASS |
| A2 | cohort selection reproduces from the frozen universe + seed + ordering rule, all five strata | PASS |
| A2b | every selected repository is present in its committed stratum snapshot | PASS |
| A3 | replacement only for mechanical V1–V3 failures (3 skips, all V3) | PASS |
| A4 | miner tree SHA matches the preregistration pin | PASS |
| A5 | emitted status follows the frozen ranking exactly, and rank order obeys support DESC / occurrences ASC / files lexical, all 15 bases | PASS |
| A6 | endpoint existence matches the frozen rule (5,509/5,509) | PASS |
| A7 | age bucket matches the exact recorded age, within `[0,499]` (5,509/5,509) | PASS |
| A8 | primary and secondary filters not conflated — identical denominators, numerators differ somewhere | PASS |
| A8b | `usable ⊆ nonMerge` at every basis | PASS |
| A9 | no outcome key in any pre-outcome artifact | PASS |
| A10 | denominators preserved unchanged through the analysis; D4 and D5 partitions each total the full population | PASS |
| A11 | five pin bases, none contributing a recurrence observation | PASS |

## Red tests

**7/7 CAUGHT.** Each asserts two things and passes only if both hold: the
perturbation actually **moved** the quantity its paired checker inspects, and the
invariant then **fails**. An inert perturbation is reported `INVALID`, never
`PASS`.

| ID | Perturbation | Measured movement | Verdict |
| -- | -- | -- | -- |
| X1 | discovery basis `syncpack-b100` injected into the confirmation set | repo list gains `JamieMason/syncpack` | CAUGHT |
| X2 | cohort membership swapped (Rust selection replaced) | `Rust:thepowersgang/rust_os` → `Rust:someone/else` | CAUGHT |
| X3 | emitted status flipped at `rustos-b250` | emitted vector inverted | CAUGHT |
| X4 | existence state relabelled to `BOTH_CURRENT` at `fabric-b250` | D4 stratum labels collapse to one value | CAUGHT |
| X5 | age bucket relabelled at `scikitimage-b100` | D5 stratum labels collapse to `0-24` | CAUGHT |
| X6 | held-out numerators zeroed at `fabric-b250` | R2 cell numerators `35/35,20/34` → `0/35,0/34` | CAUGHT |
| X7 | secondary `overlapAll` substituted for the primary | `NEITHER_PATTERN_REPLICATES` → `INSUFFICIENT_REPLICATION_SUPPORT`, Rv 0→2, P2 12→9 | CAUGHT |

X7 is the sharpest: it demonstrates that substituting the secondary filter for
the primary changes both component dispositions and the composite, which is
precisely the substitution the preregistration forbids.

**The inert-perturbation guard fired during construction.** X4 initially forced
`existsB = true` while the measure read the derived `existence` label, which had
not been recomputed — so the perturbation changed nothing observable and the test
self-reported `INVALID`. It was rewritten to relabel the D4 stratum directly,
which is what R1 groups on. Recorded as Deviation 2. That the guard caught a real
mistake is the evidence these red tests are not self-confirming.

## Result

| | |
| -- | -- |
| **R1** | `R1_NOT_REPLICATED` — K=9, Rv=0, At=1; `Rv/K=0.000`, `At/K=0.111` (§16 branch 3) |
| **R2** | `R2_NOT_REPLICATED` — C2=16, P2=12, Z2=2, N2=2; `P2/C2=0.750` (§17 branch 3) |
| **Composite** | `NEITHER_PATTERN_REPLICATES` (§18) |
| Secondary `overlapAll` | `R1_INDETERMINATE`, `R2_INDETERMINATE`, `INSUFFICIENT_REPLICATION_SUPPORT` — reported separately, never substituted |

## Artifacts

| File | Content |
| -- | -- |
| `PROTOCOL-REUSE-ASSESSMENT.md` | META-312/313 rule-by-rule disposition |
| `PREREGISTRATION.md` | frozen protocol and disposition arithmetic |
| `UNIVERSE-RECEIPT.md` | snapshot identity, strata, eligibility, anti-leak firing |
| `SELECTION-RECEIPT.md` | seed, ranked order, cohort, backfill attempts, compatibility check |
| `DENOMINATOR-AUDIT.md` | R1 and R2 cell classes, all 15 bases, pre-outcome |
| `R1-ENDPOINT-EXISTENCE.md` | R1 cells and disposition |
| `R2-AGE.md` | every populated age cell and disposition |
| `TRANSACTION-FILTER-SENSITIVITY.md` | secondary view and required answers |
| `NEGATIVE-SPARSE-RESULTS.md` | excluded, sparse, zero-recurrence, and pin results |
| `REPORT.md` | findings and boundaries |
| `FIBERY-RECONCILIATION-DRAFT.md` | OQ-14 draft |
| `MANIFEST.json` | SHA-256 of every META-378 artifact |
| `raw/universe.json` | 3,823 repository records, verbatim |
| `raw/ranked-order.json` | eligibility outcome and frozen ranked order |
| `raw/cohort.json` | verification attempts, selected cohort, basis SHAs |
| `raw/phase-a.json` | per-relationship records, outcome-free |
| `raw/ledgers.json` | held-out transaction ledgers |
| `raw/compat-check.json` | compatibility check result |
| `tables/denominators.json` | machine-readable cell classes |
| `tables/results.overlapUsable.json` | primary results and disposition arithmetic |
| `tables/results.overlapAll.json` | secondary results |
| `scripts/` | `universe`, `select-cohort`, `verify-and-freeze`, `phase-a`, `denominators`, `render-phase-a`, `compat-check`, `phase-b`, `render-results`, `checks`, `manifest` |

## Rerun

```
bash docs/evidence/meta-378/rerun.sh <workDir>
```

Selection reproduces from the committed `raw/universe.json` without touching the
GitHub API. Mining requires clones of the five cohort repositories at the frozen
basis SHAs; `rerun.sh` clones them if absent. Re-materializing the universe from
the live API is a separate opt-in step and will not reproduce the snapshot,
because GitHub result sets drift — that is why the snapshot is committed.

## Deviations

1. **Age-derivation bug found by the compatibility check and fixed before any
   outcome was read.** The first version of `phase-a.mjs` derived age from the
   minimum supporting event position; META-375 uses `origin − maximum position`.
   Compatibility check K6 failed on all 568 reference pairs, the harness was
   corrected, and K6 then passed at 0 differences. No outcome had been computed
   at any point during this, so no result could have been steered by it. The
   frozen age-bucket definition in §13 was not changed — only the harness was
   made to implement it correctly.

2. **Red test X4 rewritten during construction.** Its first form forced
   `existsB = true` while its measure read the derived `existence` label, so the
   perturbation was inert and the test self-reported `INVALID`. Rewritten to
   relabel the D4 stratum directly, which is the quantity R1 groups on. The
   perturbation was not weakened; the measure was corrected to observe what the
   analysis actually uses.

3. **Universe truncated at GitHub's search cap in three strata.** TypeScript
   (2,012), Go (1,408), and Python (2,358) exceed the hard 1,000-result cap. The
   universe is defined in §5 as exactly the enumerable slice, and that limit was
   fixed before selection. It bounds the sampling frame and is stated as such in
   `UNIVERSE-RECEIPT.md` and in `REPORT.md`'s boundaries. Not a departure from
   the plan — a limit the plan anticipated and named.

4. **Count in the Phase A commit message.** The `4505ba9` commit message states
   5,489 relationships; the correct figure is **5,509**, as recorded in
   `phase-a.json`, `DENOMINATOR-AUDIT.md`, and every downstream artifact. The
   commit message is immutable; the figure everywhere else is correct.

5. **Partial (`--filter=blob:none`) clones.** Cohort repositories were cloned
   blobless for speed. Commit topology, tree listings, and `--name-status` diffs
   — everything the miner and the existence rule read — are complete; only file
   contents are fetched lazily, and no META-378 computation reads file content.
   The compatibility check confirms a partial clone reproduces META-375's
   full-clone result exactly (6/6 PASS).

No repository, basis, stratum, threshold, bucket, filter, or disposition rule was
added, removed, substituted, or retuned after any recurrence result was observed.
No entity was replaced for any non-mechanical reason. No stop condition fired.
