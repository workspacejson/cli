// phase-b.mjs — META-289 OUTCOME stage.
//
// The FIRST script permitted to read the TEST-role touches of an evaluation
// transaction. It never re-ranks: it consumes the ranked lists frozen by
// phase-a and scores them. Every ranking decision was made and committed
// before this file ran (see TEMPORAL-ISOLATION.md §4).
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isTest } from './classify.mjs';
import { firstParentTransactions, isEligibleTxn, treePaths } from './gitmine.mjs';

const D = 'docs/evidence/meta-289';
const KS = [1, 3, 5, 10];                       // §18
const PRIMARY_K = 10;                           // §18
const METHODS = ['H', 'HMAX', 'B0', 'B1'];
const FIELD = { H: 'rankedH', HMAX: 'rankedHMax', B0: 'rankedB0', B1: 'rankedB1' };
const SCAN_BOUND = 600;

const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

const pa = JSON.parse(readFileSync(`${D}/raw/pre-outcome.json`, 'utf8'));
const co = JSON.parse(readFileSync(`${D}/raw/cohort.json`, 'utf8'));

const dirOf = {};
for (const s of Object.values(co.strata)) dirOf[s.selected.full_name] = s.selected.dir;

const outcomes = { issue: 'META-289', stage: 'OUTCOME', repos: {} };
const results = { issue: 'META-289', ks: KS, primaryK: PRIMARY_K, repos: {} };

for (const repo of Object.values(pa.repos)) {
  const dir = dirOf[repo.fullName];
  const dict = repo.dict;

  // changed-file sets for the evaluation transactions, indexed by SHA
  const scan = firstParentTransactions(dir, repo.pin, SCAN_BOUND);
  const bySha = new Map(scan.map((t) => [t.sha, t]));

  const per = [];
  for (const rec of repo.records) {
    // --- I9: re-derive the T0 suite independently and verify the frozen hash
    const suite = treePaths(dir, rec.T0).filter(isTest);
    const suiteHash = sha256([...suite].sort().join('\n'));
    if (suiteHash !== rec.suiteSha256) {
      throw new Error(`${repo.fullName} ${rec.T}: suite hash drift ${suiteHash} != ${rec.suiteSha256}`);
    }
    const suiteSet = new Set(suite);

    // --- the outcome, read here for the first time
    const t = bySha.get(rec.T);
    if (!t) throw new Error(`${repo.fullName}: ${rec.T} absent from scan`);
    if (!isEligibleTxn(t)) throw new Error(`${repo.fullName}: ${rec.T} not an eligible txn`);
    const testTouches = [...new Set(t.touched.filter(isTest))];
    const G = testTouches.filter((p) => suiteSet.has(p));
    const NEW = testTouches.filter((p) => !suiteSet.has(p));

    const cls = G.length >= 1 ? 'POSITIVE'
      : testTouches.length >= 1 ? 'NEW_TEST_ONLY'
      : 'ZERO_TEST_TOUCH';

    const gSet = new Set(G);
    const scored = {};
    for (const m of METHODS) {
      const L = rec[FIELD[m]].map((i) => dict[i]);
      const hits = {}; const prec = {}; const frac = {};
      for (const K of KS) {
        const top = L.slice(0, K);
        const h = top.filter((p) => gSet.has(p)).length;
        hits[K] = h;
        prec[K] = L.length === 0 ? null : h / Math.min(K, L.length);
        frac[K] = rec.suiteSize === 0 ? 0 : Math.min(K, L.length) / rec.suiteSize;
      }
      let rr = 0;
      for (let i = 0; i < L.length; i++) if (gSet.has(L[i])) { rr = 1 / (i + 1); break; }
      scored[m] = { len: L.length, hits, prec, frac, rr };
    }

    per.push({ T: rec.T, T0: rec.T0, cls, nSource: rec.sourcePaths.length,
      suiteSize: rec.suiteSize, gCount: G.length, newCount: NEW.length,
      testTouchCount: testTouches.length, historyTxnCount: rec.historyTxnCount, scored });
  }

  outcomes.repos[repo.fullName] = { stratum: repo.stratum, pin: repo.pin, per };

  // ------------------------------------------------------------- aggregation
  const POS = per.filter((x) => x.cls === 'POSITIVE');
  const R = { stratum: repo.stratum, pin: repo.pin,
    queries: per.length,
    positive: POS.length,
    newTestOnly: per.filter((x) => x.cls === 'NEW_TEST_ONLY').length,
    zeroTestTouch: per.filter((x) => x.cls === 'ZERO_TEST_TOUCH').length,
    totalG: POS.reduce((a, x) => a + x.gCount, 0),
    totalNewTestFiles: per.reduce((a, x) => a + x.newCount, 0),
    suiteMean: mean(per.map((x) => x.suiteSize)),
    methods: {} };
  R.zeroTestTouchRate = { num: R.zeroTestTouch, den: per.length, rate: R.zeroTestTouch / per.length };

  for (const m of METHODS) {
    const covN = POS.filter((x) => x.scored[m].len > 0).length;
    const M = { coverageNum: covN, coverageDen: POS.length,
      coverage: POS.length ? covN / POS.length : 0,
      abstention: POS.length ? 1 - covN / POS.length : 0,
      meanListLen: mean(POS.map((x) => x.scored[m].len)),
      mrr: mean(POS.map((x) => x.scored[m].rr)),
      recall: {}, precision: {}, fraction: {}, microRecall: {} };
    for (const K of KS) {
      M.recall[K] = { macro: mean(POS.map((x) => x.scored[m].hits[K] / x.gCount)),
        num: POS.reduce((a, x) => a + x.scored[m].hits[K], 0),
        den: POS.reduce((a, x) => a + x.gCount, 0) };
      M.microRecall[K] = M.recall[K].den ? M.recall[K].num / M.recall[K].den : 0;
      const defined = POS.filter((x) => x.scored[m].prec[K] !== null);
      M.precision[K] = { macro: mean(defined.map((x) => x.scored[m].prec[K])),
        definedNum: defined.length, definedDen: POS.length };
      M.fraction[K] = mean(POS.map((x) => x.scored[m].frac[K]));
    }
    R.methods[m] = M;
  }

  // per-query win/loss/tie on recall@PRIMARY_K, H vs each baseline (§24)
  R.paired = {};
  for (const b of ['B0', 'B1']) {
    let w = 0, l = 0, tie = 0;
    for (const x of POS) {
      const rh = x.scored.H.hits[PRIMARY_K] / x.gCount;
      const rb = x.scored[b].hits[PRIMARY_K] / x.gCount;
      if (rh > rb) w++; else if (rh < rb) l++; else tie++;
    }
    R.paired[b] = { win: w, loss: l, tie, den: POS.length };
  }

  results.repos[repo.fullName] = R;
  console.log(`${repo.stratum} ${repo.fullName}: POSITIVE=${R.positive} NEW_ONLY=${R.newTestOnly} ZERO=${R.zeroTestTouch} | recall@10 H=${R.methods.H.recall[10].macro.toFixed(4)} B0=${R.methods.B0.recall[10].macro.toFixed(4)} B1=${R.methods.B1.recall[10].macro.toFixed(4)}`);
}

// ------------------------------------------------------------- §24 disposition
const THRESH = 0.05, INFLATE = 1.25;
const gate = { threshold: THRESH, inflationFactor: INFLATE, primaryK: PRIMARY_K, perRepo: {} };
let sumPOS = 0, covLow = 0, totalPositive = 0, anyBigB1Loss = false;

for (const [name, R] of Object.entries(results.repos)) {
  const r10 = (m) => R.methods[m].recall[PRIMARY_K].macro;
  const f10 = (m) => R.methods[m].fraction[PRIMARY_K];
  const d0 = r10('H') - r10('B0');
  const d1 = r10('H') - r10('B1');
  const nonInflated = f10('H') <= INFLATE * Math.max(f10('B0'), f10('B1'));
  const pos = d0 >= THRESH && d1 >= THRESH && nonInflated;
  gate.perRepo[name] = { stratum: R.stratum, recallH: r10('H'), recallB0: r10('B0'), recallB1: r10('B1'),
    delta0: d0, delta1: d1, fracH: f10('H'), fracB0: f10('B0'), fracB1: f10('B1'),
    nonInflated, POS: pos ? 1 : 0, coverageH: R.methods.H.coverage };
  sumPOS += pos ? 1 : 0;
  if (R.methods.H.coverage < 0.50) covLow++;
  if (d1 <= -THRESH) anyBigB1Loss = true;
  totalPositive += R.positive;
}
gate.sumPOS = sumPOS;
gate.reposWithLowHCoverage = covLow;
gate.totalPositiveQueries = totalPositive;
gate.anyRepoWithDelta1AtOrBelowMinusThreshold = anyBigB1Loss;
gate.reposFailingDelta0 = Object.values(gate.perRepo).filter((x) => x.delta0 < THRESH).length;
gate.reposFailingDelta1 = Object.values(gate.perRepo).filter((x) => x.delta1 < THRESH).length;

// strict ladder, first match wins (§24)
const ladder = [];
const D1 = covLow >= 2 || totalPositive < 100;
ladder.push({ rung: 'D1', disposition: 'INSUFFICIENT_SOURCE_TEST_SIGNAL', fired: D1,
  detail: `reposWithHCoverage<0.50 = ${covLow} (>=2?) OR totalPositive = ${totalPositive} (<100?)` });
const D2 = !D1 && sumPOS >= 3 && !anyBigB1Loss;
ladder.push({ rung: 'D2', disposition: 'HISTORY_ADDS_INCREMENTAL_COUPDATE_SIGNAL', fired: D2,
  detail: `sumPOS = ${sumPOS} (>=3?) AND no repo with delta1 <= -${THRESH} (${anyBigB1Loss ? 'one exists' : 'none'})` });
const D3 = !D1 && !D2 && sumPOS >= 1 && sumPOS <= 2;
ladder.push({ rung: 'D3', disposition: 'MIXED_BY_REPOSITORY_OR_TESTING_CULTURE', fired: D3,
  detail: `1 <= sumPOS(${sumPOS}) <= 2` });
const D4 = !D1 && !D2 && !D3 && sumPOS === 0 && gate.reposFailingDelta0 >= 3;
ladder.push({ rung: 'D4', disposition: 'HISTORY_REPLICATES_BASE_RATE_ONLY', fired: D4,
  detail: `sumPOS = 0 AND repos with delta0 < ${THRESH} = ${gate.reposFailingDelta0} (>=3?)` });
const D5 = !D1 && !D2 && !D3 && !D4;
ladder.push({ rung: 'D5', disposition: 'CURRENT_TREE_MATCHES_OR_BEATS_HISTORY', fired: D5, detail: 'terminal otherwise' });

gate.ladder = ladder;
gate.disposition = ladder.find((x) => x.fired).disposition;
results.gate = gate;

writeFileSync(`${D}/raw/outcomes.json`, `${JSON.stringify(outcomes)}\n`);
writeFileSync(`${D}/raw/results.json`, `${JSON.stringify(results, null, 2)}\n`);

console.log('\n--- §24 gate ---');
for (const [k, v] of Object.entries(gate.perRepo)) {
  console.log(`${v.stratum.padEnd(11)} ${k.padEnd(24)} H=${v.recallH.toFixed(4)} B0=${v.recallB0.toFixed(4)} B1=${v.recallB1.toFixed(4)} d0=${v.delta0.toFixed(4)} d1=${v.delta1.toFixed(4)} nonInflated=${v.nonInflated} POS=${v.POS} covH=${v.coverageH.toFixed(3)}`);
}
for (const l of ladder) console.log(`${l.rung} ${l.fired ? 'FIRED ' : '      '} ${l.disposition}  [${l.detail}]`);
console.log(`\nDISPOSITION: ${gate.disposition}`);
