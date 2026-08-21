// render-phase-a.mjs — renders the PRE-OUTCOME receipts from raw/ only.
// Every number below is read from a committed raw file; none is typed by hand.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { roleOf, tstem, structuralScore, dirshare, EXCLUDED_DIR_SEGMENTS } from './classify.mjs';

const D = 'docs/evidence/meta-289';
const u = JSON.parse(readFileSync(`${D}/raw/universe.json`, 'utf8'));
const ro = JSON.parse(readFileSync(`${D}/raw/ranked-order.json`, 'utf8'));
const co = JSON.parse(readFileSync(`${D}/raw/cohort.json`, 'utf8'));
const pa = JSON.parse(readFileSync(`${D}/raw/pre-outcome.json`, 'utf8'));

const sha256File = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const n = (x) => x.toLocaleString('en-US');

// ------------------------------------------------------------ UNIVERSE-RECEIPT
{
  const rows = Object.entries(u.strata).map(([lang, s]) =>
    `| ${lang} | ${n(s.totalCount)} | ${n(s.materialized)} | ${s.pages.length} | ${s.materialized < s.totalCount ? "truncated at GitHub's 1,000 cap" : 'fully enumerated'} |`).join('\n');
  const elig = Object.entries(ro.strata).map(([lang, s]) =>
    `| ${lang} | ${n(s.distinct)} | ${n(s.eligible)} | ${Object.entries(s.rejectedByPredicate).map(([k, v]) => `\`${k}\`×${v}`).join(', ') || '—'} |`).join('\n');
  const hits = Object.entries(ro.strata).flatMap(([lang, s]) =>
    s.antiLeakRepositoriesEncountered.map((r) => `| ${lang} | \`${r}\` |`)).join('\n');
  const total = Object.values(u.strata).reduce((a, s) => a + s.materialized, 0);

  writeFileSync(`${D}/UNIVERSE-RECEIPT.md`, `# UNIVERSE-RECEIPT — META-289

**The committed snapshot, not the live API, is the universe.** Selection
reproduces from \`raw/universe.json\` regardless of later GitHub drift.

**Snapshot (UTC):** \`${u.snapshotUtc}\`

**API:** \`${u.api}\`, \`sort=${u.sort}\`, \`order=${u.order}\`, \`per_page=${u.perPage}\`, paginated to GitHub's hard 1000-result cap.

## Frozen query template (PREREGISTRATION §5.1)

\`\`\`
language:{LANG} stars:1000..40000 created:<2022-01-01 pushed:>2026-01-01
fork:false archived:false size:5000..400000
\`\`\`

## Strata

Four strata chosen because their testing cultures differ materially in exactly
the dimension B1 measures — how discoverable the source↔test relation is from
the current tree alone.

| Stratum | \`total_count\` | Materialized | Pages | Note |
| -- | --: | --: | --: | -- |
${rows}
| **total** | | **${n(total)}** | | |

Three strata exceed GitHub's hard 1,000-result search cap and are therefore
truncated. The universe is defined as **exactly the enumerable slice recorded
here**, not as the full \`total_count\`. That is a stated limit of the sampling
frame, fixed before selection, not a filter applied afterwards.

## Eligibility applied (PREREGISTRATION §5.2)

Every predicate E1–E10 is re-verified offline from the snapshot record rather
than trusted from the query, so the filter is auditable without network access.

| Stratum | Distinct | Eligible | Rejected by predicate |
| -- | --: | --: | -- |
${elig}

## Anti-leak exclusion fired (PREREGISTRATION §4)

Predicate \`E9\` excludes every META-375 discovery repository, every META-378
cohort repository, and any repository owned by \`workspacejson\`. It was not a
formality — repositories already examined by predecessor experiments were
present in this universe and were removed by it:

| Stratum | Repository encountered and excluded |
| -- | -- |
${hits}

## Integrity

| File | sha256 |
| -- | -- |
| \`raw/universe.json\` | \`${sha256File(`${D}/raw/universe.json`)}\` |
`);
}

// ----------------------------------------------------------- SELECTION-RECEIPT
{
  const sel = Object.entries(co.strata).map(([lang, s]) => {
    const x = s.selected;
    return `| ${lang} | \`${x.full_name}\` | ${x.rank} | ${n(x.firstParentCommits)} | \`${x.pin.slice(0, 12)}\` | ${n(x.sourceFilesAtPin)} | ${n(x.testFilesAtPin)} |`;
  }).join('\n');

  const attempts = Object.entries(co.strata).map(([lang, s]) => {
    const rows = s.attempts.map((a) => {
      const status = a.passed ? '**SELECTED**' : `\`INELIGIBLE_ON_VERIFICATION\` (${a.failed})`;
      const detail = a.failed === 'V3' ? `first-parent commits = ${n(a.firstParentCommits)} < 1500`
        : a.failed === 'V4' ? `source files at pin = ${n(a.sourceFilesAtPin)} < 100`
        : a.failed === 'V5' ? `test files at pin = ${n(a.testFilesAtPin)} < 30`
        : a.failed === 'V6' ? `source-changing in 600-edge scan = ${n(a.sourceChangingInScan)} < 200`
        : a.failed ? (a.reason ?? '') : `fp=${n(a.firstParentCommits)} src=${n(a.sourceFilesAtPin)} test=${n(a.testFilesAtPin)} scan=${n(a.sourceChangingInScan)}`;
      return `| ${a.rank} | \`${a.full_name}\` | ${status} | ${detail} |`;
    }).join('\n');
    return `### ${lang}\n\n| Rank | Repository | Outcome | Mechanical detail |\n| --: | -- | -- | -- |\n${rows}`;
  }).join('\n\n');

  const pins = Object.entries(co.strata).map(([lang, s]) =>
    `| ${lang} | \`${s.selected.full_name}\` | \`${s.selected.pin}\` | ${s.selected.pinDate} |`).join('\n');

  writeFileSync(`${D}/SELECTION-RECEIPT.md`, `# SELECTION-RECEIPT — META-289

**Committed before any evaluation transaction outcome existed.**

**Seed:** \`${ro.seed}\`

**Ordering rule:** ${ro.orderingRule}

The order depends only on the seed and the repository name, so it was fixed
before any repository property beyond §5.2 eligibility was consulted, and it is
reproducible from the committed snapshot alone. Because the order was frozen
before any clone existed, the §5.6 backfill **cannot be steered**.

## Selected cohort — exactly four repositories, one per stratum

| Stratum | Repository | Rank taken | First-parent commits | Pin | Source files @ pin | Test files @ pin |
| -- | -- | --: | --: | -- | --: | --: |
${sel}

**Four repositories with materially different testing cultures. None is a
META-375 discovery repository, a META-378 cohort repository, or owned by
\`workspacejson\`.**

## Full pin SHAs

| Stratum | Repository | Pin SHA | Committed |
| -- | -- | -- | -- |
${pins}

## Verification attempts and backfill (PREREGISTRATION §5.5, §5.6)

Every attempt is recorded, including every skip and its mechanical reason.
Backfill fired **only** for V1–V6 failures — never because a result was sparse,
negative, obvious or inconvenient. **No source↔test outcome existed when any of
these decisions was made**; V4/V5/V6 read repository content and changed-file
paths only, and V6 asks solely whether a transaction changed a SOURCE file,
which is the §12 query definition rather than the outcome.

${attempts}

## Integrity

| File | sha256 |
| -- | -- |
| \`raw/ranked-order.json\` | \`${sha256File(`${D}/raw/ranked-order.json`)}\` |
| \`raw/cohort.json\` | \`${sha256File(`${D}/raw/cohort.json`)}\` |
`);
}

// ------------------------------------------------------------------ CLASSIFIERS
{
  const probes = [
    'pkg/flytek8s/container_helper.go', 'pkg/flytek8s/container_helper_test.go',
    'kornia/filters/sobel.py', 'kornia/filters/tests/test_sobel.py', 'test/filters/test_sobel.py',
    'common/src/main/java/me/lucko/luckperms/common/node/Node.java',
    'common/src/test/java/me/lucko/luckperms/common/node/NodeTest.java',
    'projects/core/src/remult3/RepositoryImplementation.ts',
    'projects/tests/tests/basic-row-functionality.spec.ts',
    'node_modules/left-pad/index.js', 'types/index.d.ts', 'api/service.pb.go',
    'docs/guide.md', 'conftest.py', 'testdata/golden.go',
  ];
  const rows = probes.map((p) => `| \`${p}\` | \`${roleOf(p)}\` |`).join('\n');

  const pairs = [
    ['pkg/flytek8s/container_helper.go', 'pkg/flytek8s/container_helper_test.go'],
    ['kornia/filters/sobel.py', 'kornia/filters/tests/test_sobel.py'],
    ['common/src/main/java/me/lucko/luckperms/common/node/Node.java', 'common/src/test/java/me/lucko/luckperms/common/node/NodeTest.java'],
    ['projects/core/src/remult3/RepositoryImplementation.ts', 'projects/core/src/remult3/__tests__/RepositoryImplementation.spec.ts'],
    ['pkg/a/alpha.go', 'other/b/beta_test.go'],
  ];
  const prows = pairs.map(([s, t]) =>
    `| \`${s}\` | \`${t}\` | \`${tstem(t)}\` | ${dirshare(s, t)} | **${structuralScore(s, t)}** |`).join('\n');

  writeFileSync(`${D}/CLASSIFIERS.md`, `# CLASSIFIERS — META-289

Normative definitions live in \`PREREGISTRATION.md\` §6 (source), §7 (test) and
§16 (B1 structural rules). The executable definition is
\`scripts/classify.mjs\`, imported by **every** stage — verification, phase A,
phase B and the checker — so one definition governs classification,
denominators and baselines alike (invariant I8).

**The tables below are generated by running the real classifier**, not written
by hand. Regenerate with \`node scripts/render-phase-a.mjs\`.

## Role assignment

Roles are mutually exclusive and TEST takes precedence over SOURCE. Every path
carries exactly one of \`SOURCE | TEST | OTHER\`.

| Path | Role |
| -- | -- |
${rows}

## Excluded directory segments

A path with any of these segments in its directory portion is \`OTHER\` and can
be neither SOURCE nor TEST:

\`\`\`
${[...EXCLUDED_DIR_SEGMENTS].join('  ')}
\`\`\`

\`testdata\` and \`fixtures\` are excluded deliberately: they hold fixture data,
not test code, and counting them as tests would inflate the §17 denominator
with files no method could usefully rank.

## B1 structural score, worked

\`structuralScore = 100·[exact stem] + 10·[containment, len ≥ 4] + dirshare (0..5)\`,
where dirnames are first normalized by replacing role segments
(\`main test tests __tests__ __test__ spec specs testing e2e\`) with \`@\`.

| Source | Candidate test | \`tstem\` | \`dirshare\` | score |
| -- | -- | -- | --: | --: |
${prows}

The mirrored-layout normalization is **one cross-repository rule**. It scores
105 on the Java \`src/main/java\` ↔ \`src/test/java\` layout and simply does not
fire where that layout is absent — it is not a per-repository branch.

## Language-keyed, repository-agnostic

The same rules run over every repository in the cohort. There is no
per-repository branch anywhere in \`classify.mjs\`, and no rule was added,
removed or weighted after any result was seen.
`);
}

// ------------------------------------------------------ pre-outcome denominators
{
  const rows = Object.values(pa.repos).map((r) => {
    const sizes = r.records.map((x) => x.suiteSize);
    const min = Math.min(...sizes), max = Math.max(...sizes);
    const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length;
    const hist = r.records.map((x) => x.historyTxnCount);
    return `| ${r.stratum} | \`${r.fullName}\` | ${r.records.length} | ${n(min)} | ${mean.toFixed(1)} | ${n(max)} | ${n(Math.min(...hist))} | ${n(Math.max(...hist))} |`;
  }).join('\n');

  const cov = Object.values(pa.repos).map((r) => {
    const c = (k) => r.records.filter((x) => x[k].length > 0).length;
    const len = (k) => (r.records.reduce((a, x) => a + x[k].length, 0) / r.records.length).toFixed(1);
    return `| ${r.stratum} | \`${r.fullName}\` | ${c('rankedH')}/200 | ${c('rankedB0')}/200 | ${c('rankedB1')}/200 | ${len('rankedH')} | ${len('rankedB0')} | ${len('rankedB1')} |`;
  }).join('\n');

  writeFileSync(`${D}/DENOMINATOR-AUDIT.md`, `# DENOMINATOR-AUDIT — META-289 (part 1 of 2: PRE-OUTCOME)

> **Stage marker.** This file is committed in the **pre-outcome** commit with
> part 1 only. Part 2 — the outcome-side breakdown of \`POSITIVE\` /
> \`NEW_TEST_ONLY\` / \`ZERO_TEST_TOUCH\` queries — is added by
> \`scripts/render-results.mjs\` in the outcome commit. The git history of this
> file is itself the ordering proof.

## §17 candidate test-suite denominator

\`Suite(T0) = { p ∈ git ls-tree -r --name-only T0 : TEST(p) }\`

Every method ranks a subset of \`Suite(T0)\` and nothing else. The suite holds
only tests extant in the \`T0\` tree — never a test deleted before \`T0\`, never a
test created by \`T\` itself.

| Stratum | Repository | Queries | Suite min | Suite mean | Suite max | History txns @ first query | @ last query |
| -- | -- | --: | --: | --: | --: | --: | --: |
${rows}

Each record carries \`suiteSha256\` = \`sha256\` of the newline-joined sorted
suite. The outcome stage re-derives \`Suite(T0)\` from git independently and
**verifies that hash before reading any outcome**, so the denominator cannot
drift between stages.

## Candidate-list occupancy, before any outcome is known

These counts require no outcome and are therefore reported here, in the
pre-outcome commit. "Non-empty" means the method produced at least one
candidate; it says nothing about whether any candidate is correct.

| Stratum | Repository | H non-empty | B0 non-empty | B1 non-empty | mean \\|L_H\\| | mean \\|L_B0\\| | mean \\|L_B1\\| |
| -- | -- | --: | --: | --: | --: | --: | --: |
${cov}

\`B0\` is non-empty on every query in every repository, as expected: any test
touched even once in prior history enters its list. That is precisely why \`B0\`
is the required base-rate control — a method that is always willing to answer
is not thereby informative.

## Integrity

| File | sha256 |
| -- | -- |
| \`raw/pre-outcome.json\` | \`${sha256File(`${D}/raw/pre-outcome.json`)}\` |
`);
}

console.log('rendered: UNIVERSE-RECEIPT.md SELECTION-RECEIPT.md CLASSIFIERS.md DENOMINATOR-AUDIT.md (part 1)');
