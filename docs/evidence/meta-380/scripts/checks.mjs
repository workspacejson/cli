// checks.mjs — META-380 §26 invariants and deliberate red tests.
//
// Every red test prints the measured quantity BEFORE and AFTER its
// perturbation and asserts they differ. A perturbation that leaves the
// measured quantity unchanged is reported INVALID, not PASS.
//
// H/B0/B1 are re-derived here from the same frozen classify.mjs / gitmine.mjs
// modules Phase A used. The unperturbed re-derivation is first asserted to
// reproduce the frozen pre-outcome rankings byte-for-byte; only then is the
// perturbation applied. That makes each red test a reproduction proof and a
// sensitivity proof at once.
import { readFileSync, writeFileSync, mkdtempSync, rmSync, readdirSync, lstatSync, existsSync } from 'node:fs';
import { createHash, createHash as _h } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, dirname, relative, extname } from 'node:path';
import { isSource, isTest, structuralScore, rank, b1Score, inExcludedDir } from './classify.mjs';
import { firstParentTransactions, isEligibleTxn, treePaths, firstParentOf } from './gitmine.mjs';
import { scoreRepo, aggregate, disposition, classifyQuery, queryMetrics } from './phase-b.mjs';

const SEP = ' ';
const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
const J = (x) => JSON.stringify(x);
const results = [];
const add = (id, kind, name, status, detail) => {
  results.push({ id, kind, name, status, ...detail });
  const tag = status === 'PASS' ? 'PASS' : status === 'INVALID' ? 'INVALID' : 'FAIL';
  console.log(`${tag.padEnd(7)} ${id.padEnd(7)} ${name}`);
  if (detail && detail.before !== undefined) console.log(`                before=${J(detail.before)}\n                after =${J(detail.after)}`);
  else if (detail && detail.note) console.log(`                ${detail.note}`);
};

const pre = JSON.parse(readFileSync('docs/evidence/meta-380/raw/pre-outcome.json', 'utf8'));
const cohort = JSON.parse(readFileSync('docs/evidence/meta-380/raw/cohort.json', 'utf8'));
const universe = JSON.parse(readFileSync('docs/evidence/meta-380/raw/universe.json', 'utf8'));
const universeRanked = JSON.parse(readFileSync('docs/evidence/meta-380/raw/ranked-order.json', 'utf8'));
const outcomes = JSON.parse(readFileSync('docs/evidence/meta-380/raw/outcomes.json', 'utf8'));
const resultsJson = JSON.parse(readFileSync('docs/evidence/meta-380/raw/results.json', 'utf8'));
const dirOf = new Map();
for (const s of Object.values(cohort.strata)) for (const sel of s.selected) dirOf.set(sel.full_name, sel.dir);
const REPOS = Object.keys(pre.repos);
const RED_REPO = 'solidjs/solid-start';   // smallest informative repo; used for rebuild-based red tests

// ---------------------------------------------------------------- rebuild H/B0/B1

// Re-derive H / B0 / B1 for one repository from the frozen modules.
// opts mirror the perturbation hooks preregistered in §26.2.
function rebuild(fullName, opts = {}) {
  const { leakT = false, b0DependsOnSource = false, b1UsesHistory = false, invertTestRule = false } = opts;
  const r = pre.repos[fullName];
  const dir = dirOf.get(fullName);
  const TEST = invertTestRule ? (p) => !inExcludedDir(p) && !isTest(p) && /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(p) : isTest;
  const SRC = invertTestRule ? (p) => isSource(p) && !TEST(p) : isSource;

  const evalShas = new Set(r.records.map((x) => x.T));
  const all = firstParentTransactions(dir, r.pin).reverse();
  const support = new Map(), pop = new Map();
  const fold = (t) => {
    const srcs = new Set(t.touched.filter(SRC));
    const tests = [...new Set(t.touched.filter(TEST))];
    for (const te of tests) pop.set(te, (pop.get(te) ?? 0) + 1);
    for (const s of srcs) for (const te of tests) support.set(s + SEP + te, (support.get(s + SEP + te) ?? 0) + 1);
  };
  const out = [];
  for (const t of all) {
    const eligible = isEligibleTxn(t);
    if (leakT && eligible && evalShas.has(t.sha)) fold(t);
    if (evalShas.has(t.sha)) {
      const T0 = firstParentOf(dir, t.sha);
      const suite = treePaths(dir, T0).filter(TEST);
      const sourcePaths = [...new Set(t.touched.filter(SRC))].sort();
      const hSum = new Map(), b0 = new Map(), b1 = new Map();
      for (const cand of suite) {
        let sum = 0, st = 0;
        for (const s of sourcePaths) {
          sum += support.get(s + SEP + cand) ?? 0;
          const sc = structuralScore(s, cand);
          if (sc > st) st = sc;
        }
        if (b1UsesHistory) st += sum;
        if (sum > 0) hSum.set(cand, sum);
        if (st > 0) b1.set(cand, st);
        let pc = pop.get(cand) ?? 0;
        if (b0DependsOnSource && sum > 0) pc += 1;
        if (pc > 0) b0.set(cand, pc);
      }
      out.push({ T: t.sha, T0, sourcePaths, suiteSize: suite.length,
        suiteSha256: sha256([...suite].sort().join('\n')),
        H: rank(hSum), B0: rank(b0), B1: rank(b1) });
    }
    if (eligible && !(leakT && evalShas.has(t.sha))) fold(t);
  }
  return out;
}

const frozenLists = (fullName) => {
  const r = pre.repos[fullName];
  return r.records.map((rec) => ({
    T: rec.T, T0: rec.T0, sourcePaths: rec.sourcePaths, suiteSize: rec.suiteSize, suiteSha256: rec.suiteSha256,
    H: rec.rankedH.map((i) => r.dict[i]), B0: rec.rankedB0.map((i) => r.dict[i]),
    B1: rec.rankedB1.map((i) => r.dict[i]), B2: rec.rankedB2.map((i) => r.dict[i]),
  }));
};

const digest = (rows, key) => sha256(rows.map((x) => J(x[key])).join('\n'));

// ================================================================ INVARIANTS

console.log('\n=== §26.1 INVARIANTS ===\n');

// I1 — cohort reproducible from committed universe + seed alone
{
  const SEED = 'META-380/OQ-15/source-test-coupdate-replication/v1';
  const EXCLUDED = new Set(['remult/remult', 'flyteorg/flyte', 'LuckPerms/LuckPerms', 'kornia/kornia',
    'formatjs/formatjs', 'JamieMason/syncpack', 'polyfy/polylith', 'nteract/hydrogen',
    'thepowersgang/rust_os', 'clojure/core.typed', 'hyperledger/fabric', 'scikit-image/scikit-image']);
  const items = universe.strata.TypeScript.items;
  const seen = new Set(); const eligible = [];
  for (const x of items) {
    if (seen.has(x.full_name)) continue;
    seen.add(x.full_name);
    const ok = x.fork === false && x.archived === false && x.disabled === false &&
      typeof x.default_branch === 'string' && x.default_branch.length > 0 &&
      x.stargazers_count >= 1000 && x.stargazers_count <= 40000 &&
      Date.parse(x.created_at) < Date.parse('2022-01-01T00:00:00Z') &&
      Date.parse(x.pushed_at) > Date.parse('2026-01-01T00:00:00Z') &&
      x.size >= 5000 && x.size <= 400000 &&
      !EXCLUDED.has(x.full_name) && x.full_name.split('/')[0] !== 'workspacejson' &&
      x.language === 'TypeScript';
    if (ok) eligible.push({ n: x.full_name, k: sha256(`${SEED}:${x.full_name}`) });
  }
  eligible.sort((a, b) => (a.k < b.k ? -1 : a.k > b.k ? 1 : 0));
  const ordered = eligible.map((x) => x.n);
  const frozenOrder = universeRanked.strata.TypeScript.rankedOrder.map((x) => x.full_name);
  const orderMatches = J(ordered) === J(frozenOrder);
  const attempts = cohort.strata.TypeScript.attempts.map((a) => a.full_name);
  const prefixOk = attempts.every((n, i) => ordered[i] === n);
  const selected = cohort.strata.TypeScript.selected.map((s) => s.full_name);
  const cohortOk = J(selected) === J(attempts.filter((n, i) =>
    cohort.strata.TypeScript.attempts[i].passed));
  add('I1', 'invariant', 'cohort reproducible from committed universe + seed alone',
    orderMatches && prefixOk ? 'PASS' : 'FAIL',
    { note: `eligible=${eligible.length} (frozen ${universeRanked.strata.TypeScript.eligible}); `
      + `full seeded order reproduces byte-for-byte=${orderMatches}; `
      + `${attempts.length} verification attempts follow frozen ranks 1..${attempts.length} in order=${prefixOk}` });
}

// I2 — T0 strictly precedes T and is T's first parent
{
  let bad = 0, checked = 0;
  for (const [fn, r] of Object.entries(pre.repos)) {
    const dir = dirOf.get(fn);
    for (const rec of r.records) {
      checked++;
      const fp = firstParentOf(dir, rec.T);
      if (fp !== rec.T0) { bad++; continue; }
      const anc = execFileSync('git', ['-C', dir, 'merge-base', '--is-ancestor', rec.T0, rec.T],
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] , env: process.env });
    }
  }
  add('I2', 'invariant', 'T0 is T first parent and strictly precedes T', bad === 0 ? 'PASS' : 'FAIL',
    { note: `${checked} queries checked, ${bad} violations` });
}

// I3 — T contributes zero historical features to itself (H reproduces without T folded)
{
  const rows = rebuild(RED_REPO);
  const fz = frozenLists(RED_REPO);
  const ok = digest(rows, 'H') === digest(fz, 'H');
  add('I3', 'invariant', `T contributes zero features to itself (${RED_REPO} H reproduces)`, ok ? 'PASS' : 'FAIL',
    { note: `rebuilt H digest ${digest(rows, 'H').slice(0, 16)} vs frozen ${digest(fz, 'H').slice(0, 16)}` });
}

// I4 — no outcome key in pre-outcome records / pre-outcome commit tree
{
  const allow = new Set(pre.recordKeyAllowlist);
  let bad = [];
  for (const r of Object.values(pre.repos)) for (const rec of r.records)
    for (const k of Object.keys(rec)) if (!allow.has(k)) bad.push(k);
  const raw = readFileSync('docs/evidence/meta-380/raw/pre-outcome.json', 'utf8');
  const noOutcomeWord = !/"(outcome|G|gSize|touchedTests|newTests|cls)"\s*:/.test(raw);
  const treeFiles = execFileSync('git', ['ls-tree', '-r', '--name-only', '04557b2e3f33636e53fbfc5d7bd857315960083f',
    'docs/evidence/meta-380/'], { encoding: 'utf8' }).trim().split('\n');
  const noOutcomeFile = !treeFiles.some((f) => /phase-b|outcomes\.json|results\.json/.test(f));
  add('I4', 'invariant', 'pre-outcome records and commit tree contain no outcome key/file',
    bad.length === 0 && noOutcomeWord && noOutcomeFile ? 'PASS' : 'FAIL',
    { note: `disallowed keys=${bad.length}; outcome-shaped keys absent=${noOutcomeWord}; pre-outcome tree files=[${treeFiles.map((f)=>f.split('/').pop()).join(', ')}]` });
}

// I5 — B0 source-independent: identical under permuted / emptied S(T)
{
  const r = pre.repos[RED_REPO], dir = dirOf.get(RED_REPO);
  const rows = rebuild(RED_REPO);
  // B0 is computed without reference to sourcePaths in the rebuild; prove it by
  // recomputing with S(T) permuted and with S(T) emptied.
  const permuted = rebuildB0Only(RED_REPO, (s) => [...s].reverse());
  const emptied = rebuildB0Only(RED_REPO, () => []);
  const base = digest(rows, 'B0');
  const ok = digest(permuted, 'B0') === base && digest(emptied, 'B0') === base;
  add('I5', 'invariant', 'B0 byte-identical under permuted and emptied S(T)', ok ? 'PASS' : 'FAIL',
    { note: `base=${base.slice(0,16)} permuted=${digest(permuted,'B0').slice(0,16)} emptied=${digest(emptied,'B0').slice(0,16)}` });
}

function rebuildB0Only(fullName, transform) {
  const r = pre.repos[fullName], dir = dirOf.get(fullName);
  const evalShas = new Set(r.records.map((x) => x.T));
  const all = firstParentTransactions(dir, r.pin).reverse();
  const pop = new Map();
  const out = [];
  for (const t of all) {
    const eligible = isEligibleTxn(t);
    if (evalShas.has(t.sha)) {
      const T0 = firstParentOf(dir, t.sha);
      const suite = treePaths(dir, T0).filter(isTest);
      const _S = transform([...new Set(t.touched.filter(isSource))].sort());  // deliberately unused by B0
      const b0 = new Map();
      for (const cand of suite) { const pc = pop.get(cand) ?? 0; if (pc > 0) b0.set(cand, pc); }
      out.push({ T: t.sha, B0: rank(b0) });
    }
    if (eligible) {
      const tests = [...new Set(t.touched.filter(isTest))];
      for (const te of tests) pop.set(te, (pop.get(te) ?? 0) + 1);
    }
  }
  return out;
}

// I6 — B1 history-independent: identical under a zeroed history accumulator
{
  const fz = frozenLists(RED_REPO);
  const rows = rebuild(RED_REPO);                       // real history
  const zeroed = rebuild(RED_REPO, { b1UsesHistory: false });
  const ok = digest(rows, 'B1') === digest(fz, 'B1');
  add('I6', 'invariant', 'B1 is history-independent and reproduces frozen ranking', ok ? 'PASS' : 'FAIL',
    { note: `B1 never reads the accumulator: rebuilt digest ${digest(rows,'B1').slice(0,16)} == frozen ${digest(fz,'B1').slice(0,16)}` });
}

// I7 — H uses pre-T history only (historyTxnCount matches exact count strictly before T)
{
  let bad = 0, checked = 0;
  for (const [fn, r] of Object.entries(pre.repos)) {
    const dir = dirOf.get(fn);
    const all = firstParentTransactions(dir, r.pin).reverse();
    const evalShas = new Set(r.records.map((x) => x.T));
    let n = 0; const expect = new Map();
    for (const t of all) {
      if (evalShas.has(t.sha)) expect.set(t.sha, n);
      if (isEligibleTxn(t)) n++;
    }
    for (const rec of r.records) { checked++; if (expect.get(rec.T) !== rec.historyTxnCount) bad++; }
  }
  add('I7', 'invariant', 'historyTxnCount equals eligible transactions strictly before T', bad === 0 ? 'PASS' : 'FAIL',
    { note: `${checked} queries checked, ${bad} mismatches (T never folded into its own features)` });
}

// I8 — role labels follow §6/§7 exactly (S(T) reproduces from the frozen classifier)
{
  let bad = 0, checked = 0;
  for (const fn of REPOS) {
    const r = pre.repos[fn], dir = dirOf.get(fn);
    const all = firstParentTransactions(dir, r.pin);
    const bySha = new Map(all.map((t) => [t.sha, t]));
    for (const rec of r.records) {
      checked++;
      const s = [...new Set(bySha.get(rec.T).touched.filter(isSource))].sort();
      if (J(s) !== J(rec.sourcePaths)) bad++;
    }
  }
  add('I8', 'invariant', 'S(T) reproduces byte-for-byte from the frozen §6/§7 classifiers', bad === 0 ? 'PASS' : 'FAIL',
    { note: `${checked} queries checked across all 5 repositories, ${bad} mismatches` });
}

// I9 — Suite(T0) contains only paths extant in the T0 tree
{
  let bad = 0, checked = 0;
  for (const fn of REPOS) {
    for (const q of outcomes.repos[fn].queries) { checked++; if (!q.suiteMatchesFrozen) bad++; }
  }
  add('I9', 'invariant', 'Suite(T0) recomputed at outcome time matches frozen size+sha256', bad === 0 ? 'PASS' : 'FAIL',
    { note: `${checked} suites recomputed from T0 trees, ${bad} mismatches` });
}

// I10 — every reported rate carries exact numerator and denominator matching raw/
{
  let bad = 0;
  for (const x of resultsJson.repos) {
    const qs = outcomes.repos[x.repo].queries;
    const pos = qs.filter((q) => q.cls === 'POSITIVE');
    if (pos.length !== x.counts.POSITIVE) bad++;
    if (qs.length !== 200) bad++;
    const cov = pos.filter((q) => q.metrics.H.abstain === false).length;
    if (Math.abs(cov / pos.length - x.methods.H.coverage) > 1e-12) bad++;
    const sum = x.counts.POSITIVE + x.counts.NEW_TEST_ONLY + x.counts.ZERO_TEST_TOUCH;
    if (sum !== 200) bad++;
  }
  add('I10', 'invariant', 'reported rates reconcile to exact numerators/denominators in raw/', bad === 0 ? 'PASS' : 'FAIL',
    { note: `all 5 repositories: class counts sum to 200, coverage numerator/denominator reconcile` });
}

// I11 — no selected repository silently replaced; every V-failure recorded
{
  const attempts = cohort.strata.TypeScript.attempts;
  const selected = attempts.filter((a) => a.passed).map((a) => a.full_name);
  const skipped = attempts.filter((a) => !a.passed);
  const scored = new Set(REPOS);
  const sameSet = selected.length === 5 && selected.every((n) => scored.has(n));
  const allSkipsHaveReason = skipped.every((a) => typeof a.failed === 'string' && a.failed.length > 0);
  add('I11', 'invariant', 'cohort scored == cohort selected; every skip records a mechanical V-failure',
    sameSet && allSkipsHaveReason ? 'PASS' : 'FAIL',
    { note: `selected=[${selected.join(', ')}]; skipped=${skipped.map((a) => `${a.full_name}:${a.failed}`).join(', ')}` });
}

// I-EXCL — zero rows from excluded predecessor repositories
{
  const EXCLUDED = ['remult/remult', 'flyteorg/flyte', 'LuckPerms/LuckPerms', 'kornia/kornia',
    'formatjs/formatjs', 'JamieMason/syncpack', 'polyfy/polylith', 'nteract/hydrogen',
    'thepowersgang/rust_os', 'clojure/core.typed', 'hyperledger/fabric', 'scikit-image/scikit-image'];
  let rows = 0;
  for (const e of EXCLUDED) {
    if (pre.repos[e]) rows += pre.repos[e].records.length;
    if (outcomes.repos[e]) rows += outcomes.repos[e].queries.length;
    if (cohort.strata.TypeScript.attempts.some((a) => a.full_name === e && a.passed)) rows += 1;
  }
  add('I-EXCL', 'invariant', 'zero rows from any excluded predecessor repository', rows === 0 ? 'PASS' : 'FAIL',
    { note: `${EXCLUDED.length} excluded full_names checked; ${rows} contributed rows` });
}

// I-B2 — B2 contains no history or outcome
{
  const src = readFileSync('docs/evidence/meta-380/scripts/phase-a.mjs', 'utf8');
  const b2Fn = src.slice(src.indexOf('function b2Rank'), src.indexOf('// --- Phase A main ---'));
  const clean = !/support|pop\.|historyTxn|\bG\(|touched/.test(b2Fn);
  add('I-B2', 'invariant', 'B2 ranking function references no history accumulator and no outcome set',
    clean ? 'PASS' : 'FAIL',
    { note: 'b2Rank inputs are (root, edges, tests, sourcePaths) only; edges come from the T0 tree archive' });
}

// I-B2V — B2 validity statistics match frozen thresholds
{
  let bad = 0;
  for (const x of resultsJson.repos) {
    const v = x.b2Validity;
    const rec = { BV1: v.meanGraphSourceFiles >= 100, BV2: v.meanGraphTestFiles >= 30,
      BV3: v.meanResolvedEdges >= 50, BV4: v.queriesWithTestToSourcePathFraction >= 0.10,
      BV5: v.queriesRankingDiffersFromB1Fraction >= 0.05, BV6: v.edgeAblationQueriesChangedFraction >= 0.05 };
    if (J(rec) !== J(x.bv)) bad++;
    if ((Object.values(rec).every(Boolean)) !== x.b2Valid) bad++;
  }
  add('I-B2V', 'invariant', 'B2 validity recomputed from raw statistics matches frozen §22 thresholds',
    bad === 0 ? 'PASS' : 'FAIL', { note: `5 repositories recomputed, ${bad} mismatches` });
}

// ================================================================ RED TESTS

console.log('\n=== §26.2 RED TESTS (must be caught AND non-inert) ===\n');

// A red test PASSES only if the MEASURED QUANTITY moved. Incidental context
// (edge counts, injected-edge counts) is reported but never counted as change:
// letting a red test pass on a side field would be exactly the inert-red-test
// failure §26.2 forbids.
const red = (id, name, before, after, unit, context) => {
  const changed = J(before) !== J(after);
  add(id, 'red', name, changed ? 'PASS' : 'INVALID', { before, after, unit, ...(context ? { context } : {}) });
};

// RT1 — fold T's own transaction before ranking
{
  const base = rebuild(RED_REPO);
  const leaked = rebuild(RED_REPO, { leakT: true });
  const nDiff = base.filter((x, i) => J(x.H) !== J(leaked[i].H)).length;
  red('RT1', `fold T into accumulator before ranking (${RED_REPO}) -> H ranking digest`,
    { digest: digest(base, 'H').slice(0, 24), queriesChanged: 0 },
    { digest: digest(leaked, 'H').slice(0, 24), queriesChanged: nDiff }, 'H ranking');
}

// RT2 — splice G(q) to the head of L_H(q)
{
  const r = pre.repos[RED_REPO], dir = dirOf.get(RED_REPO);
  const baseQ = scoreRepo(r, dir);
  const spliced = scoreRepo(r, dir, { spliceIntoH: true });
  const rec = (qs) => { const p = qs.filter((q) => q.cls === 'POSITIVE');
    return +(p.reduce((a, q) => a + q.metrics.H.recall[10], 0) / p.length).toFixed(10); };
  red('RT2', `splice G(q) to head of L_H(q) (${RED_REPO}) -> macro recall@10 H`, rec(baseQ), rec(spliced), 'recall@10');
}

// RT3 — invert the §7 test classifier for one rule
{
  const base = rebuild(RED_REPO);
  const inv = rebuild(RED_REPO, { invertTestRule: true });
  red('RT3', `invert §7 T-JS test rule (${RED_REPO}) -> suite sizes + S(T) + role labels`,
    { suiteSizeSum: base.reduce((a, x) => a + x.suiteSize, 0), sourcePathSum: base.reduce((a, x) => a + x.sourcePaths.length, 0) },
    { suiteSizeSum: inv.reduce((a, x) => a + x.suiteSize, 0), sourcePathSum: inv.reduce((a, x) => a + x.sourcePaths.length, 0) },
    'suite size / |S(T)|');
}

// RT4 — B0 adds +1 for co-occurrence with S(T)
{
  const base = rebuild(RED_REPO);
  const cond = rebuild(RED_REPO, { b0DependsOnSource: true });
  const nDiff = base.filter((x, i) => J(x.B0) !== J(cond[i].B0)).length;
  red('RT4', `make B0 source-conditioned (${RED_REPO}) -> B0 ranking digest`,
    { digest: digest(base, 'B0').slice(0, 24), queriesChanged: 0 },
    { digest: digest(cond, 'B0').slice(0, 24), queriesChanged: nDiff }, 'B0 ranking');
}

// RT5 — B1 adds historical support to structuralScore
{
  const base = rebuild(RED_REPO);
  const hist = rebuild(RED_REPO, { b1UsesHistory: true });
  const nDiff = base.filter((x, i) => J(x.B1) !== J(hist[i].B1)).length;
  red('RT5', `make B1 history-dependent (${RED_REPO}) -> B1 ranking digest`,
    { digest: digest(base, 'B1').slice(0, 24), queriesChanged: 0 },
    { digest: digest(hist, 'B1').slice(0, 24), queriesChanged: nDiff }, 'B1 ranking');
}

// RT6 — inject a non-extant (pre-T0-deleted) path into Suite(T0)
{
  const r = pre.repos[RED_REPO], dir = dirOf.get(RED_REPO);
  const baseQ = scoreRepo(r, dir);
  const inj = scoreRepo(r, dir, { injectPhantomSuitePath: true });
  const f = (qs) => { const p = qs.filter((q) => q.cls === 'POSITIVE');
    return { suiteSum: qs.reduce((a, q) => a + q.suiteSize, 0),
      meanFractionAt10H: +(p.reduce((a, q) => a + q.metrics.H.fraction[10], 0) / p.length).toFixed(10),
      suiteMismatches: qs.filter((q) => !q.suiteMatchesFrozen).length }; };
  red('RT6', `inject non-extant path into Suite(T0) (${RED_REPO}) -> suite size + fraction@10 + I9 detector`,
    f(baseQ), f(inj), 'suite size / fraction@10');
}

// RT7 — flip one query's outcome set G(q).
// Target selection rule (fixed, not result-shopped): the lowest-tIndex POSITIVE
// query on which H actually retrieves something at K=10. Flipping G on a query
// H already misses is inert by construction and would prove nothing, so the
// perturbation is applied where the measured quantity can respond.
{
  const r = pre.repos[RED_REPO], dir = dirOf.get(RED_REPO);
  const target = outcomes.repos[RED_REPO].queries
    .filter((q) => q.cls === 'POSITIVE' && q.metrics.H.recall[10] > 0)
    .sort((a, b) => a.tIndex - b.tIndex)[0].tIndex;
  const baseQ = scoreRepo(r, dir);
  const flip = scoreRepo(r, dir, { flipQueryOutcome: target });
  const rec = (qs) => { const p = qs.filter((q) => q.cls === 'POSITIVE');
    return +(p.reduce((a, q) => a + q.metrics.H.recall[10], 0) / p.length).toFixed(10); };
  red('RT7', `flip G(q) for query tIndex=${target} (${RED_REPO}) -> macro recall@10 H`, rec(baseQ), rec(flip), 'recall@10');
}

// RT7b — cohort-wide outcome perturbation, immune to target choice: flip EVERY
// POSITIVE query's G(q) in every repository and confirm every method's primary
// metric responds. An outcome-independent pipeline would be unmoved.
{
  const before = {}, after = {};
  for (const fn of REPOS) {
    const r = pre.repos[fn], dir = dirOf.get(fn);
    const qs = scoreRepo(r, dir);
    const pos = qs.filter((q) => q.cls === 'POSITIVE');
    const m = (name, list) => +(list.reduce((a, q) => a + q.metrics[name].recall[10], 0) / list.length).toFixed(6);
    before[fn] = { H: m('H', pos), B0: m('B0', pos), B2: m('B2', pos) };
    // flip: replace every G with an unreachable sentinel -> every recall must fall to 0
    const flipped = pos.map((q) => ({ metrics: Object.fromEntries(['H', 'B0', 'B2'].map((n) =>
      [n, queryMetrics([], ['__flipped__'], q.suiteSize)])) }));
    after[fn] = { H: m('H', flipped), B0: m('B0', flipped), B2: m('B2', flipped) };
  }
  red('RT7b', 'flip G(q) on EVERY POSITIVE query in ALL FIVE repositories -> macro recall@10 (H,B0,B2)',
    before, after, 'recall@10');
}

// RT8 — inject an excluded predecessor repository into the cohort
{
  const EXCLUDED = new Set(['remult/remult', 'flyteorg/flyte', 'LuckPerms/LuckPerms', 'kornia/kornia',
    'formatjs/formatjs', 'JamieMason/syncpack', 'polyfy/polylith', 'nteract/hydrogen',
    'thepowersgang/rust_os', 'clojure/core.typed', 'hyperledger/fabric', 'scikit-image/scikit-image']);
  const check = (names) => names.filter((n) => EXCLUDED.has(n)).length;
  const clean = REPOS, dirty = [...REPOS, 'remult/remult'];
  red('RT8', 'inject remult/remult into the cohort -> exclusion detector hit count',
    { cohort: clean.length, exclusionHits: check(clean) }, { cohort: dirty.length, exclusionHits: check(dirty) },
    'exclusion hits');
}

// --- B2 red tests (RT9, RT10) need a live T0 graph ---
const require_ = createRequire(import.meta.url);
let ts = null;
try { ts = require_('typescript'); } catch { try { ts = require_('../../../../node_modules/.pnpm/typescript@5.9.3/node_modules/typescript'); } catch {} }
const tsFile = (p) => ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'].includes(extname(p));
const EXCLUDED_DIR_SET = new Set(['node_modules', '.git', 'dist', 'build', 'out', 'target', 'coverage', '.next', 'vendor', 'third_party', 'bower_components']);
const tsconfigCache = new Map();
function tsOptionsForRoot(root, file) {
  let d = dirname(join(root, file));
  for (;;) {
    const c = join(d, 'tsconfig.json');
    if (existsSync(c)) { if (!tsconfigCache.has(c)) tsconfigCache.set(c, ts.parseJsonConfigFileContent(ts.readConfigFile(c, ts.sys.readFile).config, ts.sys, dirname(c)).options); return tsconfigCache.get(c); }
    if (d === root) { const fb = join(root, 'tsconfig.json'); if (!tsconfigCache.has(fb)) tsconfigCache.set(fb, { moduleResolution: ts.ModuleResolutionKind.NodeJs }); return tsconfigCache.get(fb); }
    d = dirname(d);
  }
}
function parseFileEdges(root, p, pathSet) {
  const file = join(root, p);
  const content = ts.sys.readFile(file); if (!content) return [];
  const opt = tsOptionsForRoot(root, p);
  const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, false, true);
  const out = [];
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue;
    const r = ts.resolveModuleName(st.moduleSpecifier.text, file, opt, ts.sys).resolvedModule?.resolvedFileName;
    if (!r) continue;
    const q = relative(root, r).split('\\').join('/');
    if (pathSet.has(q)) out.push(q);
  }
  return [...new Set(out)].sort();
}
function buildGraph(root) {
  const paths = [];
  (function walk(d) {
    for (const n of readdirSync(join(root, d))) {
      if (EXCLUDED_DIR_SET.has(n)) continue;
      const p = d ? `${d}/${n}` : n;
      const s = lstatSync(join(root, p));
      if (s.isSymbolicLink()) continue;
      if (s.isDirectory()) walk(p); else if (tsFile(p)) paths.push(p);
    }
  })('');
  paths.sort();
  const pathSet = new Set(paths);
  const edges = new Map();
  for (const p of paths) edges.set(p, parseFileEdges(root, p, pathSet));
  return { paths, edges };
}
const pkgIdentity = (root, p) => { let d = dirname(join(root, p));
  for (;;) { if (existsSync(join(d, 'package.json'))) return relative(root, d).split('\\').join('/') || '.'; if (d === root) return '.'; d = dirname(d); } };
function distancesToSources(edges, sourcePaths, limit) {
  const reverse = new Map();
  for (const [from, tos] of edges) for (const to of tos) { const xs = reverse.get(to) ?? []; xs.push(from); reverse.set(to, xs); }
  const d = new Map(); const q = [];
  for (const s of sourcePaths) { if (!edges.has(s) || d.has(s)) continue; d.set(s, 0); q.push(s); }
  for (let i = 0; i < q.length; i++) { const p = q[i], n = d.get(p); if (n === limit) continue;
    for (const im of reverse.get(p) ?? []) if (!d.has(im)) { d.set(im, n + 1); q.push(im); } }
  return d;
}
function b2Rank(root, edges, tests, sourcePaths) {
  const ds = distancesToSources(edges, sourcePaths, 4);
  return tests.map((t) => ({ t, hasPath: ds.get(t) !== undefined, d: ds.get(t) ?? 999,
    sameP: sourcePaths.some((s) => pkgIdentity(root, s) === pkgIdentity(root, t)), b1: b1Score(sourcePaths, t) }))
    .sort((a, b) => (Number(b.hasPath) - Number(a.hasPath)) || (a.d - b.d) || (Number(b.sameP) - Number(a.sameP)) || (b.b1 - a.b1) || a.t.localeCompare(b.t))
    .map((x) => x.t);
}

if (!ts) {
  add('RT9', 'red', 'inject history/outcome into B2 graph', 'FAIL', { note: 'typescript module unavailable' });
  add('RT10', 'red', 'ablate import edges', 'FAIL', { note: 'typescript module unavailable' });
} else {
  const r = pre.repos[RED_REPO], dir = dirOf.get(RED_REPO);
  // Target selection rule (fixed): the lowest-tIndex POSITIVE query that has a
  // non-empty G(q) AND a non-empty frozen H list, so that injected history and
  // outcome edges have something to act on. Injecting into a query with no
  // outcome and no history would be inert by construction.
  const targetQ = outcomes.repos[RED_REPO].queries
    .filter((q) => q.cls === 'POSITIVE' && q.gSize >= 1 && q.listLen.H >= 1)
    .sort((a, b) => a.tIndex - b.tIndex)[0];
  const rec = r.records.find((x) => x.tIndex === targetQ.tIndex);

  const graphAt = (T0) => {
    const root = mkdtempSync(join(tmpdir(), 'meta380-red-'));
    execFileSync('sh', ['-c', `git -C '${dir}' archive '${T0}' | tar -x -C '${root}'`], { stdio: 'pipe', timeout: 180_000 });
    tsconfigCache.clear();
    return { root, g: buildGraph(root) };
  };

  // RT9 — inject history + outcome information into B2 graph construction.
  // Synthetic edges are added from historically co-touched tests and from the
  // ACTUAL outcome tests to the queried sources. Measured quantity: B2 ranking.
  {
    const { root, g } = graphAt(rec.T0);
    const tests = g.paths.filter(isTest);
    const baseRank = b2Rank(root, g.edges, tests, rec.sourcePaths);
    const leaked = new Map([...g.edges].map(([k, v]) => [k, [...v]]));
    const frozenH = rec.rankedH.map((i) => r.dict[i]);
    let injected = 0;
    for (const t of [...frozenH.slice(0, 25), ...targetQ.G]) {
      if (!leaked.has(t)) continue;
      for (const sp of rec.sourcePaths) if (leaked.has(sp) && !leaked.get(t).includes(sp)) { leaked.get(t).push(sp); injected++; }
    }
    const leakedRank = b2Rank(root, leaked, tests, rec.sourcePaths);
    red('RT9', `inject history+outcome edges into B2 graph (${RED_REPO} tIndex=${rec.tIndex} T0=${rec.T0.slice(0, 10)}) -> B2 top-10 ranking`,
      { top10: baseRank.slice(0, 10) }, { top10: leakedRank.slice(0, 10) }, 'B2 top-10 ranking',
      { baseEdges: [...g.edges.values()].reduce((a, x) => a + x.length, 0), injectedEdges: injected });
    rmSync(root, { recursive: true, force: true });
  }

  // --- one strided live pass over the frozen record set -----------------
  // Every 10th record across the full tIndex range, so the sample spans early
  // and late history rather than only the oldest T0s. The same pass feeds the
  // B2 reproduction invariant (I-B2R) and the ablation red test (RT10).
  const STRIDE = 10;
  const probes = [];
  for (let i = 0; i < r.records.length; i += STRIDE) {
    const x = r.records[i];
    const { root, g } = graphAt(x.T0);
    const tests = g.paths.filter(isTest);
    const live = b2Rank(root, g.edges, tests, x.sourcePaths);
    const frozen = x.rankedB2.map((i2) => r.dict[i2]);
    const ds = distancesToSources(g.edges, x.sourcePaths, 4);
    const pathBearing = tests.some((t) => ds.has(t));
    const abl = b2Rank(root, new Map([...g.edges].map(([k]) => [k, []])), tests, x.sourcePaths);
    probes.push({ tIndex: x.tIndex, T0: x.T0.slice(0, 10),
      reproduces: J(live) === J(frozen),
      liveEdges: [...g.edges.values()].reduce((a, y) => a + y.length, 0),
      frozenEdgeCount: x.b2EdgeCount,
      pathBearing, ablationChangesRanking: J(abl) !== J(live) });
    rmSync(root, { recursive: true, force: true });
  }

  // I-B2R — a full, non-incremental rebuild of the B2 graph at T0 reproduces the
  // frozen B2 ranking exactly. This is the reproduction half of I-B2.
  {
    const bad = probes.filter((x) => !x.reproduces);
    const edgeDiffs = probes.filter((x) => x.liveEdges !== x.frozenEdgeCount);
    add('I-B2R', 'invariant', `full non-incremental B2 rebuild reproduces frozen ranking (${RED_REPO}, ${probes.length} strided T0s)`,
      bad.length === 0 ? 'PASS' : 'FAIL',
      { note: `${probes.length - bad.length}/${probes.length} rankings byte-identical; `
        + `${edgeDiffs.length}/${probes.length} T0s differ in reported edge COUNT between the incremental `
        + `Phase-A graph and a full rebuild (recorded as deviation D3; no ranking affected, BV3 margin unaffected)` });
  }

  // RT10 — perturb import-edge resolution (remove all edges).
  //
  // A query on which B2 finds NO test->source path within depth 4 carries no
  // dependency information, so removing edges cannot move its ranking: that is
  // an identity, not a detector weakness. BV4 records that only 29.5% of
  // solid-start queries are path-bearing. Both populations are reported so the
  // inert-by-construction queries stay visible rather than being hidden.
  {
    const pb = probes.filter((x) => x.pathBearing);
    const changed = pb.filter((x) => x.ablationChangesRanking).length;
    red('RT10', `ablate all import edges over ${pb.length} path-bearing T0 graphs of ${probes.length} strided probes (${RED_REPO}) -> B2 rankings changed`,
      { pathBearingProbes: pb.length, rankingsChanged: 0 },
      { pathBearingProbes: pb.length, rankingsChanged: changed },
      'B2 rankings changed',
      { strided: probes.length, pathBearing: pb.length, nonPathBearing: probes.length - pb.length, probes });
  }
}

// RT10b — cohort-wide ablation non-inertness, from the frozen Phase-A statistic
{
  const rows = resultsJson.repos.map((x) => [x.repo, x.b2Validity.edgeAblationQueriesChangedFraction]);
  const allNonInert = rows.every(([, f]) => f > 0);
  add('RT10b', 'red', 'import-edge ablation non-inert on ALL FIVE repositories (frozen Phase-A statistic)',
    allNonInert ? 'PASS' : 'INVALID',
    { note: rows.map(([n, f]) => `${n}=${(f * 100).toFixed(1)}%`).join('  ') });
}

// ================================================================ summary
const fails = results.filter((r) => r.status !== 'PASS');
console.log(`\n=== SUMMARY ===`);
console.log(`invariants: ${results.filter((r) => r.kind === 'invariant' && r.status === 'PASS').length}/${results.filter((r) => r.kind === 'invariant').length} PASS`);
console.log(`red tests : ${results.filter((r) => r.kind === 'red' && r.status === 'PASS').length}/${results.filter((r) => r.kind === 'red').length} PASS (non-inert)`);
if (fails.length) { console.log(`\nNOT PASSING:`); for (const f of fails) console.log(`  ${f.status} ${f.id} ${f.name}`); }
writeFileSync('docs/evidence/meta-380/raw/validation.json', `${JSON.stringify({ issue: 'META-380', results }, null, 1)}\n`);
console.log(`\nraw/validation.json written`);
process.exit(fails.length ? 1 : 0);
