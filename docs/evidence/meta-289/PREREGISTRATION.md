# PREREGISTRATION — META-289

**Issue:** Linear META-289 — *Does historical source↔test co-update add
incremental future co-update signal beyond current-tree baselines?*

**Durable question owner:** Fibery **OQ-15**. **Execution owner:** Linear
META-289. **Evidence owner:** `workspacejson/cli`, `docs/evidence/meta-289/`.

**This document is frozen before any evaluation transaction outcome is read or
computed.** The commit that introduces this file contains no outcome-stage
code and no outcome-stage data. No parameter below may be changed after
evaluation outcomes are visible. Deviations are governed by §26.

## Required-freeze mapping

The execution contract enumerates 24 items that must be frozen. Every one is
frozen below; this table is the audit index.

| # | Required freeze item | Section |
| --: | -- | -- |
| 1 | repository universe | §5.1 |
| 2 | metadata / pre-outcome eligibility | §5.2 |
| 3 | exact cohort size | §5.3 |
| 4 | deterministic selection rule / seed | §5.4 |
| 5 | no-replacement rule | §5.6 |
| 6 | exact source classifier | §6 |
| 7 | exact test classifier | §7 |
| 8 | transaction-unit rule | §8 |
| 9 | history / training-window rule | §9 |
| 10 | temporal evaluation-window rule | §10 |
| 11 | rename / delete treatment | §11 |
| 12 | query unit | §12 |
| 13 | multi-source aggregation rule | §13 |
| 14 | historical source↔test scoring / ranking | §14 |
| 15 | B0 popularity baseline | §15 |
| 16 | B1 deterministic current-tree baseline | §16 |
| 17 | candidate test-suite denominator | §17 |
| 18 | K values | §18 |
| 19 | coverage / abstention treatment | §19.1 |
| 20 | zero-test-touch treatment | §19.2 |
| 21 | precision / recall definitions | §21 |
| 22 | candidate-set fraction | §21.4 |
| 23 | stopping rule | §23 |
| 24 | exact disposition arithmetic | §24 |

---

## 1. Exact question

> For an authentic later transaction that changes one or more source files,
> does source↔test co-update history available strictly before that
> transaction improve identification/ranking of the test files actually
> touched in that later transaction, beyond deterministic current-tree
> baselines and test popularity/base rates?

The observed outcome is **test files touched in the later transaction**, and
nothing else. §22 states what that outcome is not.

## 2. Authoritative inputs and non-inheritance

Verified predecessor authority:

| Input | Status |
| -- | -- |
| META-378 durable receipt `workspacejson/cli@f3c7a0741acd14620a4fe8535c65d1908087fa30` | verified present in this repository |
| META-378 disposition `NEITHER_PATTERN_REPLICATES` | recorded as context; not an input to any rule here |
| META-376 | **Canceled**, verified via Linear. Not reopened, not executed |

**Reused as machinery only** — from META-378 (`scripts/universe.mjs`,
`scripts/select-cohort.mjs`) and the META-312/313 pre-outcome sampling
discipline: GitHub-search universe materialization to a committed snapshot,
offline re-verification of every eligibility predicate, seeded
`sha256(SEED:full_name)` ordering frozen before any clone, and
verification-only backfill.

**Explicitly NOT inherited:** maintainer outreach; adoption or usefulness
outcomes; generic top-50 hypotheses; and every measured outcome of META-312,
META-313, META-323, META-375, META-377 and META-378. No number from those
experiments enters any rule, threshold, or expectation here.

## 3. Prohibitions binding this issue

This experiment does **not**, and no artifact under `docs/evidence/meta-289/`
may:

- run an AI-agent experiment;
- implement `workspacejson tests-for`;
- change workspace.json semantics, producer behavior, or the existing
  co-change ranking/cap;
- add a schema field or CLI command;
- introduce learned ranking, LLM classification, decay weighting, normalized
  importance, inferred semantic dependency, bot/AI-author labels,
  commit-purpose inference, consequentiality, risk, or recommendation scores.

This is measurement, not producer design.

## 4. Anti-leak exclusions

The following are excluded from the universe by exact `full_name` before
ordering, so that no repository already examined by a predecessor experiment
can enter this cohort:

| Source | Excluded `full_name` |
| -- | -- |
| META-375 discovery | `formatjs/formatjs`, `JamieMason/syncpack`, `polyfy/polylith` |
| META-378 cohort | `nteract/hydrogen`, `thepowersgang/rust_os`, `clojure/core.typed`, `hyperledger/fabric`, `scikit-image/scikit-image` |
| Self-ownership | any repository whose owner is `workspacejson` |

## 5. Corpus

### 5.1 Repository universe  *(freeze item 1)*

Four strata, chosen because their **testing cultures differ materially in
exactly the dimension B1 measures** — how discoverable the source↔test
relation is from the current tree alone:

| Stratum | Testing culture | Expected current-tree discoverability |
| -- | -- | -- |
| Go | co-located `foo_test.go` beside `foo.go` | strongest possible convention |
| Java | mirrored `src/test/java` + `FooTest.java` | strong, physically separated |
| Python | `tests/` package + `test_foo.py`, often not 1:1 | moderate |
| TypeScript | heterogeneous `__tests__/`, `.test.ts`, `.spec.ts` | weakest / most varied |

Frozen query template, one per stratum, `search/repositories`, `sort=stars`,
`order=desc`, `per_page=100`, paginated to GitHub's hard 1000-result cap:

```
language:{LANG} stars:1000..40000 created:<2022-01-01 pushed:>2026-01-01
fork:false archived:false size:5000..400000
```

**The committed snapshot `raw/universe.json` is the universe**, not the live
API. Where `total_count` exceeds 1000 the universe is defined as exactly the
enumerable slice recorded in the receipt. That is a stated limit of the
sampling frame, fixed here before selection, not a filter applied afterwards.

### 5.2 Eligibility — metadata only, no outcome  *(freeze item 2)*

Every predicate is re-verified offline from the snapshot record rather than
trusted from the query, so the filter is auditable without network access.

| # | Predicate |
| -- | -- |
| E1 | record present in the committed snapshot |
| E2 | `fork === false` |
| E3 | `archived === false && disabled === false` |
| E4 | `default_branch` is a non-empty string |
| E5 | `1000 <= stargazers_count <= 40000` |
| E6 | `created_at < 2022-01-01T00:00:00Z` |
| E7 | `pushed_at > 2026-01-01T00:00:00Z` |
| E8 | `5000 <= size <= 400000` |
| E9 | `full_name` not in the §4 anti-leak exclusion set |
| E10 | `language` equals the stratum language |

Nothing in E1–E10 touches repository content, history, tests, or any outcome.

### 5.3 Cohort size  *(freeze item 3)*

**Exactly four repositories: the rank-1 eligible repository in each of the four
strata**, after §5.5 verification and §5.6 backfill. Not three, not five. The
cohort is fixed here and cannot grow or shrink in response to results.

### 5.4 Deterministic selection rule and seed  *(freeze item 4)*

```
SEED = "META-289/OQ-15/source-test-coupdate/v1"
orderKey(full_name) = sha256(SEED + ":" + full_name), lowercase hex
ordering = ascending lexical orderKey within each stratum
```

The order depends only on the seed and the repository name. It is therefore
fixed before any repository property beyond §5.2 eligibility is consulted, is
reproducible from the committed snapshot alone, and — because it is frozen
before any clone exists — cannot be steered by §5.6 backfill.

### 5.5 Post-selection mechanical verification

Applied **after** ordering and **before** any evaluation outcome exists.

| # | Check |
| -- | -- |
| V1 | a full, non-shallow clone succeeds |
| V2 | `default_branch` HEAD resolves to a commit SHA — this SHA is the **pin** |
| V3 | `git rev-list --count --first-parent <pin> >= 1500` |
| V4 | extant SOURCE files in the pin tree (§6) `>= 100` |
| V5 | extant TEST files in the pin tree (§7) `>= 30` |
| V6 | the §10 backward scan yields exactly 200 eligible source-changing transactions within its 600-edge bound |

**V3 rationale.** §10 takes the last 200 eligible source-changing transactions
within a 600-edge scan bound. `1500` first-parent commits therefore guarantee
at least `1500 − 600 = 900` first-parent edges of history remain strictly
before the earliest evaluation transaction. This is a mechanical feasibility
bound, fixed here before selection.

**V4/V5/V6 read repository content and changed-file paths but no outcome.**
V6 in particular determines only whether a transaction changed a SOURCE file —
which is the *query* definition (§12), not the outcome. The test-role touches
of evaluation transactions are never read at this stage; §20 makes that
structural and RT2 proves it.

### 5.6 No-replacement rule  *(freeze item 5)*

A selected repository failing V1–V6 is recorded as
`INELIGIBLE_ON_VERIFICATION` together with its failing check, remains visible
in `SELECTION-RECEIPT.md`, and is replaced by the next repository in the
**already frozen** §5.4 order for that stratum.

**No repository may be replaced for any other reason, and none may be replaced
after any source↔test outcome is visible — including because its history has
no source↔test signal, its tests are sparse, its history abstains, or its
result is negative or inconvenient.** Every attempt, including every skip and
its mechanical reason, is recorded in the selection receipt.

## 6. Exact source classifier  *(freeze item 6)*

Applied to a repository-relative POSIX path `p`. `segs` = path segments,
`base` = final segment, `ext` = lowercased final extension.

**Excluded directory segments** (if any segment matches, `p` is `OTHER` and can
be neither SOURCE nor TEST):

```
node_modules  vendor  third_party  thirdparty  bower_components  Godeps
dist  build  out  target  coverage  .next  .venv  venv  site-packages
generated  gen  external  testdata  fixtures  __snapshots__  .git
```

**Excluded generated/derived basenames** (SOURCE only):

```
*.min.js  *.bundle.js  *.d.ts  *.pb.go  *_pb.go  *_generated.go  *_gen.go  *_pb2.py
```

**Source extension set:**

```
.go  .py  .js  .jsx  .ts  .tsx  .mjs  .cjs  .java
```

```
SOURCE(p)  ⇔  not excluded-dir(p)
           ∧  not excluded-basename(p)
           ∧  ext(p) ∈ source-extension-set
           ∧  ¬TEST(p)
```

Classifiers are **language-keyed but repository-agnostic**: the same rules run
over every repository in the cohort, with no per-repository branch.

## 7. Exact test classifier  *(freeze item 7)*

```
TEST(p)  ⇔  not excluded-dir(p) ∧ ( T-GO ∨ T-PY ∨ T-JS ∨ T-JAVA )
```

| Rule | Condition |
| -- | -- |
| `T-GO` | `ext == .go` ∧ `base` matches `^.+_test\.go$` |
| `T-PY` | `ext == .py` ∧ ( `base` matches `^test_.+\.py$` ∨ `base` matches `^.+_test\.py$` ∨ `base == conftest.py` ∨ any seg ∈ {`tests`,`test`,`testing`} ) |
| `T-JS` | `ext ∈ {.js,.jsx,.ts,.tsx,.mjs,.cjs}` ∧ ( `base` matches `^.+\.(test\|spec)\.(js\|jsx\|ts\|tsx\|mjs\|cjs)$` ∨ any seg ∈ {`__tests__`,`__test__`,`test`,`tests`,`spec`,`specs`,`e2e`} ) |
| `T-JAVA` | `ext == .java` ∧ ( `segs` contains consecutive `src`,`test` ∨ `base` matches `^.+(Test\|Tests\|TestCase\|IT\|ITCase)\.java$` ∨ `base` matches `^Test.+\.java$` ∨ any seg ∈ {`test`,`tests`} ) |

**TEST takes precedence over SOURCE.** The two roles are mutually exclusive by
construction, and every classified path carries exactly one of
`SOURCE | TEST | OTHER`.

## 8. Transaction-unit rule  *(freeze item 8)*

A **transaction** is one first-parent edge on the default branch: a commit `C`
and its first parent `P`, with changed-file set

```
git diff -M --name-status <P> <C>
```

Merge commits participate through their first-parent diff only. The pin's
first-parent chain defines the total order.

**Transaction eligibility** — a pure size filter, applied to the **raw**
`--name-status` line count before any classification, so that eligibility is
classification-independent and outcome-independent:

```
1 <= rawChangedPathCount <= 50
```

Transactions outside that range are ineligible for **both** history
accumulation and evaluation.

## 9. History / training-window rule  *(freeze item 9)*

**Expanding window, no depth cap, no decay, no recency weighting.**

For evaluation transaction `T`, the history available to `H` and `B0` is
**every eligible transaction (§8) whose commit lies in the first-parent
ancestry of `T0` inclusive**, where `T0` is defined in §10.

Implementation is structural rather than filtered: the miner walks the
first-parent chain oldest→newest maintaining count tables; on reaching an
evaluation transaction `T` it **snapshots the tables, ranks, and only then**
folds `T`'s own contribution in. `T` therefore contributes exactly zero to its
own features by construction, not by assertion. RT1 perturbs this ordering and
must be caught.

## 10. Temporal evaluation-window rule  *(freeze item 10)*

For each repository:

- `pin` = `default_branch` HEAD at clone time (V2), recorded as a SHA.
- Scan the first-parent chain backwards from `pin`, bounded at **600 edges**.
- Collect transactions that are **eligible** (§8) and **source-changing**
  (touch ≥ 1 SOURCE file under §6 after §11 treatment).
- The evaluation set is the **most recent 200** such transactions.
- If fewer than 200 are found within the 600-edge bound, V6 fails and §5.6
  backfill applies.

For each evaluation transaction `T`:

```
T0 = the first parent of T
```

`T0` is the exact preregistered pre-`T` referent. Every candidate test file,
every current-tree feature, and every historical count is derived from `T0` or
earlier. `T` and everything after it are readable **only** by the outcome
stage.

## 11. Rename / delete treatment  *(freeze item 11)*

Applied to `git diff -M --name-status` status codes:

| Status | Treatment |
| -- | -- |
| `A` add | destination path is TOUCHED |
| `M` modify | path is TOUCHED |
| `T` type change | path is TOUCHED |
| `R###` rename | **destination** path is TOUCHED; source path is **not** |
| `C###` copy | **destination** path is TOUCHED; source path is **not** |
| `D` delete | path is **NOT** touched; the file also leaves the tree |

**Rename chains are not resolved to a stable identity.** A file renamed
mid-history contributes its pre-rename co-occurrence counts under its old path
and its post-rename counts under its new path, and the two are not merged.
This is a **recorded limitation**, frozen deliberately in favour of a rule that
is mechanical and auditable; it applies identically to `H`, `B0` and `B1` and
so cannot advantage one method over another. It is restated in `REPORT.md`.

## 12. Query unit  *(freeze item 12)*

**One evaluation transaction `T` is one query.** Not one source file.

The transaction unit is chosen precisely because a per-source-file unit would
manufacture duplicate observations: a transaction touching 12 source files
would contribute 12 near-identical rows sharing one outcome set, silently
reweighting the corpus toward large transactions.

The query input is

```
S(T) = { p : p touched by T (§11) ∧ SOURCE(p) (§6) }
```

`S(T)` is the **only** part of `T` visible to the ranking stage. `|S(T)| >= 1`
by the §10 source-changing requirement.

## 13. Multi-source aggregation rule  *(freeze item 13)*

Frozen **before** outcomes, with both variants named in advance so that
neither can be selected after seeing which predicts better:

| | Rule | Status |
| -- | -- | -- |
| `H` primary | `score(t) = Σ_{s ∈ S(T)} support(s,t)` — additive count evidence | **primary** |
| `H` secondary | `score(t) = max_{s ∈ S(T)} support(s,t)` | reported secondary, `H-MAX` |
| `B1` | `score(t) = max_{s ∈ S(T)} structuralScore(s,t)` — best structural match | primary and only |
| `B0` | source-independent; aggregation not applicable | — |

`H` aggregates counts, so summation is the natural total-evidence rule. `B1`
aggregates a structural similarity, where a maximum is the natural best-match
rule. Both are fixed here; the `H-MAX` sensitivity exists so that the choice
can be audited rather than trusted.

## 14. Historical source↔test scoring and ranking — `H`  *(freeze item 14)*

The simplest count-based source-conditioned signal that answers the question.

```
support_{<T}(s, t) = | { eligible transactions X in the first-parent ancestry
                         of T0 inclusive  :  s ∈ touched(X) ∧ SOURCE(s)
                                          ∧  t ∈ touched(X) ∧ TEST(t) } |
```

```
score_H(t) = Σ_{s ∈ S(T)} support_{<T}(s, t)          for t ∈ Suite(T0)
L_H        = [ t : score_H(t) >= 1 ], ordered by score descending,
             ties broken by ascending lexical path
```

The lexical tie-break is deterministic and carries no popularity or structural
information; it must not be replaced by a B0- or B1-derived tie-break, because
that would contaminate `H` with the very baselines it is being compared to.

**`H` abstains** on a query when no candidate reaches `score_H >= 1`.

`H` contains no decay, no normalization, no confidence, no lift, no learned
weight, no semantic inference, and no author or commit-purpose feature.

## 15. `B0` — test popularity / base rate  *(freeze item 15)*

```
score_B0(t) = | { eligible transactions X in the first-parent ancestry of T0
                  inclusive  :  t ∈ touched(X) ∧ TEST(t) } |      for t ∈ Suite(T0)
L_B0        = [ t : score_B0(t) >= 1 ], score descending, lexical ascending
```

**`B0` is mechanically independent of `S(T)`.** Its computation takes no
argument derived from the queried source files. Consequently `B0`'s ranking is
a pure function of `(repository, T0)`, and is byte-identical under any
permutation or emptying of `S(T)` — this is invariant I5, and RT4 perturbs it.

**Purpose:** does source-conditioned history tell us more than *"these tests
change a lot"*?

## 16. `B1` — deterministic current-tree discovery  *(freeze item 16)*

A single cross-repository rule over cheap `T0` information only. **No history
of any kind. No per-repository branch, and no per-repository tuning after
results.**

**Stem normalization.** For a path `p`, `stem(p)` is `base(p)` minus its final
extension. For a test path `t`, `tstem(t)` applies one pass of:

- strip trailing `_test`, `-test`, `.test`, `_spec`, `-spec`, `.spec`
- strip leading `test_`, `test-`, `Test`
- strip trailing `Test`, `Tests`, `TestCase`, `ITCase`, `IT`

Comparison is lowercase on both sides.

**Mirrored-layout normalization.** Applied uniformly to every repository —
this is one rule that simply does not fire where the layout is absent. In
`dirname(p)`, each segment in

```
main  test  tests  __tests__  __test__  spec  specs  testing  e2e
```

is replaced by the placeholder `@`. Then

```
dirshare(s,t) = number of leading segments common to the normalized dirnames,
                capped at 5
```

**Score.**

```
structuralScore(s,t) = 100 · [ tstem(t) == stem(s) ]
                     +  10 · [ tstem(t) ≠ stem(s)
                               ∧ min(|tstem(t)|,|stem(s)|) >= 4
                               ∧ (tstem(t) ⊃ stem(s) ∨ stem(s) ⊃ tstem(t)) ]
                     +  dirshare(s,t)                                  (0..5)

score_B1(t) = max_{s ∈ S(T)} structuralScore(s,t)          for t ∈ Suite(T0)
L_B1        = [ t : score_B1(t) >= 1 ], score descending, lexical ascending
```

**Recorded limitation.** `B1` is a filename/path/adjacency baseline. **No
cross-language static import or dependency baseline is built**, because doing
so would require a new large multi-language analysis surface that this issue
explicitly forbids. A richer static baseline could plausibly beat `B1`, and
therefore any `H`-over-`B1` margin observed here is an **upper bound** on
`H`'s advantage over deterministic current-tree analysis in general. This
limitation is restated in `B1-CURRENT-TREE.md` and `REPORT.md`.

**`B1` abstains** on a query when no candidate reaches `score_B1 >= 1`.

## 17. Candidate test-suite denominator  *(freeze item 17)*

```
Suite(T0) = { p : p ∈ git ls-tree -r --name-only T0 ∧ TEST(p) (§7) }
```

Every method ranks a subset of `Suite(T0)` and nothing else. The suite contains
**only tests extant in the `T0` tree** — never a test deleted before `T0`,
never a test created by `T` itself.

Outcome test touches that are **not** in `Suite(T0)` — i.e. test files created
by `T` — are structurally unreachable by every method. They are recorded
separately as `NEW_TEST` and are **excluded from the primary recall
denominator**, because counting them would charge all three methods equally
for an impossible target and would depress every number without changing any
comparison. Their exact count is reported per repository in
`DENOMINATOR-AUDIT.md` and `REPORT.md`; they are never silently dropped.

## 18. `K` values  *(freeze item 18)*

```
K ∈ { 1, 3, 5, 10 }
```

Small, operationally meaningful cutoffs. **`K = 10` is the primary.** No `K`
may be added, removed, or promoted after outcomes. There is deliberately no
large `K` that would raise recall trivially.

## 19. Query classification, coverage, abstention, zero-test-touch

### 19.1 Coverage and abstention  *(freeze item 19)*

For method `m` on query `q`, `m` **abstains** iff `|L_m(q)| == 0`.

```
coverage_m(r)   = | { q ∈ POSITIVE(r) : |L_m(q)| >= 1 } | / |POSITIVE(r)|
abstention_m(r) = 1 − coverage_m(r)
```

An abstained query is **retained in every denominator**. It scores
`recall@K = 0`, `RR = 0`, and `fraction@K = 0`. `precision@K` is undefined for
it and it is excluded from the precision mean only — with the excluded count
reported alongside. Abstention is never converted into a silent omission.

### 19.2 Zero-test-touch treatment  *(freeze item 20)*

Every evaluation query is classified into exactly one class:

| Class | Definition |
| -- | -- |
| `POSITIVE` | `|G(q)| >= 1` |
| `NEW_TEST_ONLY` | `|G(q)| == 0` ∧ `T` touched ≥ 1 test file not in `Suite(T0)` |
| `ZERO_TEST_TOUCH` | `T` touched no TEST-role file at all |

where `G(q) = { p : p touched by T ∧ TEST(p) ∧ p ∈ Suite(T0) }`.

**All 200 queries per repository are retained and reported.** Primary
ranking metrics are computed over `POSITIVE` queries, because recall against
an empty target set is undefined rather than zero. The counts of all three
classes, and the `ZERO_TEST_TOUCH` rate, are **primary reported results in
their own right** — if most source-changing transactions touch no test file,
that is a finding about the proposed use, not a nuisance (§23, §30).

## 20. Temporal isolation and outcome isolation

**Separate pre-outcome and outcome code paths**, in separate committed
artifacts, in separate commits:

| Stage | Script | May read | Commits |
| -- | -- | -- | -- |
| Pre-outcome | `scripts/phase-a.mjs` | universe metadata, `T0` trees, pre-`T` history, `S(T)` | `raw/pre-outcome.json` |
| Outcome | `scripts/phase-b.mjs` | everything above **plus** `G(q)` | `raw/outcomes.json`, `raw/results.json` |

The pre-outcome record has a **fixed key allowlist**, asserted mechanically:

```
repo, stratum, pin, T, T0, tIndex, sourcePaths, suiteSize, suiteSha256,
rankedH, rankedHMax, rankedB0, rankedB1, historyTxnCount
```

Assertions run before the pre-outcome commit:

- no key outside the allowlist appears in any record;
- no path in any record is a TEST-role path touched by `T`, unless it is
  independently present in `Suite(T0)` — and the record carries no marker of
  which suite members `T` touched;
- `historyTxnCount(q)` equals the exact number of eligible transactions
  strictly before `T`, and `T`'s SHA is absent from the folded-in set;
- the pre-outcome commit's tree contains no outcome file and no outcome
  script.

The ranking stage never receives `T`'s changed-file set. It receives `S(T)`
only, which is the query by §12.

## 21. Metrics

Let `L_m(q)` be method `m`'s full ranked list, `L_m^K(q)` its first `K`
entries, `G(q)` the extant outcome test touches, `Suite(q)` the `T0` candidate
suite.

### 21.1 Recall  *(freeze item 21)*

```
recall@K(m,q) = | L_m^K(q) ∩ G(q) | / | G(q) |
```

### 21.2 Precision  *(freeze item 21)*

```
precision@K(m,q) = | L_m^K(q) ∩ G(q) | / min( K, |L_m(q)| )     if |L_m(q)| >= 1
                 = undefined                                     if |L_m(q)| == 0
```

`min(K, |L|)` rather than `K`, so that a method returning a short list is
neither penalized for restraint nor credited for padding. The paired
`fraction@K` (§21.4) is what prevents restraint from being a free win.

### 21.3 First relevant rank  *(frozen, therefore reported)*

```
RR(m,q) = 1 / rank of the highest-ranked member of G(q) in the FULL list L_m(q)
        = 0 if G(q) ∩ L_m(q) = ∅
MRR(m,r) = mean over POSITIVE(r)
```

### 21.4 Candidate-set fraction  *(freeze item 22)*

```
fraction@K(m,q) = min( K, |L_m(q)| ) / |Suite(q)|
```

Reported at every `K`, per repository, per method. It is the guard against
buying recall by selecting most of the test suite, and it is an input to the
§24 non-inflation clause.

### 21.5 Aggregation

**Macro-average over `POSITIVE` queries is primary** — each query weighted
equally, so that transactions touching many tests cannot dominate. Micro
(`Σ hits / Σ |G|`) is reported as a secondary. Exact numerators and
denominators are reported for every rate, per repository, and survive into
`REPORT.md`.

**Cohort aggregates are reported but are never the disposition input.** §24
operates on per-repository values.

## 22. Interpretation boundary

The outcome is **test files touched in the later transaction**. It is not, and
may never be relabelled as: regression-catching ground truth; test coverage;
required tests; affected tests; correctness; impact; dependency; test
effectiveness; risk; which tests an agent should run; or which files an agent
should edit.

**The regression-recall construct from the earlier META-289 description is
withdrawn.** It is prohibited to infer that a later fix or revert touching test
`B` shows that `B` would have caught a regression. Revert lineage is not
studied here and is not regression-test ground truth.

Same-transaction source/test change does not establish that the test
exercises, covers, or would catch a regression in the source file.

## 23. Stopping rule and preservation of per-repository results  *(freeze item 23)*

**Stopping rule.** The experiment stops when the four selected repositories
have each produced 200 evaluation queries and §24 returns a disposition.
After outcomes are visible there may be no additional repository, no
additional query, no additional `K`, no additional metric, no additional
baseline, no additional aggregation rule, and no re-run under altered
parameters. The `H-MAX` sensitivity (§13) and the micro aggregate (§21.5) are
the **only** secondary analyses, and both are named here in advance.

**Per-repository preservation.** Every per-repository result is reported
whatever it shows. Divergent repository results are **never** averaged away;
where they exist they are the finding (§30).

## 24. Incremental-value gate and disposition arithmetic  *(freeze item 24)*

**Primary metric: macro-averaged `recall@10` over `POSITIVE` queries, per
repository.**

Per repository `r`:

```
Δ0(r) = macroRecall@10_H(r) − macroRecall@10_B0(r)
Δ1(r) = macroRecall@10_H(r) − macroRecall@10_B1(r)

NONINFLATED(r) ⇔ meanFraction@10_H(r)
                 <= 1.25 × max( meanFraction@10_B0(r), meanFraction@10_B1(r) )

POS(r) = 1  ⇔  Δ0(r) >= 0.05  ∧  Δ1(r) >= 0.05  ∧  NONINFLATED(r)
```

**Materiality threshold: `0.05` absolute recall@10.** Fixed here, applied
identically to both comparisons and in both directions.

**Disposition ladder — strict order, first match wins.** `R = 4`.

| # | Disposition | Condition |
| -- | -- | -- |
| D1 | `INSUFFICIENT_SOURCE_TEST_SIGNAL` | `#{ r : coverage_H(r) < 0.50 } >= 2` **OR** total `POSITIVE` queries across the cohort `< 100` |
| D2 | `HISTORY_ADDS_INCREMENTAL_COUPDATE_SIGNAL` | `Σ_r POS(r) >= 3` **AND** no `r` has `Δ1(r) <= −0.05` |
| D3 | `MIXED_BY_REPOSITORY_OR_TESTING_CULTURE` | `1 <= Σ_r POS(r) <= 2` |
| D4 | `HISTORY_REPLICATES_BASE_RATE_ONLY` | `Σ_r POS(r) == 0` **AND** `#{ r : Δ0(r) < 0.05 } >= 3` |
| D5 | `CURRENT_TREE_MATCHES_OR_BEATS_HISTORY` | otherwise (terminal) |

D1 is evaluated first because a sparse or abstaining signal cannot answer the
question in either direction, and must not be reported as a defeat of `H` on
the merits.

Additionally, and reported regardless of which rung fires, per repository and
per baseline: exact per-query **win / loss / tie counts** on `recall@10`
(`H` vs `B0`, `H` vs `B1`). These are descriptive; they do not enter the
ladder.

**Dispositions may not be renamed or redefined after results.** Thresholds
above are final as of this commit.

## 25. Validation

### 25.1 Invariants — must hold

| # | Invariant |
| -- | -- |
| I1 | selected cohort reproducible from committed universe + seed alone |
| I2 | every evaluation query has `T0` strictly before `T`, and `T0` is `T`'s first parent |
| I3 | `T` contributes zero historical features to itself |
| I4 | outcome changed-file/test set absent from every pre-outcome record and from the pre-outcome commit tree |
| I5 | `B0` is source-independent: byte-identical ranking under permutation/emptying of `S(T)` |
| I6 | `B1` is history-independent: byte-identical ranking under a zeroed history accumulator |
| I7 | `H` uses pre-`T` history only |
| I8 | source/test role labels follow the §6/§7 classifiers exactly |
| I9 | `Suite(T0)` contains only paths extant in the `T0` tree |
| I10 | every reported rate carries an exact numerator and denominator that match `raw/` |
| I11 | no selected repository silently replaced; every V-failure recorded |

### 25.2 Red tests — must be CAUGHT, and must be proven non-inert

| # | Perturbation | Must change |
| -- | -- | -- |
| RT1 | fold `T`'s own transaction into the accumulator **before** ranking | `H` ranking / recall on ≥ 1 query |
| RT2 | splice `G(q)` members to the head of `L_H(q)` | `recall@10_H` |
| RT3 | invert the §7 test classifier for one rule (`_test.go` → SOURCE) | role labels, `S(T)`, `Suite(T0)` |
| RT4 | make `B0` add `+1` for co-occurrence with `S(T)` | `B0` ranking |
| RT5 | make `B1` add historical support to `structuralScore` | `B1` ranking |
| RT6 | inject a non-extant (pre-`T0`-deleted) path into `Suite(T0)` | suite size and `fraction@K` |
| RT7 | flip one query's outcome set `G(q)` | `recall@10` |

**Every red test must print the measured quantity before and after its
perturbation and assert they differ. A perturbation that leaves the measured
quantity unchanged is `INVALID`, not `PASS`,** and the run fails.

## 26. Deviation policy

Any departure from this document — including an environment failure that makes
a frozen rule unexecutable — is recorded verbatim in `REPORT.md` under
`DEVIATIONS`, with the reason, the exact rule affected, and the substitute
applied. Silent deviation is a validation failure.

**Parameters may not be changed after evaluation outcomes are visible.** The
only freedom retained by §24 is none: its thresholds are final as of this
commit.
