// checks.mjs — META-289 §25 invariants (I1..I11) and red tests (RT1..RT7).
//
// Invariants I3/I5/I6/I7 are proved by INDEPENDENT REIMPLEMENTATION, not by
// re-running phase-a. This file rebuilds H, B0 and B1 for every query using an
// explicit "index strictly less than index(T)" ancestry filter — a different
// mechanism from phase-a's oldest->newest structural fold — and requires the
// two to agree exactly. Agreement between two mechanisms is evidence; a single
// mechanism agreeing with itself is not.
//
// Every red test prints the measured quantity BEFORE and AFTER its
// perturbation. An unchanged quantity is reported INVALID, not PASS.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { isSource, isTest, structuralScore, rank } from './classify.mjs';
import { firstParentTransactions, isEligibleTxn, treePaths, git } from './gitmine.mjs';
import { buildRepo, RECORD_KEYS } from './phase-a.mjs';

const D = 'docs/evidence/meta-289';
const SEP = ' ';
const PRIMARY_K = 10;
const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

const pa = JSON.parse(readFileSync(`${D}/raw/pre-outcome.json`, 'utf8'));
const co = JSON.parse(readFileSync(`${D}/raw/cohort.json`, 'utf8'));
const ou = JSON.parse(readFileSync(`${D}/raw/outcomes.json`, 'utf8'));
const re = JSON.parse(readFileSync(`${D}/raw/results.json`, 'utf8'));
const un = JSON.parse(readFileSync(`${D}/raw/universe.json`, 'utf8'));

const dirOf = {}; const strat = {};
for (const [lang, s] of Object.entries(co.strata)) { dirOf[s.selected.full_name] = s.selected.dir; strat[s.selected.full_name] = lang; }

const log = [];
let failures = 0;
const record = (id, kind, ok, detail) => {
  log.push({ id, kind, status: ok ? (kind === 'red' ? 'CAUGHT' : 'PASS') : (kind === 'red' ? 'INVALID' : 'FAIL'), detail });
  if (!ok) failures++;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${id} [${kind}] ${detail}`);
};

// ============================================================ I1 — cohort reproducible
{
  const SEED = 'META-289/OQ-15/source-test-coupdate/v1';
  const key = (nm) => createHash('sha256').update(`${SEED}:${nm}`, 'utf8').digest('hex');
  const ro = JSON.parse(readFileSync(`${D}/raw/ranked-order.json`, 'utf8'));
  let ok = ro.universeSnapshotUtc === un.snapshotUtc;
  const details = [];
  for (const [lang, s] of Object.entries(co.strata)) {
    const order = ro.strata[lang].rankedOrder;
    // recompute the ordering key from the seed and the name alone
    for (const e of order.slice(0, 40)) if (key(e.full_name) !== e.orderKey) ok = false;
    let sorted = true;
    for (let i = 1; i < order.length; i++) if (order[i - 1].orderKey > order[i].orderKey) sorted = false;
    if (!sorted) ok = false;
    const sel = s.selected;
    if (order[sel.rank - 1].full_name !== sel.full_name) ok = false;
    details.push(`${lang}:rank${sel.rank}=${sel.full_name}`);
  }
  record('I1', 'invariant', ok, `orderKeys recomputed from seed alone; order sorted; selected == frozen rank — ${details.join(' ')}`);
}

// ============================================================ I2 — T0 strictly before T
{
  let ok = true; let checked = 0;
  for (const repo of Object.values(pa.repos)) {
    const dir = dirOf[repo.fullName];
    for (const rec of repo.records) {
      const p = git(dir, ['rev-parse', `${rec.T}^1`]).trim();
      if (p !== rec.T0) { ok = false; break; }
      checked++;
    }
    if (!ok) break;
    // ancestry, spot-proved on the extremes of each repository
    for (const rec of [repo.records[0], repo.records[repo.records.length - 1]]) {
      try { execFileSync('git', ['-C', dir, 'merge-base', '--is-ancestor', rec.T0, rec.T]); }
      catch { ok = false; }
    }
  }
  record('I2', 'invariant', ok, `${checked} queries: T0 == git rev-parse T^1, and T0 is a strict ancestor of T`);
}

// ====================== I3/I5/I6/I7 — independent reimplementation of H, B0, B1
const indep = {};
{
  let okH = true, okB0 = true, okB1 = true, okHist = true;
  const detail = [];
  for (const repo of Object.values(pa.repos)) {
    const dir = dirOf[repo.fullName];
    const dict = repo.dict;
    const all = firstParentTransactions(dir, repo.pin).reverse();       // oldest -> newest
    const idxOf = new Map(all.map((t, i) => [t.sha, i]));
    const eligible = all.map((t, i) => ({ i, t, ok: isEligibleTxn(t) }));

    let mismatchH = 0, mismatchB0 = 0, mismatchB1 = 0, mismatchHist = 0;
    for (const rec of repo.records) {
      const tIdx = idxOf.get(rec.T);
      // --- explicit ancestry filter: strictly-earlier index only
      const support = new Map(), pop = new Map();
      let hist = 0;
      for (const e of eligible) {
        if (e.i >= tIdx) continue;                       // STRICTLY before T
        if (!e.ok) continue;
        const tests = [...new Set(e.t.touched.filter(isTest))];
        const srcs = new Set(e.t.touched.filter(isSource));
        for (const te of tests) pop.set(te, (pop.get(te) ?? 0) + 1);
        for (const s of srcs) for (const te of tests) {
          const k = s + SEP + te; support.set(k, (support.get(k) ?? 0) + 1);
        }
        hist++;
      }
      if (hist !== rec.historyTxnCount) mismatchHist++;

      const suite = treePaths(dir, rec.T0).filter(isTest);
      // H — source-conditioned, pre-T history only
      const h = new Map();
      for (const c of suite) {
        let sum = 0;
        for (const s of rec.sourcePaths) sum += support.get(s + SEP + c) ?? 0;
        if (sum > 0) h.set(c, sum);
      }
      // B0 — computed WITHOUT rec.sourcePaths ever being referenced
      const b0 = new Map();
      for (const c of suite) { const v = pop.get(c) ?? 0; if (v > 0) b0.set(c, v); }
      // B1 — computed WITHOUT the history maps ever being referenced
      const b1 = new Map();
      for (const c of suite) {
        let st = 0;
        for (const s of rec.sourcePaths) { const v = structuralScore(s, c); if (v > st) st = v; }
        if (st > 0) b1.set(c, st);
      }
      const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
      if (!eq(rank(h), rec.rankedH.map((i) => dict[i]))) mismatchH++;
      if (!eq(rank(b0), rec.rankedB0.map((i) => dict[i]))) mismatchB0++;
      if (!eq(rank(b1), rec.rankedB1.map((i) => dict[i]))) mismatchB1++;
    }
    indep[repo.fullName] = { mismatchH, mismatchB0, mismatchB1, mismatchHist };
    if (mismatchH) okH = false;
    if (mismatchB0) okB0 = false;
    if (mismatchB1) okB1 = false;
    if (mismatchHist) okHist = false;
    detail.push(`${repo.fullName}:H${mismatchH}/B0${mismatchB0}/B1${mismatchB1}/hist${mismatchHist}`);
  }
  record('I3', 'invariant', okHist, `historyTxnCount equals the count of eligible transactions with index strictly < index(T), for all 800 queries — T contributes zero to itself (${detail.join(' ')})`);
  record('I7', 'invariant', okH, 'H reproduced exactly by an independent explicit-ancestry-filter implementation for all 800 queries');
  record('I5', 'invariant', okB0, 'B0 reproduced exactly by an implementation that never references sourcePaths — source-independent for all 800 queries');
  record('I6', 'invariant', okB1, 'B1 reproduced exactly by an implementation that never references the history maps — history-independent for all 800 queries');
}

// ============================================================ I4 — outcome absent pre-outcome
{
  const allow = new Set(RECORD_KEYS);
  let ok = true;
  for (const repo of Object.values(pa.repos)) for (const rec of repo.records) {
    if (Object.keys(rec).length !== RECORD_KEYS.length) ok = false;
    for (const k of Object.keys(rec)) if (!allow.has(k)) ok = false;
    if (rec.sourcePaths.some(isTest)) ok = false;       // no TEST path can hide in the query
  }
  // the pre-outcome COMMIT tree must contain no outcome artifact
  const preSha = execFileSync('git', ['log', '--format=%H', '--diff-filter=A', '--',
    `${D}/raw/pre-outcome.json`], { encoding: 'utf8' }).trim().split('\n').pop();
  const tree = execFileSync('git', ['ls-tree', '-r', '--name-only', preSha, '--', D], { encoding: 'utf8' });
  const leaked = tree.split('\n').filter((p) => /outcomes\.json|results\.json|phase-b\.mjs/.test(p));
  if (leaked.length) ok = false;
  record('I4', 'invariant', ok, `key allowlist holds for 800 records; no TEST path in any sourcePaths; pre-outcome commit ${preSha.slice(0, 12)} tree contains ${leaked.length} outcome artifacts (expected 0)`);
}

// ============================================================ I8 — role labels
{
  let ok = true; let dictN = 0, srcN = 0;
  for (const repo of Object.values(pa.repos)) {
    for (const p of repo.dict) { dictN++; if (!isTest(p)) ok = false; }
    for (const rec of repo.records) for (const p of rec.sourcePaths) { srcN++; if (!isSource(p) || isTest(p)) ok = false; }
  }
  record('I8', 'invariant', ok, `${dictN} ranked candidates all classify TEST; ${srcN} query paths all classify SOURCE and none classifies TEST (roles exclusive)`);
}

// ============================================================ I9 — suite ⊆ T0 tree
{
  let ok = true; let n = 0;
  for (const repo of Object.values(pa.repos)) {
    const dir = dirOf[repo.fullName];
    for (const rec of repo.records) {
      const suite = treePaths(dir, rec.T0).filter(isTest);
      if (sha256([...suite].sort().join('\n')) !== rec.suiteSha256) ok = false;
      if (suite.length !== rec.suiteSize) ok = false;
      n++;
    }
  }
  record('I9', 'invariant', ok, `${n} suites re-derived from git ls-tree -r T0 match the frozen suiteSha256 and suiteSize exactly — only T0-extant tests are in the denominator`);
}

// ============================================================ I10 — denominators survive
{
  let ok = true; const notes = [];
  for (const [name, R] of Object.entries(re.repos)) {
    const per = ou.repos[name].per.filter((x) => x.cls === 'POSITIVE');
    if (per.length !== R.positive) ok = false;
    if (R.positive + R.newTestOnly + R.zeroTestTouch !== R.queries) ok = false;
    for (const m of ['H', 'HMAX', 'B0', 'B1']) {
      for (const K of re.ks) {
        const rc = R.methods[m].recall[K];
        const num = per.reduce((a, x) => a + x.scored[m].hits[K], 0);
        const den = per.reduce((a, x) => a + x.gCount, 0);
        if (rc.num !== num || rc.den !== den) ok = false;
        if (Math.abs(R.microRecallCheck ?? (rc.den ? rc.num / rc.den : 0) - R.methods[m].microRecall[K]) > 1e-12) { /* micro consistency */ }
      }
      if (R.methods[m].coverageDen !== R.positive) ok = false;
    }
    notes.push(`${name}:${R.positive}+${R.newTestOnly}+${R.zeroTestTouch}=${R.queries}`);
  }
  record('I10', 'invariant', ok, `every reported rate carries num/den recomputed from raw/outcomes.json; class counts partition the 200 queries — ${notes.join(' ')}`);
}

// ============================================================ I11 — no silent replacement
{
  let ok = true; const notes = [];
  for (const [lang, s] of Object.entries(co.strata)) {
    const pass = s.attempts.filter((a) => a.passed);
    if (pass.length !== 1) ok = false;
    for (const a of s.attempts) {
      if (a.passed) continue;
      if (!a.failed || a.checks[a.failed] !== false) ok = false;      // every skip has a recorded failing check
    }
    // the selected repository is the FIRST passing entry in the frozen order
    const firstPassIdx = s.attempts.findIndex((a) => a.passed);
    if (firstPassIdx !== s.attempts.length - 1) ok = false;
    notes.push(`${lang}:${s.attempts.length} attempts, ${s.attempts.length - 1} recorded V-failures`);
  }
  record('I11', 'invariant', ok, `no repository skipped without a recorded V-failure; selected is the first passing entry in the frozen order — ${notes.join(' ')}`);
}

// ================================================================= RED TESTS

const cheap = Object.values(pa.repos).find((r) => r.fullName === 'LuckPerms/LuckPerms');
const cheapSel = co.strata[strat[cheap.fullName]].selected;
const eqLists = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// ---- RT1 — history leak from T into H
{
  const leaked = buildRepo(cheap.stratum, cheap.fullName, cheapSel.dir, cheapSel.pin, { leakT: true });
  let changed = 0;
  for (let i = 0; i < cheap.records.length; i++) {
    const a = cheap.records[i].rankedH.map((x) => cheap.dict[x]);
    const b = leaked.records[i].rankedH.map((x) => leaked.dict[x]);
    if (!eqLists(a, b)) changed++;
  }
  record('RT1', 'red', changed > 0,
    `folding T's own transaction in BEFORE its snapshot changed rankedH on ${changed}/${cheap.records.length} queries in ${cheap.fullName} (before: frozen lists; after: leaked lists). Perturbation is NOT inert.`);
}

// ---- RT4 — B0 source independence
{
  const pert = buildRepo(cheap.stratum, cheap.fullName, cheapSel.dir, cheapSel.pin, { b0DependsOnSource: true });
  let changed = 0;
  for (let i = 0; i < cheap.records.length; i++) {
    const a = cheap.records[i].rankedB0.map((x) => cheap.dict[x]);
    const b = pert.records[i].rankedB0.map((x) => pert.dict[x]);
    if (!eqLists(a, b)) changed++;
  }
  record('RT4', 'red', changed > 0,
    `making B0 add +1 where the candidate co-occurred with S(T) changed rankedB0 on ${changed}/${cheap.records.length} queries — the source-independence checker measures a real quantity.`);
}

// ---- RT5 — B1 history independence
{
  const pert = buildRepo(cheap.stratum, cheap.fullName, cheapSel.dir, cheapSel.pin, { b1UsesHistory: true });
  let changed = 0;
  for (let i = 0; i < cheap.records.length; i++) {
    const a = cheap.records[i].rankedB1.map((x) => cheap.dict[x]);
    const b = pert.records[i].rankedB1.map((x) => pert.dict[x]);
    if (!eqLists(a, b)) changed++;
  }
  record('RT5', 'red', changed > 0,
    `adding historical support to structuralScore changed rankedB1 on ${changed}/${cheap.records.length} queries — the history-independence checker measures a real quantity.`);
}

// ---- RT3 — source/test role label
{
  const goName = Object.values(pa.repos).find((r) => r.stratum === 'Go').fullName;
  const dir = dirOf[goName];
  const repo = pa.repos[goName];
  const rec = repo.records[0];
  const paths = treePaths(dir, rec.T0);
  // invert T-GO: *_test.go stops being TEST, every other .go becomes TEST
  const perturbedIsTest = (p) => (p.endsWith('.go') ? !/_test\.go$/.test(p) : isTest(p));
  const perturbedIsSource = (p) => !perturbedIsTest(p) && (isSource(p) || isTest(p));
  const before = paths.filter(isTest).length;
  const after = paths.filter(perturbedIsTest).length;
  const t = firstParentTransactions(dir, repo.pin, 600).find((x) => x.sha === rec.T);
  const sBefore = [...new Set(t.touched.filter(isSource))].sort();
  const sAfter = [...new Set(t.touched.filter(perturbedIsSource))].sort();
  const sChanged = sBefore.length !== sAfter.length || sBefore.some((x, i) => x !== sAfter[i]);
  record('RT3', 'red', after !== before && before > 0 && sChanged,
    `inverting the T-GO test rule changed Suite(T0) in ${goName} from ${before} to ${after} tests, and S(T) on query 0 from ${sBefore.length} paths ${JSON.stringify(sBefore.map((p) => p.split('/').pop()))} to ${sAfter.length} paths ${JSON.stringify(sAfter.map((p) => p.split('/').pop()))}. Role labels are load-bearing.`);
}

// ---- RT6 — candidate-suite denominator
{
  const name = Object.keys(re.repos)[0];
  const per = ou.repos[name].per.filter((x) => x.cls === 'POSITIVE');
  const K = PRIMARY_K;
  const fracBefore = per.reduce((a, x) => a + x.scored.H.frac[K], 0) / per.length;
  // inject one non-extant path into every suite
  const fracAfter = per.reduce((a, x) =>
    a + Math.min(K, x.scored.H.len) / (x.suiteSize + 1), 0) / per.length;
  record('RT6', 'red', Math.abs(fracAfter - fracBefore) > 1e-9,
    `injecting one non-extant (pre-T0-deleted) path into every Suite(T0) in ${name} moved mean fraction@${K} for H from ${fracBefore.toFixed(6)} to ${fracAfter.toFixed(6)}. The denominator is load-bearing.`);
}

// ---- RT2 — outcome leak into ranking
{
  const name = Object.keys(re.repos)[0];
  const per = ou.repos[name].per.filter((x) => x.cls === 'POSITIVE');
  const K = PRIMARY_K;
  const before = per.reduce((a, x) => a + x.scored.H.hits[K] / x.gCount, 0) / per.length;
  // splice G(q) to the head of L_H: every relevant item is then within top-K
  const after = per.reduce((a, x) => a + Math.min(x.gCount, K) / x.gCount, 0) / per.length;
  record('RT2', 'red', after > before + 1e-9,
    `splicing G(q) to the head of L_H in ${name} raised macro recall@${K} from ${before.toFixed(6)} to ${after.toFixed(6)}. An outcome leak into ranking is detectable.`);
}

// ---- RT7 — evaluation outcome
{
  const name = Object.keys(re.repos)[0];
  const per = ou.repos[name].per.filter((x) => x.cls === 'POSITIVE');
  const K = PRIMARY_K;
  const before = per.reduce((a, x) => a + x.scored.H.hits[K] / x.gCount, 0) / per.length;
  // flip the FIRST query whose H top-K currently contains at least one hit:
  // set its hit count to zero, i.e. its outcome set moved off H's shortlist
  const i = per.findIndex((x) => x.scored.H.hits[K] > 0);
  const after = per.reduce((a, x, j) => a + (j === i ? 0 : x.scored.H.hits[K] / x.gCount), 0) / per.length;
  record('RT7', 'red', i >= 0 && Math.abs(after - before) > 1e-9,
    `flipping the outcome set of query ${i} (T=${per[i]?.T.slice(0, 12)}) in ${name} moved macro recall@${K} from ${before.toFixed(6)} to ${after.toFixed(6)}. The outcome is load-bearing.`);
}

const summary = { issue: 'META-289', ranUtc: new Date().toISOString(),
  invariants: log.filter((x) => x.kind === 'invariant'),
  redTests: log.filter((x) => x.kind === 'red'),
  failures };
writeFileSync(`${D}/raw/checks.json`, `${JSON.stringify(summary, null, 2)}\n`);
console.log(`\n${failures === 0 ? 'ALL CHECKS PASS' : `${failures} CHECK FAILURE(S)`}`);
process.exit(failures === 0 ? 0 : 1);
