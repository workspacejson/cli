// render-report.mjs — renders REPORT.md and RECEIPT.md from raw/ only.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const D = 'docs/evidence/meta-289';
const re = JSON.parse(readFileSync(`${D}/raw/results.json`, 'utf8'));
const co = JSON.parse(readFileSync(`${D}/raw/cohort.json`, 'utf8'));
const ck = JSON.parse(readFileSync(`${D}/raw/checks.json`, 'utf8'));
const ro = JSON.parse(readFileSync(`${D}/raw/ranked-order.json`, 'utf8'));
const un = JSON.parse(readFileSync(`${D}/raw/universe.json`, 'utf8'));

const KS = re.ks, PK = re.primaryK, G = re.gate;
const REPOS = Object.entries(re.repos);
const f3 = (x) => x.toFixed(3);
const f4 = (x) => x.toFixed(4);
const pc = (x) => `${(x * 100).toFixed(1)}%`;
const sd = (x) => (x >= 0 ? `+${f4(x)}` : f4(x));
const n = (x) => x.toLocaleString('en-US');

const PREREG = execFileSync('git', ['log', '--format=%H', '--diff-filter=A', '--', `${D}/PREREGISTRATION.md`], { encoding: 'utf8' }).trim().split('\n').pop();
const PHASEA = execFileSync('git', ['log', '--format=%H', '--diff-filter=A', '--', `${D}/raw/pre-outcome.json`], { encoding: 'utf8' }).trim().split('\n').pop();
const META378 = 'f3c7a0741acd14620a4fe8535c65d1908087fa30';

const totQ = REPOS.reduce((a, [, R]) => a + R.queries, 0);
const totZ = REPOS.reduce((a, [, R]) => a + R.zeroTestTouch, 0);
const totN = REPOS.reduce((a, [, R]) => a + R.newTestOnly, 0);
const totP = REPOS.reduce((a, [, R]) => a + R.positive, 0);

const gateRows = Object.entries(G.perRepo).map(([name, v]) =>
  `| ${v.stratum} | \`${name}\` | ${re.repos[name].positive} | ${f3(v.recallH)} | ${f3(v.recallB0)} | ${f3(v.recallB1)} | **${sd(v.delta0)}** | **${sd(v.delta1)}** | **${v.POS}** |`).join('\n');

const cohortRows = Object.entries(co.strata).map(([lang, s]) =>
  `| ${lang} | \`${s.selected.full_name}\` | ${s.selected.rank} | \`${s.selected.pin.slice(0, 12)}\` | ${n(s.selected.firstParentCommits)} | ${n(s.selected.testFilesAtPin)} |`).join('\n');

const clsRows = REPOS.map(([name, R]) =>
  `| ${R.stratum} | \`${name}\` | ${R.positive} | ${R.newTestOnly} | ${R.zeroTestTouch} | **${pc(R.zeroTestTouchRate.rate)}** |`).join('\n');

const covRows = REPOS.map(([name, R]) =>
  `| ${R.stratum} | \`${name}\` | ${R.methods.H.coverageNum}/${R.methods.H.coverageDen} | ${f3(R.methods.H.abstention)} | ${f4(R.methods.H.mrr)} | ${f4(R.methods.B0.mrr)} | ${f4(R.methods.B1.mrr)} |`).join('\n');

const precRows = REPOS.map(([name, R]) =>
  `| ${R.stratum} | \`${name}\` | ${f3(R.methods.H.precision[PK].macro)} | ${f3(R.methods.B0.precision[PK].macro)} | ${f3(R.methods.B1.precision[PK].macro)} | ${f4(R.methods.H.fraction[PK])} | ${f4(R.methods.B0.fraction[PK])} | ${f4(R.methods.B1.fraction[PK])} |`).join('\n');

const ladder = G.ladder.map((l) => `| ${l.rung} | \`${l.disposition}\` | ${l.fired ? '**FIRED**' : 'no'} | ${l.detail} |`).join('\n');

writeFileSync(`${D}/REPORT.md`, `# REPORT — META-289

**Question (Fibery OQ-15, executed by Linear META-289):**

> For an authentic later transaction that changes one or more source files,
> does source↔test co-update history available strictly before that transaction
> improve identification/ranking of the test files actually touched in that
> later transaction, beyond deterministic current-tree baselines and test
> popularity/base rates?

**Observed outcome:** test files touched in the later transaction. Nothing else.

# DISPOSITION: \`${G.disposition}\`

Reached by the frozen §24 ladder, which was committed at \`${PREREG.slice(0, 12)}\`
before any repository was selected and before any outcome was computed.

| Rung | Disposition | Fired | Arithmetic |
| -- | -- | -- | -- |
${ladder}

## The result in one table

Primary metric: macro-averaged \`recall@${PK}\` over \`POSITIVE\` queries, per
repository. Materiality threshold \`0.05\` absolute.
\`POS(r) = 1\` requires \`H\` to materially beat **both** baselines and to satisfy
the non-inflation clause.

| Stratum | Repository | POSITIVE | H | B0 popularity | B1 current-tree | Δ0 = H−B0 | Δ1 = H−B1 | POS |
| -- | -- | --: | --: | --: | --: | --: | --: | --: |
${gateRows}

**\`Σ POS(r) = ${G.sumPOS}\` of 4.**

## What actually happened

**The sign of the incremental result flips with testing culture.**

- Where tests are **co-located or conventionally named**, a deterministic rule
  that reads only filenames and directories beats history. In \`flyteorg/flyte\`
  (Go, \`foo_test.go\` beside \`foo.go\`) \`B1\` reaches
  R@${PK} = ${f3(re.repos['flyteorg/flyte'].methods.B1.recall[PK].macro)} against
  \`H\`'s ${f3(re.repos['flyteorg/flyte'].methods.H.recall[PK].macro)}. In
  \`kornia/kornia\` (Python, \`tests/\` packages) it is
  ${f3(re.repos['kornia/kornia'].methods.B1.recall[PK].macro)} against
  ${f3(re.repos['kornia/kornia'].methods.H.recall[PK].macro)}.
- Where conventions are **heterogeneous**, history wins. In \`remult/remult\`
  (TypeScript, mixed \`__tests__\` / \`.spec.ts\`) \`H\` reaches
  ${f3(re.repos['remult/remult'].methods.H.recall[PK].macro)} against \`B1\`'s
  ${f3(re.repos['remult/remult'].methods.B1.recall[PK].macro)} and \`B0\`'s
  ${f3(re.repos['remult/remult'].methods.B0.recall[PK].macro)} — the only
  repository where \`POS(r) = 1\`.
- In \`LuckPerms/LuckPerms\` (Java) \`H\` beats \`B1\` by
  ${sd(G.perRepo['LuckPerms/LuckPerms'].delta1)} but beats \`B0\` by only
  ${sd(G.perRepo['LuckPerms/LuckPerms'].delta0)} — below threshold. **Test
  popularity substantially explains \`H\` there.**

\`H\` beats \`B0\` materially in three of four repositories, often by a wide
margin. It beats \`B1\` materially in two. It beats **both** in one.

## The largest finding is not about H at all

| Stratum | Repository | POSITIVE | NEW_TEST_ONLY | ZERO_TEST_TOUCH | zero-test-touch rate |
| -- | -- | --: | --: | --: | --: |
${clsRows}
| **cohort** | | **${totP}** | **${totN}** | **${totZ}** | **${pc(totZ / totQ)}** |

**${totZ} of ${totQ} authentic source-changing transactions (${pc(totZ / totQ)})
touched no test file at all** — ${pc(re.repos['LuckPerms/LuckPerms'].zeroTestTouchRate.rate)}
in the Java repository. A further ${totN} touched only test files that did not
exist at \`T0\` and were therefore unreachable by construction.

Any proposed consumer of a source→test suggestion would be answering a question
that, in this corpus, has no answer more than half the time. That is a property
of the phenomenon, not a limitation of the method under test.

## Concentration, coverage and ranking quality

| Stratum | Repository | H coverage | H abstention | MRR H | MRR B0 | MRR B1 |
| -- | -- | --: | --: | --: | --: | --: |
${covRows}

| Stratum | Repository | P@${PK} H | P@${PK} B0 | P@${PK} B1 | frac@${PK} H | frac@${PK} B0 | frac@${PK} B1 |
| -- | -- | --: | --: | --: | --: | --: | --: |
${precRows}

\`H\` is the **most concentrated** method: it selects a smaller share of the
test suite than the better baseline in every repository, and the §24
non-inflation clause passes everywhere. Whatever \`H\` achieves, it does not
achieve by selecting more of the suite.

It also **abstains** on ${pc(1 - re.repos['LuckPerms/LuckPerms'].methods.H.coverage)}
of \`POSITIVE\` queries in Java and
${pc(1 - re.repos['kornia/kornia'].methods.H.coverage)} in Python — retained at
recall 0 per §19.1, never dropped.

## Preregistered secondary analyses

Both were named in the preregistration before outcomes.

- **SUM vs MAX aggregation (§13).** Largest R@${PK} divergence
  ${f4(Math.max(...REPOS.map(([, R]) => Math.abs(R.methods.HMAX.recall[PK].macro - R.methods.H.recall[PK].macro))))},
  inside the materiality threshold. No \`POS\` verdict changes. The disposition
  does not depend on the aggregation rule. Full table in \`H-HISTORICAL.md\`.
- **Micro aggregation (§21.5).** Reported per repository and K in
  \`DENOMINATOR-AUDIT.md\`; it does not alter the sign of any Δ.

## WHAT THIS ESTABLISHES

1. On this preregistered corpus, **source-conditioned co-update history does
   not clear the incremental-value gate**. It beat both baselines in one of four
   repositories.
2. **The result is conditional on testing culture, not uniform.** Δ1 is
   negative where test placement follows a mechanical convention and positive
   where it does not. This is a repository-level effect that survives the frozen
   metric rule.
3. **Test popularity alone is a serious competitor in at least one repository**
   (\`LuckPerms/LuckPerms\`), where it comes within
   ${f4(Math.abs(G.perRepo['LuckPerms/LuckPerms'].delta0))} of history.
4. **A deterministic current-tree rule with no history is a serious competitor
   generally**, and beats history outright in two repositories.
5. **History is consistently the most concentrated signal.** Where it does fire,
   it fires on a short list — but it declines to fire on
   ${pc(1 - Math.min(...REPOS.map(([, R]) => R.methods.H.coverage)))} of positive
   queries in the worst repository.
6. **Most source-changing transactions in this corpus touch no test file**
   (${pc(totZ / totQ)}), which bounds the addressable value of any method in
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
   plausibly beat \`B1\`, so **every \`H\`-over-\`B1\` margin here is an upper
   bound** on \`H\`'s advantage over deterministic current-tree analysis.
2. **Rename chains are not resolved** (§11). A renamed file's counts are split
   across its old and new paths. This depresses \`H\` and \`B0\` on recently
   renamed files. It applies identically to all three methods.
3. **The Java stratum has a thin outcome denominator** — only
   ${re.repos['LuckPerms/LuckPerms'].positive} \`POSITIVE\` queries of 200. Its
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
${cohortRows}

Selected by seed \`${ro.seed}\` from a committed universe snapshot of
${n(Object.values(un.strata).reduce((a, s) => a + s.materialized, 0))} repository
records, with anti-leak exclusion of every META-375 discovery repository and
every META-378 cohort repository. Full attempt-by-attempt backfill record in
\`SELECTION-RECEIPT.md\`.

## Validation

${ck.invariants.length} invariants **PASS**, ${ck.redTests.length} red tests
**CAUGHT** with proven non-inert perturbations, ${ck.failures} failures. Detail
in \`RECEIPT.md\`.

## DEVIATIONS

**One, non-semantic.** \`scripts/gitmine.mjs\` initially passed
\`--no-renames-empty\` to \`git log\`; the installed git 2.52.0 rejects it, and
the script's fallback path re-ran the identical command without it. The flag was
removed from the source after cohort verification. This changed no output — the
fallback had already executed the flagless command — and it touched no frozen
parameter.

**No protocol deviation.** No parameter in \`PREREGISTRATION.md\` was changed
after outcomes became visible. No repository was replaced for any reason other
than a recorded V1–V6 failure. No disposition was renamed or redefined.

## What this issue did NOT do

Per the execution contract: no AI-agent experiment was run; \`workspacejson
tests-for\` was not implemented; workspace.json semantics, producer behavior and
the existing co-change ranking/cap were not changed; no schema field or CLI
command was added.

**A positive substrate result would not have authorized a consumer experiment,
and this is not a positive substrate result.** Whether the one-repository effect
warrants any successor work is a separate explicit decision.
`);

// -------------------------------------------------------------------- RECEIPT
const inv = ck.invariants.map((x) => `| **${x.id}** | \`${x.status}\` | ${x.detail} |`).join('\n');
const red = ck.redTests.map((x) => `| **${x.id}** | \`${x.status}\` | ${x.detail} |`).join('\n');

writeFileSync(`${D}/RECEIPT.md`, `# RECEIPT — META-289

**Date:** 2026-08-21. **Scope:** execution record — environment, freeze chain,
validation, red tests, deviations. Findings: \`REPORT.md\`.

## Environment

| | |
| -- | -- |
| Host | ${process.platform} ${process.arch} |
| Node | ${process.version} |
| git | ${execFileSync('git', ['--version'], { encoding: 'utf8' }).trim()} |
| Network | GitHub Search API (universe snapshot) and \`git clone\` only |
| Model runs | **none** |
| Maintainers contacted | **none** |
| Producer / schema changes | **none** |

## Freeze chain

Verifiable from \`git log\`, not from this file's assertion.

| Step | Commit | What it established |
| -- | -- | -- |
| META-378 predecessor receipt | \`${META378}\` | verified present before phase 0 completed; \`NEITHER_PATTERN_REPLICATES\` recorded as context only |
| META-376 | *(none — Canceled)* | verified Canceled in Linear; not reopened, not executed |
| **Preregistration** | \`${PREREG}\` | all 24 required parameters, the disposition ladder and its thresholds — **before any repository was selected** |
| **Phase A** | \`${PHASEA}\` | universe snapshot, seeded selection, V1–V6 verification, classifiers, \`T0\` denominators, all three rankings — **before any outcome was read** |
| Phase B results | this commit | first source↔test outcome numbers |

## Outcome isolation (PREREGISTRATION §20)

\`scripts/phase-a.mjs\` is the only script that ranks, and its sole use of an
evaluation transaction's changed-file set is \`filter(isSource)\`. Records carry
a fixed 14-key allowlist asserted before the phase-A commit; there is no key in
which an outcome could hide.

\`scripts/phase-b.mjs\` is the only script that reads TEST-role touches of an
evaluation transaction. It never re-ranks — it consumes the lists frozen at
\`${PHASEA.slice(0, 12)}\` and scores them.

Invariant **I4** re-proves the ordering over the committed artifacts: the
phase-A commit tree contains no \`outcomes.json\`, no \`results.json\` and no
\`phase-b.mjs\`.

## Temporal isolation (PREREGISTRATION §9, §10)

Enforced structurally rather than by filtering: the miner snapshots its count
tables, ranks, and only then folds \`T\` in. \`T\` contributes zero to its own
features by construction.

Invariants **I3** and **I7** re-prove this by **independent reimplementation** —
\`checks.mjs\` rebuilds \`H\`, \`B0\` and \`B1\` for all 800 queries using an
explicit \`index(X) < index(T)\` ancestry filter, a different mechanism from the
oldest→newest structural fold, and requires exact agreement. Agreement between
two mechanisms is evidence; one mechanism agreeing with itself is not.

## Invariants — all must hold

| # | Status | Detail |
| -- | -- | -- |
${inv}

## Red tests — all must be CAUGHT, and all must be proven non-inert

Each perturbation prints the measured quantity before and after and asserts
they differ. **An inert perturbation is reported \`INVALID\`, not \`PASS\`,** and
fails the run.

| # | Status | Perturbation and proof of non-inertness |
| -- | -- | -- |
${red}

**${ck.failures} failures.**

## Corpus integrity

- Universe is the **committed snapshot** \`raw/universe.json\`, not the live API.
- Ordering key \`sha256("${ro.seed}" + ":" + full_name)\` recomputed from the
  seed alone in **I1**.
- Backfill fired only on recorded V1–V6 failures:
  ${Object.entries(co.strata).map(([l, s]) => `${l} ${s.attempts.length - 1}`).join(', ')} recorded
  \`INELIGIBLE_ON_VERIFICATION\` entries respectively, all visible in
  \`SELECTION-RECEIPT.md\`.
- **No repository was replaced for sparsity, abstention, or a negative result.**

## Deviations

**One, non-semantic.** \`scripts/gitmine.mjs\` initially passed
\`--no-renames-empty\` to \`git log\`; git 2.52.0 rejects it and the script's
fallback re-ran the identical command without it. The flag was removed from the
source after cohort verification. No output changed and no frozen parameter was
touched.

**No protocol deviation.** No preregistered parameter was changed after outcomes
became visible; no disposition was renamed or redefined.

## Reproduction

\`\`\`
bash docs/evidence/meta-289/rerun.sh <workDir>
\`\`\`

Selection reproduces from the committed \`raw/universe.json\` without touching
the GitHub API. Re-materializing the universe from the live API is a separate
opt-in step and will **not** reproduce the snapshot, because GitHub result sets
drift — which is exactly why the snapshot is committed.
`);

console.log('rendered: REPORT.md RECEIPT.md');
console.log(`prereg=${PREREG} phaseA=${PHASEA} disposition=${G.disposition}`);
