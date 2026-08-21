# FIBERY RECONCILIATION DRAFT — OQ-13

**Target:** Fibery OQ-13 — *Does the current global top-50 held-out recurrence
advantage survive when relationships are conditioned on descriptive
characteristics observable at T0?*

**Execution:** Linear META-377. **Evidence:**
`workspacejson/cli` → `docs/evidence/meta-377/`.
**Input:** META-375 @ `0af756a18cf376ee5b7063a98ce63deb2ad97ff4` (immutable).

This is a draft for a human to apply to OQ-13. It does not claim Fibery has been
updated.

---

## Exact disposition

## `MIXED_CONDITIONAL_EFFECTS`

Reached mechanically under a disposition rule frozen at commit `f09a1c96` before
any conditioned recurrence rate was computed.

**OQ-13 is answered as: partially.** The advantage survives conditioning in most
comparable strata but reverses in a structured, repository-correlated minority.
It is neither universal nor abolished.

## Exact denominators

**Population.** 9,203 relationships, nine repository × basis pairs. Recurrence
denominator: the six bases with a non-empty frozen held-out window (6,103
relationships). The three pin bases (3,100 relationships) have an empty window
by definition and contribute zero recurrence observations.

**Disposition arithmetic** — comparable cells (emitted N ≥ 10 **and** omitted
N ≥ 10) across D3–D7 at the six held-out bases:

| | |
| -- | --: |
| Comparable cells \|C\| | 94 |
| emitted > omitted (P) | 64 |
| emitted = omitted (Z) | 6 |
| emitted < omitted (N) | 24 |
| Bases contributing (B) | 6 / 6 |
| P/\|C\| | 0.681 |
| N/\|C\| | 0.255 |

Branch 2 (`SEPARATION_SURVIVES_CONDITIONING`) required `N/|C| ≤ 1/6`. At 0.255
it fails. Branch 3 (`SEPARATION_EXPLAINED_BY_COMPOSITION`) required
`P/|C| ≤ 1/2`. At 0.681 it fails. Fallback taken.

**Per basis:**

| Basis | Comparable | P | Z | N |
| -- | --: | --: | --: | --: |
| `syncpack-b100` | 17 | 10 | 0 | 7 |
| `syncpack-b250` | 17 | 9 | 3 | 5 |
| `formatjs-b100` | 16 | 13 | 3 | 0 |
| `formatjs-b250` | 12 | 6 | 0 | 6 |
| `polylith-b100` | 15 | 12 | 0 | 3 |
| `polylith-b250` | 17 | 14 | 0 | 3 |

**Per dimension:** D3 role pair 7 cells (4/1/2) · D4 existence 10 (6/1/3) ·
D5 age 13 (5/1/**7**) · D6 persistence 10 (6/1/3) · D7 exposure 54 (43/2/9).

## Supported observations

1. **The advantage does not disappear under conditioning.** 64 of 94 comparable
   strata still favour emitted relationships.

2. **Endpoint-existence dilution is a real and large contributor.** 515 held-out
   recurrence observations exist across the six bases; **497 (96.5%)** are
   `BOTH_CURRENT`. 2,275 of 6,103 relationships (37.3%) have an absent endpoint
   and only 18 of those ever recur. That dead weight sits disproportionately in
   the omitted tail — at `syncpack-b250`, 599 of 734 omitted relationships
   (81.6%) have both endpoints absent and none recur.

3. **Emitted and omitted populations are compositionally different everywhere.**
   Total variation distance between their stratum mixes ranges 0.047–0.748
   across bases and single-label dimensions. Composition is a necessary
   condition for a composition explanation, and it holds.

4. **Current-tree exposure is where separation most persists** (43 of 54
   comparable cells favour emitted).

5. **Repository/basis heterogeneity survives conditioning and sharpens.**
   META-375's `MIXED_BY_REPOSITORY_OR_BASIS` is not resolved by conditioning.

## Negative and reversal findings

These are the load-bearing negatives and must not be dropped in summary:

1. **Within `BOTH_CURRENT`, both syncpack bases reverse.**
   `syncpack-b250`: emitted **9/20 (45.0%)** < omitted **56/74 (75.7%)**,
   **−30.7pp**. `syncpack-b100`: emitted **11/21 (52.4%)** < omitted
   **82/131 (62.6%)**, **−10.2pp**. The other four bases survive
   (+3.5pp to +58.9pp).

2. **Age (D5) is net negative across the corpus:** 5 survivals, 7 reversals.
   Largest reversal in the study: `syncpack-b250` bucket `0-24`, emitted
   **9/20 (45.0%)** < omitted **13/17 (76.5%)**, **−31.5pp**. Both syncpack
   bases reverse in *every* comparable age cell (0P/2N each).

3. **The joint views do not corroborate survival.** Across J1–J3, 8 of 24
   comparable cells favour emitted, 8 tie, 8 favour omitted. J1 (role pair ×
   age) — the tightest like-with-like view — is net negative, 1 vs 3. Only 24 of
   600 non-empty joint cells clear the threshold, so this is equally consistent
   with real compositional explanation and with sampling noise. The corpus
   cannot separate the two.

4. **The result is sensitive to the held-out transaction filter.** The
   preregistered secondary measure `overlapAll` reaches
   `SEPARATION_SURVIVES_CONDITIONING` (P=79, Z=3, N=12) where the primary
   `overlapUsable` reaches `MIXED_CONDITIONAL_EFFECTS`. `overlapAll` counts
   bulk, release, revert, and dependency transactions — a dependency bump
   touches many manifests and locks at once, mechanically manufacturing
   co-touch for exactly the relationships the top-50 ranks highest. The primary
   stands, but the disagreement qualifies the whole result.

5. **The role-pair question (D3) is unanswerable on this corpus.** Only 7
   comparable cells across six bases; `source↔source` is comparable at exactly
   one basis. The cap makes 50 emitted relationships cover 27 role pairs, so
   most role strata are `OMITTED_ONLY` by construction.

6. **`formatjs-b250` splits exactly 6–6.** `formatjs-b100` has zero reversals in
   16 cells. Adjacent bases in the same repository behave differently.

## What remains unresolved

- **Which explanation dominates.** Composition contributes materially and fully
  accounts for the syncpack reversals, but does not account for the corpus. The
  joint views point toward a stronger compositional reading; their denominators
  are too thin to establish it.
- **Whether the reversals generalize.** Every pattern here was found on a corpus
  whose aggregate answer was already known. None is a claim.
- **Whether rank/support adds anything beyond freshness and endpoint liveness.**
  Age conditioning removes most of the advantage; existence conditioning removes
  or reverses it at syncpack. This corpus cannot isolate a residual rank effect.
- **Anything semantic.** The outcome is observational co-touch overlap. Nothing
  here speaks to coupling, consequentiality, impact, dependency, required
  companion edits, correctness, or agent usefulness — and no such label was
  introduced.

## Is an out-of-sample replication warranted?

**Yes.** It is the only route from candidate to claim.

Two candidates, priority order:

1. **Endpoint-existence dilution (D4).** Does the emitted advantage reverse
   within `BOTH_CURRENT` in an unseen repository? Strongest and most
   mechanically explicable signal found.
2. **Age-bucket failure (D5).** Does the advantage fail within age buckets out
   of sample? The only net-negative dimension here.

**Binding constraint:** the same nine META-375 bases may not both discover and
confirm these. A replication requires unseen historical bases and/or unseen
repositories, preregistered before measurement, in a separate issue. This issue
is exploratory hypothesis generation and nothing more.

## META-376 status

**META-376 remains BLOCKED.**

`MIXED_CONDITIONAL_EFFECTS` does not earn a causal agent experiment. It weakens
the case rather than strengthening it: the aggregate separation META-376 would
have relied on is partly compositional, reverses in a third of comparable
strata, reverses systematically at one of three repositories, is not corroborated
by the joint views, and flips disposition under an alternative held-out
transaction filter.

Nothing in META-377 authorizes a workspace.json schema change, a producer
change, a ranking or cap change, filtering any class of relationship, adding any
consequentiality/noise/priority/risk/impact label, or an agent run.

## Related questions

**OQ-12** (planning headroom) is untouched by this result and remains separate.
