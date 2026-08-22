// phase-b.mjs — META-380 OUTCOME stage.
//
// This is the FIRST script permitted to read the TEST-role changed files of an
// evaluation transaction T. It reads the frozen pre-outcome record set produced
// by phase-a.mjs and adds exactly one new thing: G(q).
//
// It MUST NOT recompute, redesign, or re-rank anything. Every ranked list is
// taken verbatim from raw/pre-outcome.json. Classifiers, transaction unit and
// rename/delete treatment come from the same frozen modules Phase A used.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isTest } from './classify.mjs';
import { firstParentTransactions, isEligibleTxn, treePaths } from './gitmine.mjs';

const K_VALUES = [1, 3, 5, 10];                       // §19
const PRIMARY_K = 10;                                 // §19
const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');

// ------------------------------------------------------------------ §20 classes

export function classifyQuery(touched, suiteSet) {
  const touchedTests = [...new Set(touched.filter(isTest))];
  const G = touchedTests.filter((p) => suiteSet.has(p)).sort();
  const newTests = touchedTests.filter((p) => !suiteSet.has(p)).sort();
  let cls;
  if (G.length >= 1) cls = 'POSITIVE';
  else if (newTests.length >= 1) cls = 'NEW_TEST_ONLY';
  else cls = 'ZERO_TEST_TOUCH';
  return { cls, G, newTests, touchedTestCount: touchedTests.length };
}

// ------------------------------------------------------------------ §21 metrics

export function queryMetrics(list, G, suiteSize) {
  const goal = new Set(G);
  const out = { abstain: list.length === 0, recall: {}, precision: {}, fraction: {}, rr: 0 };
  for (const K of K_VALUES) {
    const top = list.slice(0, K);
    const hits = top.filter((p) => goal.has(p)).length;
    out.recall[K] = G.length ? hits / G.length : 0;
    // precision@K undefined when the method abstains (excluded from that mean only)
    out.precision[K] = list.length >= 1 ? hits / Math.min(K, list.length) : null;
    out.fraction[K] = suiteSize ? Math.min(K, list.length) / suiteSize : 0;
  }
  for (let i = 0; i < list.length; i++) {
    if (goal.has(list[i])) { out.rr = 1 / (i + 1); break; }
  }
  return out;
}

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function macro(perQuery, sel) {
  const vals = perQuery.map(sel).filter((v) => v !== null && v !== undefined);
  return mean(vals);
}

// ------------------------------------------------------------------ main

const METHODS = [
  ['H', 'rankedH'], ['H-MAX', 'rankedHMax'], ['B0', 'rankedB0'],
  ['B1', 'rankedB1'], ['B2', 'rankedB2'],
];

export function scoreRepo(repoRec, dir, opts = {}) {
  const { flipQueryOutcome = -1, spliceIntoH = false, injectPhantomSuitePath = false } = opts;
  const dict = repoRec.dict;
  const pin = repoRec.pin;

  // Outcome read: T's changed-file set, under the SAME §8/§11 extraction Phase A used.
  const all = firstParentTransactions(dir, pin);
  const bySha = new Map(all.map((t) => [t.sha, t]));

  const queries = [];
  for (const rec of repoRec.records) {
    const txn = bySha.get(rec.T);
    if (!txn) throw new Error(`${repoRec.fullName}: transaction ${rec.T} not found on first-parent chain`);
    if (!isEligibleTxn(txn)) throw new Error(`${repoRec.fullName}: ${rec.T} not eligible under §8`);

    // §18 denominator, recomputed from T0 and verified against the frozen record.
    const suite = treePaths(dir, rec.T0).filter(isTest);
    if (injectPhantomSuitePath) suite.push('__phantom__/deleted.test.ts');
    const suiteSha = sha256([...suite].sort().join('\n'));
    const suiteMatches = suite.length === rec.suiteSize && suiteSha === rec.suiteSha256;

    let { cls, G, newTests, touchedTestCount } = classifyQuery(txn.touched, new Set(suite));
    if (flipQueryOutcome === rec.tIndex) G = G.length ? [] : ['__flipped__'];

    const lists = {};
    for (const [name, key] of METHODS) lists[name] = rec[key].map((i) => dict[i]);
    if (spliceIntoH) lists.H = [...G, ...lists.H.filter((p) => !G.includes(p))];

    const m = {};
    for (const [name] of METHODS) m[name] = queryMetrics(lists[name], G, suite.length);

    queries.push({
      tIndex: rec.tIndex, T: rec.T, T0: rec.T0, cls,
      sourceCount: rec.sourcePaths.length,
      suiteSize: suite.length, suiteMatchesFrozen: suiteMatches,
      gSize: G.length, G, newTestCount: newTests.length, newTests,
      touchedTestCount, historyTxnCount: rec.historyTxnCount,
      metrics: m,
      listLen: Object.fromEntries(METHODS.map(([n]) => [n, lists[n].length])),
    });
  }
  return queries;
}

export function aggregate(fullName, queries, b2Validity) {
  const pos = queries.filter((q) => q.cls === 'POSITIVE');
  const counts = {
    total: queries.length,
    POSITIVE: pos.length,
    NEW_TEST_ONLY: queries.filter((q) => q.cls === 'NEW_TEST_ONLY').length,
    ZERO_TEST_TOUCH: queries.filter((q) => q.cls === 'ZERO_TEST_TOUCH').length,
  };
  const methods = {};
  for (const [name] of METHODS) {
    const rec = {}, prec = {}, frac = {};
    for (const K of K_VALUES) {
      rec[K] = macro(pos, (q) => q.metrics[name].recall[K]);
      prec[K] = macro(pos, (q) => q.metrics[name].precision[K]);
      frac[K] = macro(pos, (q) => q.metrics[name].fraction[K]);
    }
    const covered = pos.filter((q) => !q.metrics[name].abstain).length;
    methods[name] = {
      recall: rec, precision: prec, fraction: frac,
      mrr: macro(pos, (q) => q.metrics[name].rr),
      coverage: pos.length ? covered / pos.length : 0,
      abstention: pos.length ? 1 - covered / pos.length : 0,
      coveredQueries: covered,
      microRecall: (() => {
        let hits = 0, tot = 0;
        for (const q of pos) { hits += q.metrics[name].recall[PRIMARY_K] * q.gSize; tot += q.gSize; }
        return tot ? hits / tot : 0;
      })(),
    };
  }

  // §21 per-repository primary arithmetic
  const H = methods.H.recall[PRIMARY_K], B0 = methods.B0.recall[PRIMARY_K], B2 = methods.B2.recall[PRIMARY_K];
  const delta0 = H - B0, delta2 = H - B2;
  const fH = methods.H.fraction[PRIMARY_K], fB0 = methods.B0.fraction[PRIMARY_K], fB2 = methods.B2.fraction[PRIMARY_K];
  const noninflated = fH <= 1.25 * Math.max(fB0, fB2);

  // §22 B2 validity
  const bv = {
    BV1: b2Validity.meanGraphSourceFiles >= 100,
    BV2: b2Validity.meanGraphTestFiles >= 30,
    BV3: b2Validity.meanResolvedEdges >= 50,
    BV4: b2Validity.queriesWithTestToSourcePathFraction >= 0.10,
    BV5: b2Validity.queriesRankingDiffersFromB1Fraction >= 0.05,
    BV6: b2Validity.edgeAblationQueriesChangedFraction >= 0.05,
  };
  const b2Valid = Object.values(bv).every(Boolean);
  const b2Failures = Object.entries(bv).filter(([, v]) => !v).map(([k]) => k);

  // §21 minimum informative-repository rule
  const informative = counts.POSITIVE >= 20 && b2Valid && methods.H.coverage >= 0.50;
  const POS = informative && delta0 >= 0.05 && delta2 >= 0.05 && noninflated ? 1 : 0;
  const NEG = informative && delta2 <= -0.05 ? 1 : 0;
  const staticResidual = delta2 > -0.05 && delta2 < 0.05 ? 'NEUTRAL' : (delta2 >= 0.05 ? 'H_AHEAD' : 'B2_AHEAD');

  // paired H vs B2 on recall@10 over POSITIVE queries
  let wins = 0, losses = 0, ties = 0;
  for (const q of pos) {
    const a = q.metrics.H.recall[PRIMARY_K], b = q.metrics.B2.recall[PRIMARY_K];
    if (a > b) wins++; else if (a < b) losses++; else ties++;
  }

  return {
    repo: fullName, counts, methods,
    delta0, delta2, noninflated,
    fractionAt10: { H: fH, B0: fB0, B2: fB2 },
    b2Validity, bv, b2Valid, b2Failures,
    b2Disposition: b2Valid ? 'B2_VALID' : 'STATIC_BASELINE_NOT_DISTINCTIVE',
    informative,
    informativeReasons: {
      positiveGE20: counts.POSITIVE >= 20,
      b2ValidityPasses: b2Valid,
      coverageHGE050: methods.H.coverage >= 0.50,
    },
    POS, NEG, staticResidual,
    pairedHvsB2: { wins, losses, ties },
    newTestTotal: queries.reduce((n, q) => n + q.newTestCount, 0),
    gTotal: queries.reduce((n, q) => n + q.gSize, 0),
    suiteMismatches: queries.filter((q) => !q.suiteMatchesFrozen).length,
  };
}

export function disposition(repos) {
  const inf = repos.filter((r) => r.informative);
  const I = inf.length;
  const P = inf.filter((r) => r.POS === 1).length;
  const N = inf.filter((r) => r.NEG === 1).length;
  const allB2Valid = inf.every((r) => r.b2Valid);
  const noInflation = inf.every((r) => r.noninflated);

  let d, rule;
  if (I < 3) { d = 'INSUFFICIENT_REPLICATION_SUPPORT'; rule = 'D1'; }
  else if (P >= 3 && N === 0 && allB2Valid && noInflation) { d = 'RESIDUAL_SIGNAL_REPLICATES'; rule = 'D2'; }
  else if (P >= 1 && P <= 2) { d = 'RESIDUAL_SIGNAL_MIXED'; rule = 'D3'; }
  else if (P === 0 && N >= 3) { d = 'CURRENT_TREE_EXPLAINS_RESIDUAL'; rule = 'D4'; }
  else { d = 'INSUFFICIENT_REPLICATION_SUPPORT'; rule = 'D5'; }
  return { I, P, N, allB2Valid, noInflation, disposition: d, rule };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const pre = JSON.parse(readFileSync('docs/evidence/meta-380/raw/pre-outcome.json', 'utf8'));
  const cohort = JSON.parse(readFileSync('docs/evidence/meta-380/raw/cohort.json', 'utf8'));
  const dirOf = new Map();
  for (const s of Object.values(cohort.strata)) for (const sel of s.selected) dirOf.set(sel.full_name, sel.dir);

  const outcomes = { issue: 'META-380', stage: 'OUTCOME',
    preregistration: '5ccb7ff6dd7a59a276aa3d6aa372f3df3bf1505d',
    preOutcomeCommit: '04557b2e3f33636e53fbfc5d7bd857315960083f', repos: {} };
  const summaries = [];

  for (const [fullName, r] of Object.entries(pre.repos)) {
    const dir = dirOf.get(fullName);
    if (!dir) throw new Error(`no clone dir for ${fullName}`);
    process.stderr.write(`scoring ${fullName} ...\n`);
    const queries = scoreRepo(r, dir);
    const agg = aggregate(fullName, queries, r.b2Validity);
    outcomes.repos[fullName] = { pin: r.pin, queries };
    summaries.push(agg);
    process.stderr.write(`  POSITIVE=${agg.counts.POSITIVE} NEW_TEST_ONLY=${agg.counts.NEW_TEST_ONLY} ZERO=${agg.counts.ZERO_TEST_TOUCH}`
      + ` | H@10=${agg.methods.H.recall[10].toFixed(4)} B0@10=${agg.methods.B0.recall[10].toFixed(4)} B2@10=${agg.methods.B2.recall[10].toFixed(4)}`
      + ` | d0=${agg.delta0.toFixed(4)} d2=${agg.delta2.toFixed(4)} | B2=${agg.b2Disposition} inf=${agg.informative}\n`);
  }

  const disp = disposition(summaries);
  const results = { issue: 'META-380', stage: 'RESULTS',
    preregistration: '5ccb7ff6dd7a59a276aa3d6aa372f3df3bf1505d',
    preOutcomeCommit: '04557b2e3f33636e53fbfc5d7bd857315960083f',
    kValues: K_VALUES, primaryK: PRIMARY_K, materiality: 0.05,
    repos: summaries, ...disp };

  writeFileSync('docs/evidence/meta-380/raw/outcomes.json', `${JSON.stringify(outcomes)}\n`);
  writeFileSync('docs/evidence/meta-380/raw/results.json', `${JSON.stringify(results, null, 1)}\n`);
  process.stderr.write(`\nI=${disp.I} P=${disp.P} N=${disp.N} -> ${disp.rule} ${disp.disposition}\n`);
}
