# ANALYSIS-PLAN — META-377

**Frozen before any class-conditioned held-out recurrence rate is computed.**
This file is committed on its own, ahead of the commit that adds any result.
The commit that introduces this file is the freeze point; the git history is
the proof.

## 0. Exploratory status — stated up front

META-375's aggregate result is already known: emitted held-out recurrence
exceeded omitted held-out recurrence at **6 / 6** bases with a held-out window.
META-377 was designed with that knowledge.

This is therefore **exploratory decomposition on a corpus whose aggregate answer
is already visible**, not a blind confirmatory study, and this document does not
claim otherwise. What it can still do honestly is fix every grouping rule,
threshold, joint view, and disposition rule *before* any conditioned rate is
calculated, so the conditioning result cannot be steered after the fact. That is
the whole purpose of the freeze.

Consequence, binding on the report: no interaction discovered here may be
promoted to a generalized workspace.json claim. Anything interesting is a
**candidate for a separately preregistered replication against unseen bases
and/or repositories**. The same nine META-375 bases may not both discover and
confirm a conditional relationship.

## 1. Question

> Does the current global top-50 held-out recurrence advantage survive when
> relationships are conditioned on descriptive characteristics observable at T0?

Fibery OQ-13 owns the durable question. Linear META-377 owns this execution.

## 2. Unit, population, outcome

**Unit.** One relationship at one frozen repository × basis.

**Population.** The 9,203 META-375 relationships across nine bases, pinned by
`INPUT-RECEIPT.md` at `0af756a18cf376ee5b7063a98ce63deb2ad97ff4`.

**Recurrence denominator.** Only the **six** bases with a non-empty frozen
held-out window: `syncpack-b100`, `syncpack-b250`, `formatjs-b100`,
`formatjs-b250`, `polylith-b100`, `polylith-b250` — 6,103 relationships.

The three **pin** bases (`syncpack-pin`, `formatjs-pin`, `polylith-pin`;
3,100 relationships) have zero held-out transactions **by definition**
(META-375 PREREGISTRATION §13: the window is `(basis, pin]`). They remain in the
population/denominator audit and contribute **exactly zero** recurrence
observations. A validation check enforces this.

**Outcome (frozen, primary).** `heldOut.overlapUsable` — both endpoints appeared
together in at least one *usable* observed subsequent changed-file set under
META-375's frozen held-out transaction rule. This is the measure behind
META-375's headline 6/6, so it is the measure META-377 must condition.

**Outcome (frozen, secondary sensitivity).** `heldOut.overlapAll`, reported
separately and never pooled with the primary. META-375 flagged that formatjs's
all-transaction rates are dominated by dependency-bump traffic; that caveat
carries over unchanged.

**Naming discipline.** The outcome is an *observational co-touch overlap*. It is
never described as impact, required edit, dependency, correctness, consequence,
prediction ground truth, or agent usefulness.

## 3. Allowed conditioning dimensions — exhaustive

Only these seven, all recorded by META-375 and observable at T0:

| | Dimension | Source field |
| -- | -- | -- |
| D1 | repository | basis label prefix |
| D2 | historical basis | basis label |
| D3 | endpoint-role pair | `roleA.role`, `roleB.role` |
| D4 | endpoint-existence state at T0 | `existsA`, `existsB` |
| D5 | age bucket | `mostRecentSupport.deltaPos` |
| D6 | persistence X/Y | `subwindowPresence` |
| D7 | current-tree exposure state | `exposure`, `noPreregisteredExposure` |

**Prohibited in this issue, without exception:** authorship; bot detection; AI
authorship; inferred commit purpose; squash-merge reconstruction; any new path,
semantic, or static analysis; any new role taxonomy; recency weighting;
normalized support; learned ranking; higher-order transaction rules. These
remain candidate variables owned by other issues.

No variable outside D1–D7 enters any table in this issue.

## 4. Canonical grouping rules — frozen

### D1/D2 repository and basis

Primary analysis is **per basis** throughout. Repository is the basis-label
prefix. Bases are never pooled to manufacture denominator support. The per-basis
marginal (emitted vs omitted, unconditioned, within one basis) is the D1/D2
result and is the reference point every conditioned cell is compared against.

### D3 endpoint-role pair

Co-change is symmetric, so the pair carries no direction:

```
rolePair = lexicalSort(roleA.role, roleB.role).join("↔")
```

Sorting is lexicographic on the two **existing** META-375 role-label strings. It
is a canonicalization for grouping only and implies no priority, ordering, or
importance between the endpoints.

No path is reclassified. The role label set is exactly META-375's:
`UNKNOWN`, `docs`, `generated`, `manifest-lock`, `source`, `test`, `tooling-ci`.
`UNKNOWN` is a preserved label, never coerced. The corpus yields **27** distinct
role pairs at the six held-out bases.

### D4 endpoint existence at T0

Exactly three states, from META-375's existing booleans:

| State | Rule |
| -- | -- |
| `BOTH_CURRENT` | `existsA && existsB` |
| `ONE_ABSENT` | `existsA !== existsB` |
| `BOTH_ABSENT` | `!existsA && !existsB` |

### D5 age bucket

META-375's frozen buckets, reused exactly, on `mostRecentSupport.deltaPos`:

```
0–24    25–99    100–249    250–499
```

No rebucketing after outcomes, for any reason. META-375 also carries a `none`
state for a relationship with no most-recent-support record; it is retained in
the schema and reported if populated. At the six held-out bases the observed
`none` count is **0**.

### D6 persistence X/Y

The stratum is the **exact string** `X/Y`, where `Y = subwindowPresence.length`
(eligible subwindows) and `X` = count of `true` (subwindows containing a scored
supporting event).

`2/2` is **not** equated with `5/5`. No normalized persistence score is
introduced. In this corpus `Y` is uniformly `5` at every basis — that is an
observed property of the frozen data, not a modelling choice, and the exact
`X/Y` string is still what is grouped on. Observed strata: `1/5`–`5/5`.

A normalized-persistence sensitivity view is recorded as a **future candidate**
only, and produces no META-377 primary result.

### D7 current-tree exposure

META-375's exposure classes are **multi-label observations**: a relationship can
carry several at once. It is therefore not forced into one exclusive category.

Per-class value in the frozen data is `true | false | "UNKNOWN"`. UNKNOWN is
endpoint-absence-driven (E4 when either endpoint is absent at basis; E5 when both
are). That behavior is preserved exactly as META-375 recorded it — never coerced
to `false`.

For one-dimensional conditioning, each class is reported as **separate strata**,
all three states retained so nothing is silently dropped:

| Class | Strata reported |
| -- | -- |
| E1 `manifest-lock` | `has E1` / `no E1` / `E1 UNKNOWN` |
| E2 `stem` | `has E2` / `no E2` / `E2 UNKNOWN` |
| E3 `same-dir` | `has E3` / `no E3` / `E3 UNKNOWN` |
| E4 `static-edge` | `has E4` / `no E4` / `E4 UNKNOWN` |
| E5 `generated-marker` | `has E5` / `no E5` / `E5 UNKNOWN` |
| — | `no preregistered exposure` (`noPreregisteredExposure === true`) |

The `has E_k` strata are the primary exposure conditioning. `no E_k` and
`E_k UNKNOWN` are reported alongside and are eligible for the comparability rule
on the same terms.

## 5. Comparability rule — frozen now

For every cell (basis × dimension × stratum):

```
COMPARABLE  iff  emitted N >= 10  AND  omitted N >= 10
```

Classification of every cell:

| Class | Rule |
| -- | -- |
| `EMPTY` | emitted N == 0 and omitted N == 0 |
| `EMITTED_ONLY` | emitted N > 0 and omitted N == 0 |
| `OMITTED_ONLY` | emitted N == 0 and omitted N > 0 |
| `SPARSE` | both > 0 but not (emitted ≥ 10 and omitted ≥ 10) |
| `COMPARABLE` | emitted N ≥ 10 and omitted N ≥ 10 |

Binding constraints:

- **All non-empty cells are reported**, including every `SPARSE`,
  `EMITTED_ONLY`, and `OMITTED_ONLY` cell. Nothing is deleted.
- Sparse cells are **not pooled opportunistically** — not across strata, not
  across bases, not across repositories.
- The threshold of 10 is **not lowered after seeing outcomes**, for any reason.
- If the threshold yields insufficient support, that is a **valid experimental
  result** (`INSUFFICIENT_WITHIN_STRATUM_SUPPORT`), not a problem to engineer
  around.

`10` is a minimum descriptive denominator chosen for legibility of an X/Y
fraction. It is fixed here, before any conditioned rate exists.

## 6. Reported statistics

For every populated stratum:

```
emitted recurrence X / emitted N
omitted recurrence Y / omitted N
emitted rate  = X / emitted N
omitted rate  = Y / omitted N
rate difference = emitted rate − omitted rate      (descriptive)
```

Exact X/Y is always retained behind every percentage and every summary count.

**No p-value is computed or required.** Statistical significance is not
substituted for the actual denominators. The rate difference is descriptive.

## 7. Disposition rule — frozen now, mechanical

Operates **only on `COMPARABLE` cells** of the conditioning dimensions
**D3–D7**, at the six held-out bases. (D1/D2 are the stratification axes; the
per-basis marginal is the reference point, not a conditioned cell.)

Let `C` = the set of comparable cells across D3–D7 and all six held-out bases.
For each `c ∈ C` let `d(c) = emittedRate(c) − omittedRate(c)` and let

```
P = |{c : d(c) > 0}|      Z = |{c : d(c) == 0}|      N = |{c : d(c) < 0}|
```

Let `B` = the number of the six held-out bases contributing ≥ 1 comparable cell.

Evaluated **in this order**:

1. **`INSUFFICIENT_WITHIN_STRATUM_SUPPORT`** if `|C| == 0` **or** `B < 4`.
   The frozen corpus cannot support a per-basis conditioning comparison under
   the preregistered threshold. Preserved as a negative result.

2. **`SEPARATION_SURVIVES_CONDITIONING`** if all three hold:
   - `P / |C| >= 2/3` (advantage present in a supermajority of comparable cells);
   - `N / |C| <= 1/6` (reversals confined to a small minority);
   - for every contributing basis, `P_basis >= N_basis` (no basis flips net
     negative).

3. **`SEPARATION_EXPLAINED_BY_COMPOSITION`** if both hold:
   - `P / |C| <= 1/2` (advantage is no longer a majority phenomenon once like is
     compared with like);
   - `(P − N) / |C| <= 1/6` (signed balance is near zero).

4. **`MIXED_CONDITIONAL_EFFECTS`** — otherwise. This is the **fallback**. It is
   reached whenever separation survives in some strata/bases and disappears or
   reverses in others, and it forces the report to name every important
   conditional pattern with its exact denominator rather than averaging
   heterogeneity away.

The fractions `2/3`, `1/2`, `1/6` are structural (supermajority, majority,
minority). **No threshold in this rule is derived from any recurrence result**,
because no conditioned recurrence result exists at the time this file is
committed. Branches 2 and 3 are mutually exclusive by construction, and branch 4
is exhaustive.

Per-basis heterogeneity is preserved throughout: the rule counts cells that are
already basis-specific, and the report tabulates `P/Z/N` per basis in addition to
the pooled cell counts.

## 8. Joint conditioning — frozen now, exactly three views

Frozen here, before any recurrence result exists, though executed after the
one-dimensional report. This is **not** a combinatorial search.

```
J1 = endpoint-role pair × age bucket
J2 = endpoint-role pair × endpoint-existence state
J3 = age bucket × persistence X/Y
```

**No fourth combination may be introduced after seeing outcomes.**

J1–J3 use the identical comparability rule (`emitted N ≥ 10 AND omitted N ≥ 10`),
identical per-basis primary, and identical reporting of all non-empty cells.
Sparse joint cells are not pooled to satisfy the threshold.

The joint views **do not enter the §7 disposition arithmetic**. They corroborate
or contradict the one-dimensional finding; any joint-level reversal or
disappearance is named as an exception in the report with its exact denominator.

## 9. Questions the report must answer separately

1. Within endpoint-role pairs, does emitted > omitted persist?
2. Within endpoint-existence states?
3. Within age buckets?
4. Within exact persistence X/Y strata?
5. Within current-tree exposure states?
6. Does the answer differ materially by repository/basis?

Plus, across bases: the count of comparable cells with emitted > omitted,
emitted == omitted, emitted < omitted, and unavailable/sparse — always with the
individual X/Y cells retained behind the summary.

## 10. Validation and red tests — required

Deterministic checks must prove at minimum:

- relationship count equals the META-375 input count (9,203);
- emitted/omitted identities unchanged;
- held-out outcome identities unchanged;
- role labels unchanged;
- age labels unchanged;
- persistence X/Y unchanged;
- endpoint-existence labels unchanged;
- exposure labels unchanged;
- pin bases contribute zero recurrence observations;
- six and only six bases contribute frozen held-out outcomes.

Red tests must deliberately perturb and be caught for at least: emitted status;
role grouping label; held-out recurrence outcome; endpoint existence; age bucket.

**A red test that does not change what its checker measures is invalid
evidence.** Each red test must therefore assert that its perturbation actually
moved the quantity its paired checker reads, and fail loudly if the perturbation
was inert.

## 11. Interpretation boundaries — binding

The disposition speaks **only** about the measured recurrence separation.

`SEPARATION_SURVIVES_CONDITIONING` would mean rank/support continues to
concentrate later co-touch observations. It would **not** mean semantic coupling,
consequentiality, impact, dependency, required companion edit, or agent
usefulness.

`SEPARATION_EXPLAINED_BY_COMPOSITION` would support a heterogeneous-population
explanation. It would **not** identify which class matters to an agent.

Nothing in this issue authorizes: a schema change; a producer change; a ranking
or cap change; filtering any class of relationship; adding `consequential`,
`noise`, `priority`, `risk`, `impact`, or `should-change` labels; or executing
META-376. **META-376 remains blocked.**

## 12. Deviation policy

Any departure from this plan is recorded verbatim in `RECEIPT.md` with its
reason, and the affected result is marked. Silent revision is a stop condition.
