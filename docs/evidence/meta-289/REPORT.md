# REPORT — META-289

**Question (Fibery OQ-15, executed by Linear META-289):**

> For an authentic later transaction that changes one or more source files,
> does source↔test co-update history available strictly before that transaction
> improve identification/ranking of the test files actually touched in that
> later transaction, beyond deterministic current-tree baselines and test
> popularity/base rates?

**Observed outcome:** test files touched in the later transaction. Nothing else.

# DISPOSITION: `MIXED_BY_REPOSITORY_OR_TESTING_CULTURE`

Reached by the frozen §24 ladder, which was committed at `8f3f762dbc6a`
before any repository was selected and before any outcome was computed.

| Rung | Disposition | Fired | Arithmetic |
| -- | -- | -- | -- |
| D1 | `INSUFFICIENT_SOURCE_TEST_SIGNAL` | no | reposWithHCoverage<0.50 = 0 (>=2?) OR totalPositive = 318 (<100?) |
| D2 | `HISTORY_ADDS_INCREMENTAL_COUPDATE_SIGNAL` | no | sumPOS = 1 (>=3?) AND no repo with delta1 <= -0.05 (one exists) |
| D3 | `MIXED_BY_REPOSITORY_OR_TESTING_CULTURE` | **FIRED** | 1 <= sumPOS(1) <= 2 |
| D4 | `HISTORY_REPLICATES_BASE_RATE_ONLY` | no | sumPOS = 0 AND repos with delta0 < 0.05 = 1 (>=3?) |
| D5 | `CURRENT_TREE_MATCHES_OR_BEATS_HISTORY` | no | terminal otherwise |

## The result in one table

Primary metric: macro-averaged `recall@10` over `POSITIVE` queries, per
repository. Materiality threshold `0.05` absolute.
`POS(r) = 1` requires `H` to materially beat **both** baselines and to satisfy
the non-inflation clause.

| Stratum | Repository | POSITIVE | H | B0 popularity | B1 current-tree | Δ0 = H−B0 | Δ1 = H−B1 | POS |
| -- | -- | --: | --: | --: | --: | --: | --: | --: |
| Go | `flyteorg/flyte` | 137 | 0.715 | 0.183 | 0.862 | **+0.5316** | **-0.1470** | **0** |
| Java | `LuckPerms/LuckPerms` | 29 | 0.426 | 0.411 | 0.338 | **+0.0149** | **+0.0879** | **0** |
| Python | `kornia/kornia` | 84 | 0.465 | 0.190 | 0.561 | **+0.2756** | **-0.0954** | **0** |
| TypeScript | `remult/remult` | 68 | 0.682 | 0.380 | 0.413 | **+0.3020** | **+0.2681** | **1** |

**`Σ POS(r) = 1` of 4.**

## What actually happened

**The sign of the incremental result flips with testing culture.**

- Where tests are **co-located or conventionally named**, a deterministic rule
  that reads only filenames and directories beats history. In `flyteorg/flyte`
  (Go, `foo_test.go` beside `foo.go`) `B1` reaches
  R@10 = 0.862 against
  `H`'s 0.715. In
  `kornia/kornia` (Python, `tests/` packages) it is
  0.561 against
  0.465.
- Where conventions are **heterogeneous**, history wins. In `remult/remult`
  (TypeScript, mixed `__tests__` / `.spec.ts`) `H` reaches
  0.682 against `B1`'s
  0.413 and `B0`'s
  0.380 — the only
  repository where `POS(r) = 1`.
- In `LuckPerms/LuckPerms` (Java) `H` beats `B1` by
  +0.0879 but beats `B0` by only
  +0.0149 — below threshold. **Test
  popularity substantially explains `H` there.**

`H` beats `B0` materially in three of four repositories, often by a wide
margin. It beats `B1` materially in two. It beats **both** in one.

## The largest finding is not about H at all

| Stratum | Repository | POSITIVE | NEW_TEST_ONLY | ZERO_TEST_TOUCH | zero-test-touch rate |
| -- | -- | --: | --: | --: | --: |
| Go | `flyteorg/flyte` | 137 | 19 | 44 | **22.0%** |
| Java | `LuckPerms/LuckPerms` | 29 | 11 | 160 | **80.0%** |
| Python | `kornia/kornia` | 84 | 17 | 99 | **49.5%** |
| TypeScript | `remult/remult` | 68 | 6 | 126 | **63.0%** |
| **cohort** | | **318** | **53** | **429** | **53.6%** |

**429 of 800 authentic source-changing transactions (53.6%)
touched no test file at all** — 80.0%
in the Java repository. A further 53 touched only test files that did not
exist at `T0` and were therefore unreachable by construction.

Any proposed consumer of a source→test suggestion would be answering a question
that, in this corpus, has no answer more than half the time. That is a property
of the phenomenon, not a limitation of the method under test.

## Concentration, coverage and ranking quality

| Stratum | Repository | H coverage | H abstention | MRR H | MRR B0 | MRR B1 |
| -- | -- | --: | --: | --: | --: | --: |
| Go | `flyteorg/flyte` | 122/137 | 0.109 | 0.6789 | 0.1199 | 0.8003 |
| Java | `LuckPerms/LuckPerms` | 24/29 | 0.172 | 0.2458 | 0.2597 | 0.3850 |
| Python | `kornia/kornia` | 72/84 | 0.143 | 0.4205 | 0.1801 | 0.4914 |
| TypeScript | `remult/remult` | 67/68 | 0.015 | 0.6152 | 0.1868 | 0.2470 |

| Stratum | Repository | P@10 H | P@10 B0 | P@10 B1 | frac@10 H | frac@10 B0 | frac@10 B1 |
| -- | -- | --: | --: | --: | --: | --: | --: |
| Go | `flyteorg/flyte` | 0.229 | 0.028 | 0.143 | 0.0218 | 0.0327 | 0.0315 |
| Java | `LuckPerms/LuckPerms` | 0.166 | 0.084 | 0.088 | 0.1079 | 0.2298 | 0.2298 |
| Python | `kornia/kornia` | 0.200 | 0.036 | 0.377 | 0.0214 | 0.0385 | 0.0176 |
| TypeScript | `remult/remult` | 0.201 | 0.056 | 0.050 | 0.0586 | 0.0754 | 0.0754 |

`H` is the **most concentrated** method: it selects a smaller share of the
test suite than the better baseline in every repository, and the §24
non-inflation clause passes everywhere. Whatever `H` achieves, it does not
achieve by selecting more of the suite.

It also **abstains** on 17.2%
of `POSITIVE` queries in Java and
14.3% in Python — retained at
recall 0 per §19.1, never dropped.

## Preregistered secondary analyses

Both were named in the preregistration before outcomes.

- **SUM vs MAX aggregation (§13).** Largest R@10 divergence
  0.0147,
  inside the materiality threshold. No `POS` verdict changes. The disposition
  does not depend on the aggregation rule. Full table in `H-HISTORICAL.md`.
- **Micro aggregation (§21.5).** Reported per repository and K in
  `DENOMINATOR-AUDIT.md`; it does not alter the sign of any Δ.

## WHAT THIS ESTABLISHES

1. On this preregistered corpus, **source-conditioned co-update history does
   not clear the incremental-value gate**. It beat both baselines in one of four
   repositories.
2. **The result is conditional on testing culture, not uniform.** Δ1 is
   negative where test placement follows a mechanical convention and positive
   where it does not. This is a repository-level effect that survives the frozen
   metric rule.
3. **Test popularity alone is a serious competitor in at least one repository**
   (`LuckPerms/LuckPerms`), where it comes within
   0.0149 of history.
4. **A deterministic current-tree rule with no history is a serious competitor
   generally**, and beats history outright in two repositories.
5. **History is consistently the most concentrated signal.** Where it does fire,
   it fires on a short list — but it declines to fire on
   17.2% of positive
   queries in the worst repository.
6. **Most source-changing transactions in this corpus touch no test file**
   (53.6%), which bounds the addressable value of any method in
   this family.

## WHAT THIS DOES NOT ESTABLISH

This experiment measured **test files touched in a later transaction** and
nothing else. It does not establish, and its output may never be relabelled as:

- regression-catching ground truth;
- test coverage;
- required tests;
- affected tests;
- correctness;
- impact;
- dependency;
- test effectiveness;
- risk;
- which tests an agent should run;
- which files an agent should edit.

**Same-transaction source/test change does not establish that the test
exercises, covers, or would catch a regression in the source file.** The
regression-recall construct from the earlier META-289 description is withdrawn
and was not used. Revert lineage was not studied and is not regression-test
ground truth.

It also does not establish anything about repositories outside this cohort, nor
about workspace.json producer behavior, which was not changed.

## Limitations, stated rather than buried

1. **B1 is a filename/path/adjacency baseline.** No cross-language static
   import or dependency baseline was built, because that would require a new
   large analysis surface this issue forbids. A richer static baseline could
   plausibly beat `B1`, so **every `H`-over-`B1` margin here is an upper
   bound** on `H`'s advantage over deterministic current-tree analysis.
2. **Rename chains are not resolved** (§11). A renamed file's counts are split
   across its old and new paths. This depresses `H` and `B0` on recently
   renamed files. It applies identically to all three methods.
3. **The Java stratum has a thin outcome denominator** — only
   29 `POSITIVE` queries of 200. Its
   Δ values are the least stable numbers in this report. The repository was not
   replaced, because §5.6 forbids replacement for sparsity.
4. **Four repositories, one per stratum.** The cohort size was frozen at four
   before selection. Repository-level effects here are observations about four
   projects, not estimates of a population parameter.
5. **The universe is the committed snapshot**, truncated at GitHub's 1,000-result
   search cap in three of four strata. That is a stated limit of the sampling
   frame, fixed before selection.
6. **No inferential statistics.** Comparisons are exact counts and macro means
   under a frozen threshold, with per-query win/loss/tie counts reported. No
   confidence interval or significance test was preregistered, and none is
   claimed.

## Corpus

| Stratum | Repository | Rank taken | Pin | First-parent commits | Test files @ pin |
| -- | -- | --: | -- | --: | --: |
| Go | `flyteorg/flyte` | 9 | `6fadb90d65af` | 2,410 | 275 |
| Java | `LuckPerms/LuckPerms` | 6 | `9b4fe67791e8` | 2,266 | 84 |
| Python | `kornia/kornia` | 5 | `b4f5a78a1389` | 2,411 | 279 |
| TypeScript | `remult/remult` | 1 | `85bb4884ed94` | 2,913 | 142 |

Selected by seed `META-289/OQ-15/source-test-coupdate/v1` from a committed universe snapshot of
3,887 repository
records, with anti-leak exclusion of every META-375 discovery repository and
every META-378 cohort repository. Full attempt-by-attempt backfill record in
`SELECTION-RECEIPT.md`.

## Validation

11 invariants **PASS**, 7 red tests
**CAUGHT** with proven non-inert perturbations, 0 failures. Detail
in `RECEIPT.md`.

## DEVIATIONS

**One, non-semantic.** `scripts/gitmine.mjs` initially passed
`--no-renames-empty` to `git log`; the installed git 2.52.0 rejects it, and
the script's fallback path re-ran the identical command without it. The flag was
removed from the source after cohort verification. This changed no output — the
fallback had already executed the flagless command — and it touched no frozen
parameter.

**No protocol deviation.** No parameter in `PREREGISTRATION.md` was changed
after outcomes became visible. No repository was replaced for any reason other
than a recorded V1–V6 failure. No disposition was renamed or redefined.

## What this issue did NOT do

Per the execution contract: no AI-agent experiment was run; `workspacejson
tests-for` was not implemented; workspace.json semantics, producer behavior and
the existing co-change ranking/cap were not changed; no schema field or CLI
command was added.

**A positive substrate result would not have authorized a consumer experiment,
and this is not a positive substrate result.** Whether the one-repository effect
warrants any successor work is a separate explicit decision.
