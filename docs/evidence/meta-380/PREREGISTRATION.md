# PREREGISTRATION — META-380

**Issue:** Linear META-380 — *Replicate source-test historical residual on
unseen TypeScript repositories.*

**Durable question owner:** Fibery **OQ-15**. **Execution owner:** Linear
META-380. **Evidence owner:** `workspacejson/cli`, `docs/evidence/meta-380/`.

**This document is frozen before any repository is selected and before any
evaluation transaction outcome is read or computed.** The commit that
introduces this file contains no outcome-stage code and no outcome-stage data.
No parameter below may be changed after evaluation outcomes are visible.
Deviations are governed by §28.

## Required-freeze mapping

The execution contract enumerates 24 items that must be frozen. Every one is
frozen below; this table is the audit index.

| # | Required freeze item | Section |
| --: | -- | -- |
| 1 | universe and exclusions | §5.1 |
| 2 | eligibility | §5.2 |
| 3 | seed/rule and cohort size | §5.3 |
| 4 | no-replacement rule | §5.4 |
| 5 | SOURCE/TEST classifiers | §6, §7 |
| 6 | transaction and T0 rules | §8, §10 |
| 7 | historical training window | §9 |
| 8 | evaluation window | §10 |
| 9 | rename/delete handling | §11 |
| 10 | query unit | §12 |
| 11 | multi-source aggregation | §13 |
| 12 | H ranking | §14 |
| 13 | B0 ranking | §15 |
| 14 | B1 ranking | §16 |
| 15 | B2_STATIC/v1 and TypeScript compatibility | §17 |
| 16 | candidate-suite denominator | §18 |
| 17 | K values | §19 |
| 18 | POSITIVE / NEW_TEST_ONLY / ZERO_TEST_TOUCH | §20 |
| 19 | coverage/abstention treatment | §20 |
| 20 | primary metric | §21 |
| 21 | materiality threshold | §21 |
| 22 | B2 validity rule | §22 |
| 23 | disposition arithmetic | §23 |
| 24 | stopping rule | §24 |

---

## 1. Exact question

> On previously unseen TypeScript repositories, does pre-transaction
> source-conditioned source-test co-update history retain material
> incremental later-test-co-touch signal over BOTH source-independent test
> popularity and a frozen native-TypeScript T0 static dependency baseline?

The observed outcome is **test files touched in the later transaction**, and
nothing else. §27 states what that outcome is not.

## 2. Authoritative inputs and non-inheritance

Verified predecessor authority:

| Input | Status |
| -- | -- |
| META-289 results `workspacejson/cli@741229352ebacf8c0268cbe30265fbd34260b3ba` | verified remotely |
| META-289 preregistration `8f3f762dbc6ae7006f2317fb6137e6e2a754a92a` | verified remotely |
| META-289 pre-outcome freeze `7bd2f17c1b715875d0dc8dbace5d2002f46a29dd` | verified remotely |
| META-379 diagnostic `workspacejson/cli@e1b2cfa42d75f623455677283a894d21b20d0c53` | verified remotely |
| META-379 disposition `HISTORY_RETAINS_RESIDUAL_SIGNAL` | diagnostic only, not confirmatory |

**Reused as machinery only** — from META-289: classifiers, transaction unit,
H/B0/B1 construction, candidate-suite denominator, query classification,
metrics. From META-379: B2_STATIC/v1 design, depth, ranking order.

**Explicitly NOT inherited:** no number from META-289, META-375, META-377,
META-378, or META-379 enters any rule, threshold, or expectation here. The
META-379 diagnostic values (H R@10 = 0.6816, B2 R@10 = 0.6181, H-B2 =
+0.0635) are recorded as context only and are not inputs to any rule.

## 3. Prohibitions binding this issue

This experiment does **not**, and no artifact under
`docs/evidence/meta-380/` may:

- run an AI-agent experiment;
- implement `workspacejson tests-for`;
- change workspace.json semantics, producer behavior, or the existing
  co-change ranking/cap;
- add a schema field or CLI command;
- introduce learned ranking, LLM classification, decay weighting, normalized
  importance, inferred semantic dependency, bot/AI-author labels,
  commit-purpose inference, consequentiality, risk, or recommendation scores;
- add static dependency data to the standard;
- test new moderators such as testing culture, monorepo shape, framework, or
  package structure;
- contact maintainers;
- restart generic co-change research.

This is measurement, not producer design.

## 4. Anti-leak exclusions

The following are excluded from the universe by exact `full_name` before
ordering, so that no repository already examined by a predecessor experiment
can enter this cohort:

| Source | Excluded `full_name` |
| -- | -- |
| META-289 cohort | `remult/remult`, `flyteorg/flyte`, `LuckPerms/LuckPerms`, `kornia/kornia` |
| META-375 discovery | `formatjs/formatjs`, `JamieMason/syncpack`, `polyfy/polylith` |
| META-378 cohort | `nteract/hydrogen`, `thepowersgang/rust_os`, `clojure/core.typed`, `hyperledger/fabric`, `scikit-image/scikit-image` |
| Self-ownership | any repository whose owner is `workspacejson` |

**Do not reuse `remult/remult` at a different historical basis as
confirmation.** It is excluded by exact `full_name`, not by basis.

## 5. Corpus

### 5.1 Repository universe *(freeze item 1)*

**Single stratum: TypeScript.** The META-289 discovery found the residual
signal only in the TypeScript repository (remult/remult), and META-379
confirmed it diagnostically on that same repository. The replication tests
whether that residual survives on **previously unseen TypeScript
repositories**.

Frozen query template, `search/repositories`, `sort=stars`, `order=desc`,
`per_page=100`, paginated to GitHub's hard 1000-result cap:

```
language:TypeScript stars:1000..40000 created:<2022-01-01 pushed:>2026-01-01
fork:false archived:false size:5000..400000
```

This is the identical query template used by META-289 for its TypeScript
stratum, ensuring the same sampling frame. The committed snapshot
`raw/universe.json` is the universe, not the live API. Where `total_count`
exceeds 1000 the universe is defined as exactly the enumerable slice recorded
in the receipt.

### 5.2 Eligibility — metadata only, no outcome *(freeze item 2)*

Every predicate is re-verified offline from the snapshot record rather than
trusted from the query.

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
| E10 | `language` equals `TypeScript` |

Nothing in E1-E10 touches repository content, history, tests, or any outcome.

### 5.3 Seed, selection rule, and cohort size *(freeze item 3)*

```
SEED = "META-380/OQ-15/source-test-coupdate-replication/v1"
orderKey(full_name) = sha256(SEED + ":" + full_name), lowercase hex
ordering = ascending lexical orderKey
```

The order depends only on the seed and the repository name. It is therefore
fixed before any repository property beyond §5.2 eligibility is consulted, is
reproducible from the committed snapshot alone, and, because it is frozen
before any clone exists, cannot be steered by §5.4 backfill.

**Cohort size: exactly 5 repositories.** The first 5 repositories in the
frozen order that pass §5.4 verification. Not 4, not 6. The cohort is fixed
here and cannot grow or shrink in response to results.

### 5.4 Post-selection mechanical verification and no-replacement rule *(freeze item 4)*

Applied **after** ordering and **before** any evaluation outcome exists.

| # | Check |
| -- | -- |
| V1 | a full, non-shallow clone succeeds |
| V2 | `default_branch` HEAD resolves to a commit SHA — this SHA is the **pin** |
| V3 | `git rev-list --count --first-parent <pin> >= 1500` |
| V4 | extant SOURCE files in the pin tree (§6) `>= 100` |
| V5 | extant TEST files in the pin tree (§7) `>= 30` |
| V6 | the §10 backward scan yields exactly 200 eligible source-changing transactions within its 600-edge bound |
| V7 | at least one `tsconfig.json` exists in the pin tree |

**V3 rationale.** §10 takes the last 200 eligible source-changing transactions
within a 600-edge scan bound. `1500` first-parent commits guarantee at least
`1500 - 600 = 900` first-parent edges of history remain strictly before the
earliest evaluation transaction.

**V7 rationale.** B2_STATIC/v1 requires native TypeScript module resolution,
which requires a `tsconfig.json`. A repository without one cannot support the
B2 baseline and is mechanically ineligible.

**V4/V5/V6/V7 read repository content and changed-file paths but no outcome.**
V6 determines only whether a transaction changed a SOURCE file, which is the
query definition (§12), not the outcome.

**No-replacement rule.** A selected repository failing V1-V7 is recorded as
`INELIGIBLE_ON_VERIFICATION` with its failing check, remains visible in
`SELECTION-RECEIPT.md`, and is replaced by the next repository in the
**already frozen** §5.3 order.

**No repository may be replaced for any other reason, and none may be replaced
after any source-test outcome is visible — including because its history has
no source-test signal, its tests are sparse, its history abstains, B2 is
non-distinctive, or its result is negative or inconvenient.** Every attempt,
including every skip and its mechanical reason, is recorded in the selection
receipt.

## 6. Exact source classifier *(freeze item 5)*

Applied to a repository-relative POSIX path `p`. `segs` = path segments,
`base` = final segment, `ext` = lowercased final extension.

**Excluded directory segments** (if any segment matches, `p` is `OTHER`):

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
SOURCE(p)  iff  not excluded-dir(p)
           and  not excluded-basename(p)
           and  ext(p) in source-extension-set
           and  not TEST(p)
```

Classifiers are **language-keyed but repository-agnostic**: the same rules run
over every repository in the cohort, with no per-repository branch. Carried
verbatim from META-289 §6.

## 7. Exact test classifier *(freeze item 5)*

```
TEST(p)  iff  not excluded-dir(p) and ( T-GO or T-PY or T-JS or T-JAVA )
```

| Rule | Condition |
| -- | -- |
| `T-GO` | `ext == .go` and `base` matches `^.+_test\.go$` |
| `T-PY` | `ext == .py` and ( `base` matches `^test_.+\.py$` or `base` matches `^.+_test\.py$` or `base == conftest.py` or any seg in {`tests`,`test`,`testing`} ) |
| `T-JS` | `ext in {.js,.jsx,.ts,.tsx,.mjs,.cjs}` and ( `base` matches `^.+\.(test\|spec)\.(js\|jsx\|ts\|tsx\|mjs\|cjs)$` or any seg in {`__tests__`,`__test__`,`test`,`tests`,`spec`,`specs`,`e2e`} ) |
| `T-JAVA` | `ext == .java` and ( `segs` contains consecutive `src`,`test` or `base` matches `^.+(Test\|Tests\|TestCase\|IT\|ITCase)\.java$` or `base` matches `^Test.+\.java$` or any seg in {`test`,`tests`} ) |

**TEST takes precedence over SOURCE.** The two roles are mutually exclusive by
construction. Carried verbatim from META-289 §7. For this TypeScript-only
cohort, only the T-JS rule fires, but all rules are retained for fidelity.

## 8. Transaction-unit rule *(freeze item 6)*

A **transaction** is one first-parent edge on the default branch: a commit `C`
and its first parent `P`, with changed-file set

```
git diff -M --name-status <P> <C>
```

Merge commits participate through their first-parent diff only. The pin's
first-parent chain defines the total order.

**Transaction eligibility** — a pure size filter, applied to the **raw**
`--name-status` line count before any classification:

```
1 <= rawChangedPathCount <= 50
```

Transactions outside that range are ineligible for **both** history
accumulation and evaluation. Carried verbatim from META-289 §8.

## 9. History / training-window rule *(freeze item 7)*

**Expanding window, no depth cap, no decay, no recency weighting.**

For evaluation transaction `T`, the history available to `H` and `B0` is
**every eligible transaction (§8) whose commit lies in the first-parent
ancestry of T0 inclusive**, where `T0` is defined in §10.

Implementation is structural rather than filtered: the miner walks the
first-parent chain oldest to newest maintaining count tables; on reaching an
evaluation transaction `T` it **snapshots the tables, ranks, and only then**
folds `T`'s own contribution in. `T` therefore contributes exactly zero to its
own features by construction. Carried verbatim from META-289 §9.

## 10. Temporal evaluation-window rule *(freeze item 8)*

For each repository:

- `pin` = `default_branch` HEAD at clone time (V2), recorded as a SHA.
- Scan the first-parent chain backwards from `pin`, bounded at **600 edges**.
- Collect transactions that are **eligible** (§8) and **source-changing**
  (touch >= 1 SOURCE file under §6 after §11 treatment).
- The evaluation set is the **most recent 200** such transactions.
- If fewer than 200 are found within the 600-edge bound, V6 fails and §5.4
  backfill applies.

For each evaluation transaction `T`:

```
T0 = the first parent of T
```

`T0` is the exact preregistered pre-`T` referent. Every candidate test file,
every current-tree feature, and every historical count is derived from `T0` or
earlier. `T` and everything after it are readable **only** by the outcome
stage. Carried verbatim from META-289 §10.

## 11. Rename / delete treatment *(freeze item 9)*

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
This applies identically to `H`, `B0`, `B1`, and `B2` and so cannot advantage
one method over another. Carried verbatim from META-289 §11.

## 12. Query unit *(freeze item 10)*

**One evaluation transaction `T` is one query.** Not one source file.

The query input is

```
S(T) = { p : p touched by T (§11) and SOURCE(p) (§6) }
```

`S(T)` is the **only** part of `T` visible to the ranking stage. `|S(T)| >= 1`
by the §10 source-changing requirement. Carried verbatim from META-289 §12.

## 13. Multi-source aggregation rule *(freeze item 11)*

| | Rule | Status |
| -- | -- | -- |
| `H` primary | `score(t) = sum over s in S(T) of support(s,t)` — additive count evidence | **primary** |
| `H` secondary | `score(t) = max over s in S(T) of support(s,t)` | reported secondary, `H-MAX` |
| `B1` | `score(t) = max over s in S(T) of structuralScore(s,t)` — best structural match | primary and only |
| `B2` | `score(t) = max over s in S(T) of b2score(s,t)` — best dependency path | primary and only |
| `B0` | source-independent; aggregation not applicable | — |

Carried verbatim from META-289 §13, with B2 added from META-379.

## 14. Historical source-test scoring and ranking — `H` *(freeze item 12)*

```
support_{<T}(s, t) = | { eligible transactions X in the first-parent ancestry
                         of T0 inclusive  :  s in touched(X) and SOURCE(s)
                                          and  t in touched(X) and TEST(t) } |
```

```
score_H(t) = sum over s in S(T) of support_{<T}(s, t)     for t in Suite(T0)
L_H        = [ t : score_H(t) >= 1 ], ordered by score descending,
             ties broken by ascending lexical path
```

The lexical tie-break is deterministic and carries no popularity or structural
information.

**`H` abstains** on a query when no candidate reaches `score_H >= 1`.

`H` contains no decay, no normalization, no confidence, no lift, no learned
weight, no semantic inference, and no author or commit-purpose feature.
Carried verbatim from META-289 §14.

## 15. `B0` — test popularity / base rate *(freeze item 13)*

```
score_B0(t) = | { eligible transactions X in the first-parent ancestry of T0
                  inclusive  :  t in touched(X) and TEST(t) } |     for t in Suite(T0)
L_B0        = [ t : score_B0(t) >= 1 ], score descending, lexical ascending
```

**`B0` is mechanically independent of `S(T)`.** Its computation takes no
argument derived from the queried source files. Its ranking is a pure function
of `(repository, T0)`, byte-identical under any permutation or emptying of
`S(T)`. Carried verbatim from META-289 §15.

## 16. `B1` — deterministic current-tree discovery *(freeze item 14)*

A single cross-repository rule over cheap `T0` information only. **No history
of any kind. No per-repository branch, and no per-repository tuning after
results.**

**Stem normalization.** For a path `p`, `stem(p)` is `base(p)` minus its final
extension. For a test path `t`, `tstem(t)` applies one pass of:

- strip trailing `_test`, `-test`, `.test`, `_spec`, `-spec`, `.spec`
- strip leading `test_`, `test-`, `Test`
- strip trailing `Test`, `Tests`, `TestCase`, `ITCase`, `IT`

Comparison is lowercase on both sides.

**Mirrored-layout normalization.** In `dirname(p)`, each segment in

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
structuralScore(s,t) = 100 * [ tstem(t) == stem(s) ]
                     +  10 * [ tstem(t) != stem(s)
                               and min(|tstem(t)|,|stem(s)|) >= 4
                               and (tstem(t) superset stem(s) or stem(s) superset tstem(t)) ]
                     +  dirshare(s,t)                                  (0..5)

score_B1(t) = max over s in S(T) of structuralScore(s,t)     for t in Suite(T0)
L_B1        = [ t : score_B1(t) >= 1 ], score descending, lexical ascending
```

**`B1` abstains** on a query when no candidate reaches `score_B1 >= 1`.
Carried verbatim from META-289 §16.

## 17. `B2_STATIC/v1` — native TypeScript T0 static dependency baseline *(freeze item 15)*

Uses only each query's T0 tree. Resolves TypeScript import declarations
through that T0's native TypeScript compiler API and the nearest ancestor
`tsconfig.json` (falling back to the T0 root `tsconfig.json`). No repository
history, transaction-T changed-file set, or outcome file is available to this
stage.

**Directed edge:** importer to resolved local module. For candidate test `t`,
a path is searched in that direction from `t` to any source in the frozen
multi-source query, breadth-first, maximum depth **4**. Cycles are visited
once. A barrel/index file is an ordinary resolved node; the path continues
through it. TS/JS files may be intermediate nodes; candidates and queried
sources retain the unchanged META-289 role classifier. External/unresolved
modules yield no edge. Path aliases and project references are honored
insofar as `ts.resolveModuleName` with the nearest project options resolves
them. Cross-package local imports remain edges and package equality is the
nearest ancestor `package.json` identity.

**B2 score per (s, t) pair:**

```
hasPath(s, t)     = 1 if a directed path exists from t to s within depth 4, else 0
pathDistance(s,t) = shortest BFS distance from t to s, or infinity if no path
samePackage(s,t)  = 1 if nearest ancestor package.json identity matches, else 0
b1Score(s,t)      = structuralScore(s,t) from §16 (reimplemented separately, no history)
```

**Ranking order (lexicographic, first wins):**

1. `hasPath` descending (path exists before no path)
2. `pathDistance` ascending (shorter before longer; infinity last)
3. `samePackage` descending
4. frozen B1 `structuralScore` descending
5. lexical path ascending

```
score_B2(t) = max over s in S(T) of b2score(s,t)     for t in Suite(T0)
L_B2        = [ t : score_B2(t) >= 1 ], ordered by the ranking order above
```

**`B2` abstains** on a query when no candidate reaches `score_B2 >= 1`.

**B2 may use zero history and zero transaction-T outcome information.**
Carried verbatim from META-379 STATIC-BASELINE-DESIGN.md.

**TypeScript compatibility rule.** Because this cohort is TypeScript-only,
B2_STATIC/v1 is applicable to every selected repository. The `tsconfig.json`
requirement is enforced by V7 (§5.4). No compatibility adaptation is needed
and none may be added after outcomes.

## 18. Candidate test-suite denominator *(freeze item 16)*

```
Suite(T0) = { p : p in git ls-tree -r --name-only T0 and TEST(p) (§7) }
```

Every method ranks a subset of `Suite(T0)` and nothing else. The suite
contains **only tests extant in the T0 tree** — never a test deleted before
T0, never a test created by `T` itself.

Outcome test touches that are **not** in `Suite(T0)` — i.e. test files created
by `T` — are structurally unreachable by every method. They are recorded
separately as `NEW_TEST` and are **excluded from the primary recall
denominator**. Their exact count is reported per repository. Carried verbatim
from META-289 §17.

## 19. `K` values *(freeze item 17)*

```
K in { 1, 3, 5, 10 }
```

**`K = 10` is the primary.** No `K` may be added, removed, or promoted after
outcomes. Carried verbatim from META-289 §18.

## 20. Query classification, coverage, abstention, zero-test-touch *(freeze items 18, 19)*

Every evaluation query is classified into exactly one class:

| Class | Definition |
| -- | -- |
| `POSITIVE` | `|G(q)| >= 1` |
| `NEW_TEST_ONLY` | `|G(q)| == 0` and `T` touched >= 1 test file not in `Suite(T0)` |
| `ZERO_TEST_TOUCH` | `T` touched no TEST-role file at all |

where `G(q) = { p : p touched by T and TEST(p) and p in Suite(T0) }`.

**All 200 queries per repository are retained and reported.** Primary ranking
metrics are computed over `POSITIVE` queries. The counts of all three classes
are primary reported results.

For method `m` on query `q`, `m` **abstains** iff `|L_m(q)| == 0`.

```
coverage_m(r)   = | { q in POSITIVE(r) : |L_m(q)| >= 1 } | / |POSITIVE(r)|
abstention_m(r) = 1 - coverage_m(r)
```

An abstained query is **retained in every denominator**. It scores
`recall@K = 0`, `RR = 0`, and `fraction@K = 0`. `precision@K` is undefined for
it and it is excluded from the precision mean only. Carried verbatim from
META-289 §19.

## 21. Primary metric, materiality, and repository-level arithmetic *(freeze items 20, 21)*

**Primary metric: macro-averaged `recall@10` over `POSITIVE` queries, per
repository.**

For each repository `r`:

```
delta0(r) = macroRecall@10_H(r) - macroRecall@10_B0(r)
delta2(r) = macroRecall@10_H(r) - macroRecall@10_B2(r)

NONINFLATED(r) iff meanFraction@10_H(r)
                 <= 1.25 * max( meanFraction@10_B0(r), meanFraction@10_B2(r) )
```

**Materiality threshold: 0.05 absolute recall@10.** Fixed here, applied
identically to both comparisons and in both directions.

**Repository-level replicated positive:**

```
POS(r) = 1  iff  delta0(r) >= 0.05  and  delta2(r) >= 0.05  and  NONINFLATED(r)
```

**Repository-level negative (current-tree explains):**

```
NEG(r) = 1  iff  delta2(r) <= -0.05
```

A `delta2` within `(-0.05, +0.05)` is **neutral** on the static residual.

**Minimum informative-repository rule.** A repository is **informative** iff:

1. `POSITIVE(r) >= 20` (enough POSITIVE queries to compute a meaningful macro
   average), and
2. B2 validity passes (§22), and
3. `coverage_H(r) >= 0.50` (H does not abstain on most queries).

A repository failing any of these is **uninformative** and does not enter the
disposition arithmetic, but its results are reported.

### Secondary metrics

At K = 1, 3, 5, 10 report H, B0, B1, and B2 recall plus precision, MRR,
coverage, candidate-set fraction, H abstention, and paired H-vs-B2
wins/losses/ties.

Micro aggregates (`sum hits / sum |G|`) are reported as secondary. Cohort
aggregates are reported but are never the disposition input.

### Metric definitions

```
recall@K(m,q)     = | L_m^K(q) intersect G(q) | / | G(q) |
precision@K(m,q)  = | L_m^K(q) intersect G(q) | / min( K, |L_m(q)| )    if |L_m(q)| >= 1
                  = undefined                                              if |L_m(q)| == 0
RR(m,q)           = 1 / rank of highest-ranked member of G(q) in L_m(q)
                  = 0 if G(q) intersect L_m(q) = empty
MRR(m,r)          = mean over POSITIVE(r)
fraction@K(m,q)   = min( K, |L_m(q)| ) / |Suite(q)|
```

Carried verbatim from META-289 §21.

## 22. B2 validity per repository *(freeze item 22)*

Before outcomes, freeze the exact mechanical validity threshold. B2 is
**valid** for repository `r` iff all hold:

| # | Check |
| -- | -- |
| BV1 | T0 SOURCE count `>= 100` |
| BV2 | T0 TEST count `>= 30` |
| BV3 | resolved local import-edge count `>= 50` |
| BV4 | fraction of queries with `>= 1` test-to-source path `>= 0.10` |
| BV5 | fraction of B2 rankings differing from B1 `>= 0.05` |
| BV6 | import-edge ablation is non-inert: removing all import edges changes at least 5% of B2 rankings |

If B2 is non-distinctive under the frozen rule (any of BV1-BV6 fails), mark
the repository `STATIC_BASELINE_NOT_DISTINCTIVE`. Do not redesign B2 or count
the repository as evidence for or against H.

Report at minimum:

- T0 SOURCE count
- T0 TEST count
- resolved local import-edge count
- fraction of queries with `>= 1` test-to-source path
- fraction of rankings differing from B1
- top-10 membership moves (B2 vs B1)
- import-edge ablation behavior

## 23. Overall disposition arithmetic *(freeze item 23)*

Let `I` = number of informative repositories, `P` = number of informative
repositories with `POS(r) = 1`, `N` = number of informative repositories with
`NEG(r) = 1`.

**Disposition ladder — strict order, first match wins.**

| # | Disposition | Condition |
| -- | -- | -- |
| D1 | `INSUFFICIENT_REPLICATION_SUPPORT` | `I < 3` (fewer than 3 informative repositories due to frozen outcome-side sparsity, B2 non-distinctiveness, or insufficient POSITIVE queries) |
| D2 | `RESIDUAL_SIGNAL_REPLICATES` | `P >= 3` and `N == 0` and B2 validity passes on all informative repositories and no candidate-set inflation explains the gain |
| D3 | `RESIDUAL_SIGNAL_MIXED` | `1 <= P <= 2` (meaningful positive and negative/neutral coexist, or only 1-2 clear the positive gate) |
| D4 | `CURRENT_TREE_EXPLAINS_RESIDUAL` | `P == 0` and `N >= 3` (zero repositories clear the replicated-positive gate and at least 3 informative repositories have `delta2 < -0.05`, with B2 matching/beating H) |
| D5 | `INSUFFICIENT_REPLICATION_SUPPORT` | otherwise (terminal) |

D1 is evaluated first because a sparse or abstaining signal cannot answer the
question in either direction.

**Dispositions may not be renamed or redefined after results.** Thresholds
above are final as of this commit.

## 24. Stopping rule *(freeze item 24)*

The experiment stops when the 5 selected repositories have each produced 200
evaluation queries and §23 returns a disposition. After outcomes are visible
there may be no additional repository, no additional query, no additional `K`,
no additional metric, no additional baseline, no additional aggregation rule,
and no re-run under altered parameters. The `H-MAX` sensitivity (§13) and the
micro aggregate (§21) are the **only** secondary analyses, and both are named
here in advance.

**Per-repository preservation.** Every per-repository result is reported
whatever it shows. Divergent repository results are never averaged away.

## 25. Temporal isolation and outcome isolation

**Separate pre-outcome and outcome code paths**, in separate committed
artifacts, in separate commits:

| Stage | Script | May read | Commits |
| -- | -- | -- | -- |
| Pre-outcome | `scripts/phase-a.mjs` | universe metadata, T0 trees, pre-T history, S(T), B2 graphs | `raw/pre-outcome.json` |
| Outcome | `scripts/phase-b.mjs` | everything above **plus** `G(q)` | `raw/outcomes.json`, `raw/results.json` |

The pre-outcome record has a **fixed key allowlist**, asserted mechanically:

```
repo, stratum, pin, T, T0, tIndex, sourcePaths, suiteSize, suiteSha256,
rankedH, rankedHMax, rankedB0, rankedB1, rankedB2, historyTxnCount,
b2GraphSha256, b2EdgeCount, b2Validity
```

Assertions run before the pre-outcome commit:

- no key outside the allowlist appears in any record;
- no path in any record is a TEST-role path touched by `T`, unless it is
  independently present in `Suite(T0)`;
- `historyTxnCount(q)` equals the exact number of eligible transactions
  strictly before `T`, and `T`'s SHA is absent from the folded-in set;
- the pre-outcome commit's tree contains no outcome file and no outcome
  script;
- B2 graph and validity data are derived solely from T0 trees and contain no
  history or outcome information.

The ranking stage never receives `T`'s changed-file set. It receives `S(T)`
only, which is the query by §12.

## 26. Validation

### 26.1 Invariants — must hold

| # | Invariant |
| -- | -- |
| I1 | selected cohort reproducible from committed universe + seed alone |
| I2 | every evaluation query has `T0` strictly before `T`, and `T0` is `T`'s first parent |
| I3 | `T` contributes zero historical features to itself |
| I4 | outcome changed-file/test set absent from every pre-outcome record and from the pre-outcome commit tree |
| I5 | `B0` is source-independent: byte-identical ranking under permutation/emptying of `S(T)` |
| I6 | `B1` is history-independent: byte-identical ranking under a zeroed history accumulator |
| I7 | `H` uses pre-T history only |
| I8 | source/test role labels follow the §6/§7 classifiers exactly |
| I9 | `Suite(T0)` contains only paths extant in the T0 tree |
| I10 | every reported rate carries an exact numerator and denominator that match `raw/` |
| I11 | no selected repository silently replaced; every V-failure recorded |
| I-EXCL | zero rows from excluded predecessor repositories |
| I-B2 | B2 contains no history or outcome; graph derived solely from T0 |
| I-B2V | B2 validity statistics match frozen thresholds |

### 26.2 Red tests — must be CAUGHT, and must be proven non-inert

| # | Perturbation | Must change |
| -- | -- | -- |
| RT1 | fold `T`'s own transaction into the accumulator **before** ranking | `H` ranking / recall on >= 1 query |
| RT2 | splice `G(q)` members to the head of `L_H(q)` | `recall@10_H` |
| RT3 | invert the §7 test classifier for one rule | role labels, `S(T)`, `Suite(T0)` |
| RT4 | make `B0` add `+1` for co-occurrence with `S(T)` | `B0` ranking |
| RT5 | make `B1` add historical support to `structuralScore` | `B1` ranking |
| RT6 | inject a non-extant (pre-T0-deleted) path into `Suite(T0)` | suite size and `fraction@K` |
| RT7 | flip one query's outcome set `G(q)` | `recall@10` |
| RT8 | inject one excluded predecessor repository into the cohort | exclusion check fires |
| RT9 | inject history/outcome information into B2 graph construction | B2 ranking changes |
| RT10 | perturb import-edge resolution (remove all edges) | B2 ranking changes (non-inert ablation) |

**Every red test must print the measured quantity before and after its
perturbation and assert they differ. A perturbation that leaves the measured
quantity unchanged is `INVALID`, not `PASS`,** and the run fails.

## 27. Interpretation boundary

The outcome is **test files touched in the later transaction**. It is not, and
may never be relabelled as: regression-catching ground truth; test coverage;
required tests; affected tests; correctness; impact; dependency; test
effectiveness; risk; which tests an agent should run; or which files an agent
should edit.

Even `RESIDUAL_SIGNAL_REPLICATES` establishes only reproducible
**observational later test-file co-touch signal**. It does not establish
dependency, coverage, required tests, regression-catching ability, impact,
correctness, risk, which tests an agent should run/edit, or consumer or agent
value.

Any consumer experiment requires a separate explicit decision after
replication.

## 28. Deviation policy

Any departure from this document — including an environment failure that makes
a frozen rule unexecutable — is recorded verbatim in `REPORT.md` under
`DEVIATIONS`, with the reason, the exact rule affected, and the substitute
applied. Silent deviation is a validation failure.

**Parameters may not be changed after evaluation outcomes are visible.** The
only freedom retained by §23 is none: its thresholds are final as of this
commit.
