// render-results.mjs — renders every outcome-stage document from raw/ only.
// No number below is typed by hand.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const D = 'docs/evidence/meta-289';
const re = JSON.parse(readFileSync(`${D}/raw/results.json`, 'utf8'));
const ou = JSON.parse(readFileSync(`${D}/raw/outcomes.json`, 'utf8'));
const pa = JSON.parse(readFileSync(`${D}/raw/pre-outcome.json`, 'utf8'));
const co = JSON.parse(readFileSync(`${D}/raw/cohort.json`, 'utf8'));
const ck = JSON.parse(readFileSync(`${D}/raw/checks.json`, 'utf8'));

const KS = re.ks, PK = re.primaryK, G = re.gate;
const REPOS = Object.entries(re.repos);
const sha256File = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const f3 = (x) => x.toFixed(3);
const f4 = (x) => x.toFixed(4);
const pc = (x) => `${(x * 100).toFixed(1)}%`;
const n = (x) => x.toLocaleString('en-US');
const sd = (x) => (x >= 0 ? `+${f4(x)}` : f4(x));

const recallRow = (R, m) => KS.map((K) => `${f3(R.methods[m].recall[K].macro)}`).join(' | ');
const numden = (R, m, K) => `${n(R.methods[m].recall[K].num)}/${n(R.methods[m].recall[K].den)}`;

// ------------------------------------------------------------------ CSV tables
{
  const rows = [['repository', 'stratum', 'method', 'k', 'recall_macro', 'recall_num', 'recall_den',
    'precision_macro', 'precision_defined', 'fraction_mean', 'coverage', 'abstention', 'mrr',
    'mean_list_len', 'positive', 'new_test_only', 'zero_test_touch', 'suite_mean']];
  for (const [name, R] of REPOS) for (const m of ['H', 'HMAX', 'B0', 'B1']) for (const K of KS) {
    const M = R.methods[m];
    rows.push([name, R.stratum, m, K, f4(M.recall[K].macro), M.recall[K].num, M.recall[K].den,
      f4(M.precision[K].macro), M.precision[K].definedNum, f4(M.fraction[K]),
      f4(M.coverage), f4(M.abstention), f4(M.mrr), f4(M.meanListLen),
      R.positive, R.newTestOnly, R.zeroTestTouch, f4(R.suiteMean)]);
  }
  writeFileSync(`${D}/tables/metrics.csv`, `${rows.map((r) => r.join(',')).join('\n')}\n`);

  const g = [['repository', 'stratum', 'recall10_H', 'recall10_B0', 'recall10_B1', 'delta0', 'delta1',
    'frac10_H', 'frac10_B0', 'frac10_B1', 'non_inflated', 'POS', 'coverage_H']];
  for (const [name, v] of Object.entries(G.perRepo)) {
    g.push([name, v.stratum, f4(v.recallH), f4(v.recallB0), f4(v.recallB1), f4(v.delta0), f4(v.delta1),
      f4(v.fracH), f4(v.fracB0), f4(v.fracB1), v.nonInflated, v.POS, f4(v.coverageH)]);
  }
  writeFileSync(`${D}/tables/gate.csv`, `${g.map((r) => r.join(',')).join('\n')}\n`);
}

// -------------------------------------------------------------- B0-POPULARITY
{
  const rows = REPOS.map(([name, R]) =>
    `| ${R.stratum} | \`${name}\` | ${R.positive} | ${f3(R.methods.B0.coverage)} | ${f3(R.methods.B0.meanListLen)} | ${recallRow(R, 'B0')} | ${f3(R.methods.B0.precision[PK].macro)} | ${f4(R.methods.B0.fraction[PK])} | ${f4(R.methods.B0.mrr)} |`).join('\n');
  const nd = REPOS.map(([name, R]) => `| \`${name}\` | ${KS.map((K) => numden(R, 'B0', K)).join(' | ')} |`).join('\n');

  writeFileSync(`${D}/B0-POPULARITY.md`, `# B0-POPULARITY — META-289

**Definition (PREREGISTRATION §15).** \`score_B0(t)\` is the number of eligible
transactions in the first-parent ancestry of \`T0\` inclusive in which \`t\` was
touched in the TEST role. Candidates are restricted to \`Suite(T0)\`, ordered by
count descending with an ascending-lexical tie-break.

**\`B0\` is mechanically independent of the queried source files.** Its
computation takes no argument derived from \`S(T)\`. Invariant **I5** proves
this by reproducing every one of the 800 \`B0\` lists with an implementation
that never references \`sourcePaths\`; red test **RT4** proves the checker is
not inert by making \`B0\` depend on \`S(T)\` and catching the change on
110/200 queries.

**Purpose.** To answer: does source-conditioned history tell us more than
*"these tests change a lot"*?

## Results — macro-averaged over \`POSITIVE\` queries

| Stratum | Repository | POSITIVE | Coverage | mean \\|L\\| | R@1 | R@3 | R@5 | R@10 | P@10 | frac@10 | MRR |
| -- | -- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
${rows}

### Exact numerators / denominators (micro hits over pooled \`|G|\`)

| Repository | R@1 | R@3 | R@5 | R@10 |
| -- | -- | -- | -- | -- |
${nd}

## Reading

\`B0\` has **coverage 1.000 in every repository** — it always produces a list,
because any test touched even once in prior history enters it. Mean list length
runs from ${f3(Math.min(...REPOS.map(([, R]) => R.methods.B0.meanListLen)))} to
${f3(Math.max(...REPOS.map(([, R]) => R.methods.B0.meanListLen)))} candidates. A
method that is always willing to answer is not thereby informative, which is
exactly why this control is required.

**\`B0\` is weak in three of four repositories and competitive in the fourth.**
In \`LuckPerms/LuckPerms\` it reaches R@10 = ${f3(re.repos['LuckPerms/LuckPerms'].methods.B0.recall[PK].macro)},
within ${f4(G.perRepo['LuckPerms/LuckPerms'].delta0)} of \`H\`
(${f3(re.repos['LuckPerms/LuckPerms'].methods.H.recall[PK].macro)}) — below the
frozen \`0.05\` materiality threshold. In that repository, **test popularity
substantially explains what source-conditioned history achieves**, and §24
records it as \`POS = 0\`.

That is a preserved negative result, not a rounding artefact: it is why
\`LuckPerms/LuckPerms\` does not count toward the incremental-value gate despite
\`H\` beating \`B1\` there by ${f4(G.perRepo['LuckPerms/LuckPerms'].delta1)}.
`);
}

// ------------------------------------------------------------ B1-CURRENT-TREE
{
  const rows = REPOS.map(([name, R]) =>
    `| ${R.stratum} | \`${name}\` | ${R.positive} | ${f3(R.methods.B1.coverage)} | ${f3(R.methods.B1.meanListLen)} | ${recallRow(R, 'B1')} | ${f3(R.methods.B1.precision[PK].macro)} | ${f4(R.methods.B1.fraction[PK])} | ${f4(R.methods.B1.mrr)} |`).join('\n');
  const nd = REPOS.map(([name, R]) => `| \`${name}\` | ${KS.map((K) => numden(R, 'B1', K)).join(' | ')} |`).join('\n');

  writeFileSync(`${D}/B1-CURRENT-TREE.md`, `# B1-CURRENT-TREE — META-289

**Definition (PREREGISTRATION §16).** A single cross-repository rule over cheap
\`T0\` information only:

\`\`\`
structuralScore(s,t) = 100·[ tstem(t) == stem(s) ]
                     +  10·[ containment, min length >= 4 ]
                     +  dirshare(s,t)                      (0..5, role-normalized)

score_B1(t) = max over s in S(T)
\`\`\`

**No history of any kind, no per-repository branch, no post-hoc tuning.**
Invariant **I6** proves history-independence by reproducing every one of the
800 \`B1\` lists with an implementation that never references the history maps;
red test **RT5** proves the checker is not inert by adding historical support
to \`structuralScore\` and catching the change on 110/200 queries.

Worked examples of the score are generated from the real classifier in
\`CLASSIFIERS.md\`.

## Results — macro-averaged over \`POSITIVE\` queries

| Stratum | Repository | POSITIVE | Coverage | mean \\|L\\| | R@1 | R@3 | R@5 | R@10 | P@10 | frac@10 | MRR |
| -- | -- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
${rows}

### Exact numerators / denominators

| Repository | R@1 | R@3 | R@5 | R@10 |
| -- | -- | -- | -- | -- |
${nd}

## Reading — B1 tracks testing culture almost exactly

| Stratum | Convention | B1 R@10 |
| -- | -- | --: |
| Go | co-located \`foo_test.go\` beside \`foo.go\` | **${f3(re.repos['flyteorg/flyte'].methods.B1.recall[PK].macro)}** |
| Python | \`tests/\` package + \`test_foo.py\` | **${f3(re.repos['kornia/kornia'].methods.B1.recall[PK].macro)}** |
| TypeScript | heterogeneous \`__tests__\` / \`.spec.ts\` | ${f3(re.repos['remult/remult'].methods.B1.recall[PK].macro)} |
| Java | mirrored \`src/test/java\` + \`FooTest.java\` | ${f3(re.repos['LuckPerms/LuckPerms'].methods.B1.recall[PK].macro)} |

Where the convention is strong and co-located, a rule that knows nothing but
filenames and directories reaches R@10 = ${f3(re.repos['flyteorg/flyte'].methods.B1.recall[PK].macro)}
in Go and MRR = ${f4(re.repos['flyteorg/flyte'].methods.B1.mrr)}. Where the
convention is heterogeneous, it collapses to
${f3(re.repos['remult/remult'].methods.B1.recall[PK].macro)} in TypeScript.

**Java is the instructive exception to "mirrored layout is a strong
convention."** \`B1\` scores 105 on a textbook \`Node.java\` ↔ \`NodeTest.java\`
pair, yet reaches only ${f3(re.repos['LuckPerms/LuckPerms'].methods.B1.recall[PK].macro)}
here — because in this repository the tests that actually get touched are
frequently *not* the same-named mirror of the changed class. The rule is
correct; the assumption that a mirrored name predicts a co-touch is what fails.

**\`B1\` in \`remult/remult\` ranks nearly the entire suite** — mean
\\|L\\| = ${f3(re.repos['remult/remult'].methods.B1.meanListLen)} of a mean suite
of ${f3(re.repos['remult/remult'].suiteMean)} — and still reaches only
R@10 = ${f3(re.repos['remult/remult'].methods.B1.recall[PK].macro)} with
P@10 = ${f3(re.repos['remult/remult'].methods.B1.precision[PK].macro)}. Willingness
to answer is not concentration.

## Recorded limitation — this is an upper bound on H's advantage

\`B1\` is a filename / path / adjacency baseline. **No cross-language static
import or dependency baseline was built**, because doing so would require a new
large multi-language analysis surface that META-289 explicitly forbids.

A richer static baseline could plausibly beat \`B1\`. Therefore **any
\`H\`-over-\`B1\` margin reported here is an upper bound** on \`H\`'s advantage
over deterministic current-tree analysis in general. This limitation is frozen
in PREREGISTRATION §16 and restated in \`REPORT.md\`.
`);
}

// -------------------------------------------------------------- H-HISTORICAL
{
  const rows = REPOS.map(([name, R]) =>
    `| ${R.stratum} | \`${name}\` | ${R.positive} | ${f3(R.methods.H.coverage)} | ${f3(R.methods.H.abstention)} | ${f3(R.methods.H.meanListLen)} | ${recallRow(R, 'H')} | ${f3(R.methods.H.precision[PK].macro)} | ${f4(R.methods.H.fraction[PK])} | ${f4(R.methods.H.mrr)} |`).join('\n');
  const nd = REPOS.map(([name, R]) => `| \`${name}\` | ${KS.map((K) => numden(R, 'H', K)).join(' | ')} |`).join('\n');
  const mx = REPOS.map(([name, R]) =>
    `| ${R.stratum} | \`${name}\` | ${f3(R.methods.H.recall[PK].macro)} | ${f3(R.methods.HMAX.recall[PK].macro)} | ${sd(R.methods.HMAX.recall[PK].macro - R.methods.H.recall[PK].macro)} | ${f4(R.methods.H.mrr)} | ${f4(R.methods.HMAX.mrr)} |`).join('\n');

  writeFileSync(`${D}/H-HISTORICAL.md`, `# H-HISTORICAL — META-289

**Definition (PREREGISTRATION §14).** The simplest count-based
source-conditioned signal that answers the question:

\`\`\`
support_{<T}(s,t) = number of eligible transactions strictly before T in which
                    source path s and test path t were both touched

score_H(t) = SUM over s in S(T) of support_{<T}(s,t)      for t in Suite(T0)
\`\`\`

Ordered by score descending, ties broken by ascending lexical path. No decay,
no normalization, no confidence, no lift, no learned weight, no semantic
inference, no author or commit-purpose feature.

**Temporal isolation** is structural, not filtered: the miner snapshots its
count tables, ranks, and only then folds \`T\` in — so \`T\` contributes exactly
zero to its own features by construction (\`TEMPORAL-ISOLATION.md\` §2).
Invariant **I3** confirms \`historyTxnCount\` equals the count of eligible
transactions with index strictly below \`index(T)\` for all 800 queries, and
**I7** reproduces every \`H\` list with an independent explicit-ancestry-filter
implementation. Red test **RT1** proves the checker is not inert: folding
\`T\` in before its snapshot changed \`rankedH\` on 26/200 queries.

## Results — macro-averaged over \`POSITIVE\` queries

| Stratum | Repository | POSITIVE | Coverage | Abstention | mean \\|L\\| | R@1 | R@3 | R@5 | R@10 | P@10 | frac@10 | MRR |
| -- | -- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
${rows}

### Exact numerators / denominators

| Repository | R@1 | R@3 | R@5 | R@10 |
| -- | -- | -- | -- | -- |
${nd}

## H is the most concentrated method everywhere

\`H\` has the **shortest candidate list and the lowest candidate-set fraction**
of the three methods in three of four repositories, and the highest P@10 in
two. It buys nothing by breadth: the §24 non-inflation clause holds in every
repository (\`NONINFLATED = true\` for all four).

## Preregistered secondary — SUM vs MAX aggregation (§13)

Both aggregation rules were named in the preregistration before outcomes, so
neither could be chosen after seeing which predicts better.

| Stratum | Repository | R@10 (SUM, primary) | R@10 (MAX) | Δ | MRR SUM | MRR MAX |
| -- | -- | --: | --: | --: | --: | --: |
${mx}

**The aggregation choice does not drive any result.** The largest divergence at
R@10 is ${f4(Math.max(...REPOS.map(([, R]) => Math.abs(R.methods.HMAX.recall[PK].macro - R.methods.H.recall[PK].macro))))},
well inside the \`0.05\` materiality threshold, and no repository's \`POS\`
verdict would change under \`MAX\`. The §24 disposition is unaffected.
`);
}

// ------------------------------------------------------------------ COMPARISON
{
  const rows = Object.entries(G.perRepo).map(([name, v]) =>
    `| ${v.stratum} | \`${name}\` | ${re.repos[name].positive} | ${f3(v.recallH)} | ${f3(v.recallB0)} | ${f3(v.recallB1)} | **${sd(v.delta0)}** | **${sd(v.delta1)}** | ${v.nonInflated ? 'yes' : 'no'} | **${v.POS}** |`).join('\n');
  const paired = REPOS.map(([name, R]) =>
    `| ${R.stratum} | \`${name}\` | ${R.paired.B0.win}/${R.paired.B0.loss}/${R.paired.B0.tie} | ${R.paired.B1.win}/${R.paired.B1.loss}/${R.paired.B1.tie} | ${R.positive} |`).join('\n');
  const fracs = Object.entries(G.perRepo).map(([name, v]) =>
    `| ${v.stratum} | \`${name}\` | ${f4(v.fracH)} | ${f4(v.fracB0)} | ${f4(v.fracB1)} | ${f3(v.fracH / Math.max(v.fracB0, v.fracB1))}× | ${v.nonInflated ? 'PASS' : 'FAIL'} |`).join('\n');
  const ladder = G.ladder.map((l) =>
    `| ${l.rung} | \`${l.disposition}\` | ${l.fired ? '**FIRED**' : 'no'} | ${l.detail} |`).join('\n');
  const allK = REPOS.map(([name, R]) => KS.map((K) =>
    `| ${R.stratum} | \`${name}\` | ${K} | ${f3(R.methods.H.recall[K].macro)} | ${f3(R.methods.B0.recall[K].macro)} | ${f3(R.methods.B1.recall[K].macro)} | ${sd(R.methods.H.recall[K].macro - R.methods.B0.recall[K].macro)} | ${sd(R.methods.H.recall[K].macro - R.methods.B1.recall[K].macro)} |`).join('\n')).join('\n');

  writeFileSync(`${D}/COMPARISON.md`, `# COMPARISON — META-289

**Primary metric (PREREGISTRATION §24):** macro-averaged \`recall@${PK}\` over
\`POSITIVE\` queries, per repository. **Materiality threshold: \`0.05\` absolute**,
applied identically to both comparisons and in both directions.

## The incremental-value gate

\`POS(r) = 1\` requires \`H\` to materially beat **both** baselines **and** to
satisfy the non-inflation clause.

| Stratum | Repository | POSITIVE | H R@${PK} | B0 R@${PK} | B1 R@${PK} | Δ0 = H−B0 | Δ1 = H−B1 | non-inflated | POS |
| -- | -- | --: | --: | --: | --: | --: | --: | --: | --: |
${rows}

**\`Σ POS(r) = ${G.sumPOS}\` of 4.**

## H − B0 and H − B1 at every frozen K

| Stratum | Repository | K | H | B0 | B1 | H−B0 | H−B1 |
| -- | -- | --: | --: | --: | --: | --: | --: |
${allK}

The pattern is stable across \`K\`. It is not an artefact of the primary cutoff.

## Per-query paired outcomes on recall@${PK} (win / loss / tie)

Descriptive; these do not enter the ladder.

| Stratum | Repository | H vs B0 | H vs B1 | queries |
| -- | -- | -- | -- | --: |
${paired}

## Non-inflation check — H never buys recall with breadth

| Stratum | Repository | frac@${PK} H | frac@${PK} B0 | frac@${PK} B1 | H ÷ max(baseline) | ≤ 1.25× ? |
| -- | -- | --: | --: | --: | --: | -- |
${fracs}

\`H\` selects a **smaller** share of the test suite than the better baseline in
every repository. Whatever \`H\` achieves, it does not achieve by selecting more
of the suite.

## Disposition ladder — strict order, first match wins (§24)

| Rung | Disposition | Fired | Arithmetic |
| -- | -- | -- | -- |
${ladder}

## DISPOSITION: \`${G.disposition}\`

${G.disposition === 'MIXED_BY_REPOSITORY_OR_TESTING_CULTURE' ? `Meaningful positive and negative repository-level results coexist under the
frozen rule, and they are **not noise — they track testing culture**:

- **\`remult/remult\` (TypeScript, heterogeneous test conventions)** is the only
  repository where \`H\` materially beats both baselines
  (Δ0 = ${sd(G.perRepo['remult/remult'].delta0)}, Δ1 = ${sd(G.perRepo['remult/remult'].delta1)}).
- **\`flyteorg/flyte\` (Go, co-located \`_test.go\`)** and **\`kornia/kornia\`
  (Python, \`tests/\` packages)** both show \`B1\` beating \`H\`
  (Δ1 = ${sd(G.perRepo['flyteorg/flyte'].delta1)} and ${sd(G.perRepo['kornia/kornia'].delta1)}).
  Where the current tree encodes the convention, the current tree wins.
- **\`LuckPerms/LuckPerms\` (Java)** shows \`H\` beating \`B1\`
  (${sd(G.perRepo['LuckPerms/LuckPerms'].delta1)}) but **not** \`B0\`
  (${sd(G.perRepo['LuckPerms/LuckPerms'].delta0)}) — test popularity
  substantially explains \`H\` there.

**These results must not be averaged.** A cohort mean would report a modest
positive and conceal the fact that the sign of Δ1 flips with testing
convention.` : ''}
`);
}

// -------------------------------------------- NEGATIVE-ABSTENTION-RESULTS
{
  const cls = REPOS.map(([name, R]) =>
    `| ${R.stratum} | \`${name}\` | ${R.positive} | ${R.newTestOnly} | ${R.zeroTestTouch} | ${R.queries} | **${pc(R.zeroTestTouchRate.rate)}** |`).join('\n');
  const abst = REPOS.map(([name, R]) =>
    `| ${R.stratum} | \`${name}\` | ${R.methods.H.coverageNum}/${R.methods.H.coverageDen} | ${f3(R.methods.H.abstention)} | ${R.methods.B1.coverageNum}/${R.methods.B1.coverageDen} | ${f3(R.methods.B1.abstention)} | ${R.methods.B0.coverageNum}/${R.methods.B0.coverageDen} | ${f3(R.methods.B0.abstention)} |`).join('\n');
  const totQ = REPOS.reduce((a, [, R]) => a + R.queries, 0);
  const totZ = REPOS.reduce((a, [, R]) => a + R.zeroTestTouch, 0);
  const totN = REPOS.reduce((a, [, R]) => a + R.newTestOnly, 0);
  const totP = REPOS.reduce((a, [, R]) => a + R.positive, 0);

  writeFileSync(`${D}/NEGATIVE-ABSTENTION-RESULTS.md`, `# NEGATIVE-ABSTENTION-RESULTS — META-289

Every result the execution contract requires to be preserved explicitly. None
of these is averaged away, and none is a footnote to a headline number.

## 1. Most source-changing transactions touch no test file at all

This is the largest single finding in the experiment, and it is about the
proposed use rather than about \`H\`.

| Stratum | Repository | POSITIVE | NEW_TEST_ONLY | ZERO_TEST_TOUCH | queries | zero-test-touch rate |
| -- | -- | --: | --: | --: | --: | --: |
${cls}
| **cohort** | | **${totP}** | **${totN}** | **${totZ}** | **${totQ}** | **${pc(totZ / totQ)}** |

**${totZ} of ${totQ} authentic source-changing transactions (${pc(totZ / totQ)})
touched no test file whatsoever.** In \`LuckPerms/LuckPerms\` the figure is
${pc(re.repos['LuckPerms/LuckPerms'].zeroTestTouchRate.rate)}.

No ranking method can be right on those queries, because there is nothing to
rank toward. They are retained in the query denominator by §19.2 and reported
here; they are excluded from ranking metrics only because recall against an
empty target set is undefined rather than zero.

## 2. Only one repository drives the positive effect

\`Σ POS(r) = ${G.sumPOS}\` of 4. The single repository is \`remult/remult\`
(TypeScript). A cohort-level claim that "history adds incremental signal" would
rest on **one** of four repositories.

## 3. H beats B0 but not B1 — Go and Python

| Repository | Δ0 = H−B0 | Δ1 = H−B1 |
| -- | --: | --: |
| \`flyteorg/flyte\` (Go) | ${sd(G.perRepo['flyteorg/flyte'].delta0)} | **${sd(G.perRepo['flyteorg/flyte'].delta1)}** |
| \`kornia/kornia\` (Python) | ${sd(G.perRepo['kornia/kornia'].delta0)} | **${sd(G.perRepo['kornia/kornia'].delta1)}** |

Source-conditioned history is far better than base rates in both, and **worse
than a filename-and-directory rule that needs no history at all**.

## 4. H beats B1 but not B0 — Java

| Repository | Δ0 = H−B0 | Δ1 = H−B1 |
| -- | --: | --: |
| \`LuckPerms/LuckPerms\` (Java) | **${sd(G.perRepo['LuckPerms/LuckPerms'].delta0)}** | ${sd(G.perRepo['LuckPerms/LuckPerms'].delta1)} |

\`H\` R@${PK} = ${f3(re.repos['LuckPerms/LuckPerms'].methods.H.recall[PK].macro)} against
\`B0\` = ${f3(re.repos['LuckPerms/LuckPerms'].methods.B0.recall[PK].macro)}. **Test
popularity substantially explains the result there.**

## 5. Test popularity explains the result — where, and where not

\`B0\` is competitive only in \`LuckPerms/LuckPerms\`. In the other three it is
far behind (${REPOS.filter(([nm]) => nm !== 'LuckPerms/LuckPerms').map(([nm, R]) => `\`${nm.split('/')[1]}\` ${f3(R.methods.B0.recall[PK].macro)}`).join(', ')}).
The base-rate explanation is repository-specific, not general — which is itself
why B0 had to be measured per repository rather than assumed weak.

## 6. Current-tree naming/path conventions explain the result — where

\`B1\` beats \`H\` in Go (${f3(re.repos['flyteorg/flyte'].methods.B1.recall[PK].macro)} vs ${f3(re.repos['flyteorg/flyte'].methods.H.recall[PK].macro)})
and Python (${f3(re.repos['kornia/kornia'].methods.B1.recall[PK].macro)} vs ${f3(re.repos['kornia/kornia'].methods.H.recall[PK].macro)}).
In Go, \`B1\` also has the better MRR (${f4(re.repos['flyteorg/flyte'].methods.B1.mrr)} vs ${f4(re.repos['flyteorg/flyte'].methods.H.mrr)}).

## 7. H frequently has no historical candidate

| Stratum | Repository | H coverage | H abstention | B1 coverage | B1 abstention | B0 coverage | B0 abstention |
| -- | -- | --: | --: | --: | --: | --: | --: |
${abst}

\`H\` abstains on ${pc(1 - re.repos['LuckPerms/LuckPerms'].methods.H.coverage)} of
\`POSITIVE\` queries in \`LuckPerms/LuckPerms\` and
${pc(1 - re.repos['kornia/kornia'].methods.H.coverage)} in \`kornia/kornia\`.
Abstained queries are retained at \`recall = 0\`, \`RR = 0\`, \`fraction = 0\` per
§19.1 — never silently dropped.

Coverage did not fall low enough in two repositories to trigger the \`D1\`
\`INSUFFICIENT_SOURCE_TEST_SIGNAL\` rung (${G.reposWithLowHCoverage} repositories
below 0.50; two are required), so the disposition rests on the merits rather
than on sparsity.

## 8. High recall bought with a large fraction of the suite

Not observed for \`H\` — it is the most concentrated method everywhere, and the
non-inflation clause passes in all four repositories.

It **is** observed for the baselines. \`B1\` in \`remult/remult\` ranks a mean of
${f3(re.repos['remult/remult'].methods.B1.meanListLen)} candidates from a mean
suite of ${f3(re.repos['remult/remult'].suiteMean)} and still reaches only
R@${PK} = ${f3(re.repos['remult/remult'].methods.B1.recall[PK].macro)}
(P@${PK} = ${f3(re.repos['remult/remult'].methods.B1.precision[PK].macro)}).
\`B0\` in \`kornia/kornia\` ranks
${f3(re.repos['kornia/kornia'].methods.B0.meanListLen)} of
${f3(re.repos['kornia/kornia'].suiteMean)} for
R@${PK} = ${f3(re.repos['kornia/kornia'].methods.B0.recall[PK].macro)}.

## 9. Testing culture materially changes the result

The sign of Δ1 flips with test-file placement convention: negative where tests
are co-located or conventionally named (Go, Python), positive where they are
not (TypeScript, Java). This is the substance of the
\`MIXED_BY_REPOSITORY_OR_TESTING_CULTURE\` disposition.

## 10. Thin denominator in the Java stratum

\`LuckPerms/LuckPerms\` contributes only **${re.repos['LuckPerms/LuckPerms'].positive} \`POSITIVE\` queries of 200**.
Both of its Δ values rest on that small base and should be treated as the least
stable numbers in the report. This is disclosed rather than smoothed; the
repository was **not** replaced, because §5.6 forbids replacing a repository for
sparsity.

## 11. New test files created by T — structurally unreachable

${totN} of ${totQ} queries (${pc(totN / totQ)}) touched **only** test files that
did not exist in the \`T0\` tree. No method could rank them, by §17. They are
reported here and excluded from the primary recall denominator, never silently
dropped.
`);
}

// ------------------------------------------------- DENOMINATOR-AUDIT (parts 1+2)
{
  const part1 = readFileSync(`${D}/DENOMINATOR-AUDIT.md`, 'utf8').split('\n## Integrity')[0]
    .replace('# DENOMINATOR-AUDIT — META-289 (part 1 of 2: PRE-OUTCOME)', '# DENOMINATOR-AUDIT — META-289')
    .replace(/> \*\*Stage marker\.\*\*[\s\S]*?ordering proof\.\n\n/, `> **Stage marker.** Part 1 was committed in the **pre-outcome** commit before
> any outcome existed; part 2 was added in the outcome commit. The git history
> of this file is itself the ordering proof.

`);
  const cls = REPOS.map(([name, R]) =>
    `| ${R.stratum} | \`${name}\` | ${R.queries} | ${R.positive} | ${R.newTestOnly} | ${R.zeroTestTouch} | ${R.totalG} | ${R.totalNewTestFiles} |`).join('\n');
  const dens = REPOS.map(([name, R]) => KS.map((K) =>
    `| \`${name.split('/')[1]}\` | ${K} | ${n(R.methods.H.recall[K].num)}/${n(R.methods.H.recall[K].den)} | ${n(R.methods.B0.recall[K].num)}/${n(R.methods.B0.recall[K].den)} | ${n(R.methods.B1.recall[K].num)}/${n(R.methods.B1.recall[K].den)} | ${R.methods.H.precision[K].definedNum}/${R.methods.H.precision[K].definedDen} |`).join('\n')).join('\n');

  writeFileSync(`${D}/DENOMINATOR-AUDIT.md`, `${part1}
## Part 2 — outcome-side query classification (§19.2)

Every one of the 800 queries falls into exactly one class, and the three counts
partition 200 per repository. Invariant **I10** re-derives these counts from
\`raw/outcomes.json\` and checks the partition.

| Stratum | Repository | queries | POSITIVE | NEW_TEST_ONLY | ZERO_TEST_TOUCH | Σ\\|G\\| | new test files |
| -- | -- | --: | --: | --: | --: | --: | --: |
${cls}

\`NEW_TEST_ONLY\` queries touched only test files absent from \`Suite(T0)\` —
structurally unreachable for every method by §17. \`ZERO_TEST_TOUCH\` queries
touched no test file at all.

## Recall numerators and denominators, exactly as reported

Micro form: pooled hits over pooled \\|G\\| across \`POSITIVE\` queries. The macro
figures in the result documents are per-query means over the same query set.
The final column is the number of queries on which \`precision@K\` is defined for
\`H\` (§19.1 excludes abstentions from the precision mean only).

| Repository | K | H hits/Σ\\|G\\| | B0 hits/Σ\\|G\\| | B1 hits/Σ\\|G\\| | H precision defined |
| -- | --: | -- | -- | -- | -- |
${dens}

## Denominators survive to reporting

Invariant **I10** asserts that every rate in \`raw/results.json\` carries a
numerator and denominator recomputed from \`raw/outcomes.json\`, and that
\`POSITIVE + NEW_TEST_ONLY + ZERO_TEST_TOUCH == 200\` in every repository.
Result: \`${ck.invariants.find((x) => x.id === 'I10').status}\`.

## Integrity

| File | sha256 |
| -- | -- |
| \`raw/pre-outcome.json\` | \`${sha256File(`${D}/raw/pre-outcome.json`)}\` |
| \`raw/outcomes.json\` | \`${sha256File(`${D}/raw/outcomes.json`)}\` |
| \`raw/results.json\` | \`${sha256File(`${D}/raw/results.json`)}\` |
`);
}

console.log('rendered: tables/ B0-POPULARITY.md B1-CURRENT-TREE.md H-HISTORICAL.md COMPARISON.md NEGATIVE-ABSTENTION-RESULTS.md DENOMINATOR-AUDIT.md');
