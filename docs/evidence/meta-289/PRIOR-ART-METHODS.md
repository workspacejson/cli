# PRIOR-ART-METHODS — META-289 bounded methodology check

**Date:** 2026-08-21. **Scope:** methodology sourcing only.

This is **not** a literature review, and it is deliberately bounded. It exists
to answer one question: *are the measurement choices this experiment is about
to freeze conventional, or invented?* No published performance number from any
source below is imported as evidence about workspace.json, and none appears in
any META-289 result table.

## Attribution discipline

Carried forward from `docs/evidence/meta-375/PRIOR-ART-METHODS.md`. A source is
cited as informing a measurement choice **only where source text supporting
that specific point was actually inspected in this session**. Every entry
declares its inspection status:

| Status | Meaning |
| -- | -- |
| `INSPECTED` | Abstract or body text retrieved and read in this session |
| `PARTIALLY_INSPECTED` | Some source text read; full text not retrieved |
| `BIBLIOGRAPHIC_ONLY` | Existence/venue/topic confirmed; **no protocol claim rests on it** |

Where a META-289 protocol choice has no inspected-text backing, it is declared
**internally preregistered** — it stands on the requirements of this experiment
and needs no literature citation to be valid.

## The epistemic constraint this check must preserve

> Same-transaction source/test change does not establish that the test
> exercises, covers, or would catch a regression in the source file.

Nothing below weakens that. The one source that speaks most directly to the
construct (§2) calls the relation a **"probable link"**, which is consistent
with — not contrary to — the constraint. This experiment measures observed
later test-file co-touch and nothing else.

## Sources actually used

### 1. Zimmermann, Weißgerber, Diehl, Zeller — "Mining Version Histories to Guide Software Changes"

IEEE TSE 31(6), pp. 429–445, June 2005. DOI `10.1109/TSE.2005.72`.

**Status: `PARTIALLY_INSPECTED` (carried from META-375; not re-fetched here).**
Inspected there: abstract, section-3 ROSE description passages, and
evaluation-summary passages quoted verbatim in search results. Full text was
never inspected in either issue.

**Informs, from inspected text:**

- **Transaction unit.** Association-rule mining over items changed together in
  version-archive transactions. META-289 freezes one first-parent commit edge
  as the transaction (PREREGISTRATION §8).
- **Count vocabulary.** `support` as the count of transactions in which two
  items co-occur. META-289's `H` uses exactly this and computes no confidence,
  lift, decay, or learned weight (PREREGISTRATION §14).
- **The claim that history-derived coupling can be "undetectable by program
  analysis."** This is *why* B1 must exist as a separate, history-independent
  measurement rather than being assumed subsumed by H. It is a reason to run
  the comparison, **not** a prediction that H will win it.

**Explicitly not taken:** the evaluation protocol details (not inspected) and
the reported top-3 accuracy figure. Neither informs any META-289 decision or
expectation.

### 2. Kabadi et al. — "Using Evolutionary Coupling to Establish Relevance Links Between Tests and Code Units" (CEMENT)

arXiv `2203.11343`.

**Status: `INSPECTED`** (arXiv abstract page retrieved 2026-08-21).

This is the closest published construct to the one under test here.

**Informs, from inspected text:**

- **The construct is real and named.** The paper states that "developers make
  relevant changes on test and code units at the same period of time, i.e.,
  co-evolution of tests and code units reflects a probable link between them."
  META-289's `H` is a strictly simpler, count-only instance of the same
  observation.
- **The hedge is load-bearing.** The paper's own wording is **"probable
  link"** — not *covers*, not *exercises*, not *would catch*. That matches the
  epistemic constraint META-289 is required to preserve, and is recorded here
  as the strongest available external support for keeping the constraint.
- **Downstream tasks are evaluated separately from the link itself.** The paper
  evaluates via a fault-localization case study rather than treating the
  co-evolution link as coverage ground truth. META-289 likewise measures only
  observed later co-touch and explicitly forbids the regression-recall
  construct (PREREGISTRATION §22).

**Explicitly not taken:** the CEMENT technique itself (it is a richer static +
evolutionary hybrid; META-289 must not build one), the 15-project corpus, the
IRFL comparison, and the localized-fault counts. META-289 imports **no** number
from this paper.

### 3. Zhu et al. — "Revisiting the Identification of the Co-evolution of Production and Test Code"

ACM TOSEM, 2023. DOI `10.1145/3607183`.

**Status: `BIBLIOGRAPHIC_ONLY` + one search-result passage.** The ACM DL page
returned HTTP 403 in this environment; full text was **not** inspected. Only a
passage surfaced in search results was read.

**Informs, from that passage only:**

- **File-name matching and mirrored directory layout are the conventional
  identification strategies.** The passage describes associating test and
  production classes via "File Name Matching, where the naming convention is
  used to identify the associated production class by removing the 'Test'
  prefix/suffix," over projects following "the standard directory layout, where
  `src/main` stores production files and `src/test` stores test files."

This is the sole reason B1's stem-stripping and mirrored-path rules are
described here as **conventional rather than invented** (PREREGISTRATION §16).
No B1 threshold, weight, or tier is taken from this paper — those are
internally preregistered.

**Explicitly not taken:** every reported result, the study's linking accuracy,
and its corpus.

### 4. Zaidman, Van Rompaey, van Deursen, Demeyer — production/test co-evolution studies

ICST 2008, "Mining Software Repositories to Study Co-Evolution of Production &
Test Code"; and EMSE 16(3), 2011, "Studying the co-evolution of production and
test code in open source and industrial developer test processes through
repository mining."

**Status: `BIBLIOGRAPHIC_ONLY`.** An author-mirrored PDF was fetched but its
text layer was not extractable in this environment. **No protocol claim rests
on this entry.**

**Recorded for context only:** this line of work established that
production/test co-evolution is studied at repository-history granularity and
that projects differ in whether testing is synchronous or phased. META-289
independently stratifies its corpus by language-defined testing culture
(PREREGISTRATION §5); that choice is **internally preregistered** and does not
depend on this source.

### 5. Sun et al. — "A Critical Study on Data Leakage in Recommender System Offline Evaluation"

arXiv `2010.11060`.

**Status: `INSPECTED`** (abstract retrieved verbatim 2026-08-21).

**Informs, from inspected text:**

- **The global-timeline requirement.** "Data leakage is caused by not observing
  global timeline in evaluating recommenders, e.g., train/test data split does
  not follow global timeline. As a result, a model learns from the user-item
  interactions that are not expected to be available at prediction time."
- **Consequence for ranking comparisons.** The abstract states that with
  leakage, models' "relative performance orders thus become unpredictable with
  different amount of leaked future data in training."

This is the external authority for META-289's expanding-window construction and
for treating leak-detection as a **required red test** rather than a nicety
(PREREGISTRATION §10, §20). Because the failure mode corrupts *relative order*,
and META-289's entire output is a relative comparison of H against B0 and B1, a
leak would invalidate the disposition rather than merely bias one number.

**Explicitly not taken:** the datasets, the four baseline models, and every
reported accuracy delta.

### 6. Miranda et al. — "Test Co-Evolution in Software Projects: A Large-Scale Empirical Study"

Journal of Software: Evolution and Process, 2025. DOI `10.1002/smr.70035`.

**Status: `BIBLIOGRAPHIC_ONLY`.** Only the search-result summary was read.

**Recorded for context only:** a large-scale study of test/production
co-evolution across 526 GitHub repositories in six languages including
JavaScript, TypeScript, Java and Python. This is recorded solely to note that
multi-language corpora are usual in this area. META-289's four strata and its
cohort size are **internally preregistered** and do not derive from it.

## Protocol choices that stand WITHOUT external authority

Declared **internally preregistered**. Each is frozen in `PREREGISTRATION.md`
before any outcome is computed, and none is justified by citation:

| Choice | Where frozen |
| -- | -- |
| Exact source and test path classifiers, per stratum | §6, §7 |
| Transaction = one first-parent commit edge; 1..50 changed files | §8 |
| Expanding pre-T history window, no depth cap, no decay | §9 |
| Evaluation window = last 200 eligible source-changing transactions | §10 |
| Rename/delete treatment (`-M`, destination-counted, `D` not a touch) | §11 |
| Query unit = the transaction, not the source file | §12 |
| Multi-source aggregation: `SUM` primary, `MAX` secondary | §13 |
| `H` = raw co-occurrence support, lexical tie-break | §14 |
| `B0` = source-independent pre-T test touch count | §15 |
| `B1` tier weights (100 / 10 / shared-prefix depth) | §16 |
| Candidate denominator = extant test files in the T0 tree | §17 |
| `K ∈ {1, 3, 5, 10}` | §18 |
| Macro-average over positive queries; micro reported secondary | §21 |
| Materiality threshold `Δ ≥ 0.05` absolute on recall@10 | §24 |
| Disposition ladder and its strict evaluation order | §24 |

**B0's status specifically.** A popularity / most-popular control is standard
practice in recommender evaluation, but no source was inspected in this session
that states it. B0 is therefore declared **internally preregistered**, and its
justification is stated in its own terms in §15: it is the control that
distinguishes *source-conditioned* signal from "these tests change a lot."

## Known pitfalls recorded, and the guard adopted for each

| Pitfall | Guard in META-289 |
| -- | -- |
| Co-change read as coverage, exercise, or regression-catching | §22 interpretation boundary; regression-recall construct withdrawn; outcome named only "test files touched in T" |
| Future data leaking into features, corrupting **relative order** (§5) | §10 expanding window; §20 outcome isolation; red tests RT1, RT2 |
| Popularity explaining apparent recommendation quality | B0 required, and H must beat it (§15, §24) |
| Naming conventions already capturing the answer | B1 required, and H must beat it too (§16, §24) |
| Recall bought by selecting most of the suite | Candidate-set fraction reported at every K; non-inflation clause in §24 |
| Testing culture confounding a single-corpus result | Four strata with materially different conventions (§5); per-repository results never averaged away (§23) |
| A baseline tuned per repository after seeing results | B1 is one cross-repository rule, frozen in §16, with no per-repository branch |
| Aggregation rule chosen after seeing which predicts better | §13 freezes `SUM` as primary and `MAX` as a reported secondary, both before outcomes |

## What this check does NOT establish

- It does not establish that source↔test co-update history is useful.
- It does not import any external effect size as an expectation for this corpus.
- It does not license a coverage, dependency, or regression claim.
- It is not a systematic review, and no completeness claim is made about the
  literature on test co-evolution.
