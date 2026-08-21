# FIBERY-RECONCILIATION-DRAFT — META-289 → OQ-15

Draft copy for reconciling the durable question. Fibery owns the durable
semantic interpretation; Linear META-289 owned execution; this repository owns
the evidence.

## Target

| | |
| -- | -- |
| Database | `workspace json Ecosystem/Open Questions` |
| Entity | **OQ-15** (`330a4c09-51ea-4d87-b1a7-78a40ed968bd`) |
| Name | *Does revision-bound historical source↔test co-update add incremental information about later test-file co-update beyond current-tree baselines?* |
| Kind | Open Question |
| Truth Domain | Experiment Evidence |
| State before | `Open` |

## Proposed state after

**`Investigating`** — not `Resolved`.

The missing evidence OQ-15 named has been produced in full, and the question is
answered *for this corpus*. It is **not** resolved as a durable general claim,
because the measured result is explicitly conditional on testing culture and one
of four repositories carries the only positive verdict. Marking it `Resolved`
would assert a stability the evidence does not support.

## Resolution field — proposed text

> **Answered for a preregistered four-repository corpus; not resolved as a
> general claim.**
>
> Disposition: **`MIXED_BY_REPOSITORY_OR_TESTING_CULTURE`**.
>
> Source-conditioned source↔test co-update history (`H`) was compared against a
> test-popularity base rate (`B0`) and a deterministic current-tree
> filename/path baseline (`B1`) over 800 authentic source-changing transactions
> — 200 in each of four public repositories with materially different testing
> cultures. Primary metric: macro-averaged `recall@10` over queries with at
> least one extant test touched, materiality threshold `0.05` absolute, all
> frozen before selection.
>
> | Stratum | Repository | H | B0 | B1 | H−B0 | H−B1 | beats both |
> | -- | -- | --: | --: | --: | --: | --: | -- |
> | Go | `flyteorg/flyte` | 0.715 | 0.183 | **0.862** | +0.532 | −0.147 | no |
> | Java | `LuckPerms/LuckPerms` | 0.426 | 0.411 | 0.338 | +0.015 | +0.088 | no |
> | Python | `kornia/kornia` | 0.465 | 0.190 | **0.561** | +0.276 | −0.095 | no |
> | TypeScript | `remult/remult` | **0.682** | 0.380 | 0.413 | +0.302 | +0.268 | **yes** |
>
> History cleared the incremental-value gate in **1 of 4** repositories.
>
> **The sign of the incremental result flips with testing culture.** Where test
> placement follows a mechanical convention (Go `foo_test.go`, Python `tests/`
> packages), a deterministic current-tree rule that uses no history at all beats
> history. Where conventions are heterogeneous (TypeScript), history wins. In
> Java, test popularity alone comes within 0.015 of history.
>
> **Separately and larger than the ranking result: 429 of 800 (53.6%) authentic
> source-changing transactions touched no test file at all** — 80.0% in the Java
> repository. A further 53 touched only test files that did not exist at `T0`.
> This bounds the addressable value of any method in this family, independently
> of which method ranks best.
>
> Evidence: `workspacejson/cli`, `docs/evidence/meta-289/`.

## Missing Evidence field — proposed update

The originally named missing evidence has been produced:

| OQ-15 asked for | Delivered |
| -- | -- |
| preregistered temporal holdout over public repositories with measurable testing cultures | `PREREGISTRATION.md` (24 frozen parameters, committed before selection); 4 strata by testing culture |
| candidates from pre-transaction history only | `H-HISTORICAL.md`; structural expanding window; invariants I3/I7 by independent reimplementation |
| comparison vs deterministic current-tree discovery | `B1-CURRENT-TREE.md` |
| comparison vs test-popularity / base rate | `B0-POPULARITY.md` |
| precision, recall, candidate-set fraction, coverage, incremental value | `COMPARISON.md`, `DENOMINATOR-AUDIT.md`, `tables/metrics.csv` |
| revert/fix lineage NOT used as regression ground truth | withdrawn and unused; `PREREGISTRATION.md` §22 |
| no agent run, no schema/producer change | none performed; `MANIFEST.json.prohibitionsObserved` |

**Remaining missing evidence, proposed replacement text:**

> The four-repository result is conditional and rests on one positive
> repository. What is still missing, should the question ever be pursued
> further:
>
> 1. Whether the culture-conditional pattern (history wins only where test
>    placement conventions are heterogeneous) replicates on an unseen cohort
>    selected under the same frozen protocol. This is a confirmatory question
>    and would need its own preregistration.
> 2. Whether a richer static current-tree baseline — import/dependency analysis
>    rather than filename and path adjacency — closes the gap in the one
>    repository where history won. META-289's `B1` is a filename/path baseline
>    by design, so **every reported H-over-B1 margin is an upper bound.**
> 3. Nothing here bears on whether any consumer should act on such a signal.
>    That is a separate causal question and is not authorized by this evidence.

## Source Artifact to link

| Field | Value |
| -- | -- |
| Kind | experiment receipt |
| Repository | `workspacejson/cli` |
| Path | `docs/evidence/meta-289/` |
| Preregistration commit | `8f3f762dbc6ae7006f2317fb6137e6e2a754a92a` |
| Pre-outcome commit | `7bd2f17c1b715875d0dc8dbace5d2002f46a29dd` |
| Results commit | *(recorded at closeout)* |
| Linear execution | META-289 |

## Interpretation boundary — must survive into Fibery verbatim

This evidence establishes properties of **observed later test-file co-touch**
and nothing more. It must never be recorded in Fibery as establishing:

- regression-catching ground truth;
- test coverage;
- required tests;
- affected tests;
- correctness, impact, dependency, effectiveness, or risk;
- which tests an agent should run;
- which files an agent should edit.

**Same-transaction source/test change does not establish that the test
exercises, covers, or would catch a regression in the source file.**

## Negative results that must be preserved, not averaged

1. History beats popularity but loses to the current tree — Go, Python.
2. History beats the current tree but not popularity — Java.
3. Only one repository (TypeScript) drives the positive verdict.
4. History abstains on 11%–17% of positive queries in three repositories.
5. Test popularity substantially explains history in Java.
6. Current-tree naming/path conventions explain the result in Go and Python.
7. 53.6% of source-changing transactions touch no test file; 80.0% in Java.
8. The Java stratum has only 29 positive queries — the least stable numbers in
   the report, disclosed rather than smoothed. The repository was **not**
   replaced, because the protocol forbids replacement for sparsity.

## Successor authorization — explicitly none

Per the Linear META-289 contract and PREREGISTRATION §3: a positive substrate
result would not have authorized a consumer or agent experiment, and **this is
not a positive substrate result.** No agent experiment, no
`workspacejson tests-for`, no schema field, no CLI command, and no producer or
ranking change follows from this evidence. Any successor requires a separate
explicit decision.
