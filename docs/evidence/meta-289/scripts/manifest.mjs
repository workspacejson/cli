// manifest.mjs — MANIFEST.json: machine-readable summary + sha256 of every artifact.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const D = 'docs/evidence/meta-289';
const re = JSON.parse(readFileSync(`${D}/raw/results.json`, 'utf8'));
const ck = JSON.parse(readFileSync(`${D}/raw/checks.json`, 'utf8'));
const co = JSON.parse(readFileSync(`${D}/raw/cohort.json`, 'utf8'));
const ro = JSON.parse(readFileSync(`${D}/raw/ranked-order.json`, 'utf8'));

const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = `${dir}/${f}`;
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const first = (path) => execFileSync('git', ['log', '--format=%H', '--diff-filter=A', '--', path],
  { encoding: 'utf8' }).trim().split('\n').pop();

const files = {};
for (const p of walk(D).sort()) {
  if (p.endsWith('MANIFEST.json')) continue;
  files[p.slice(D.length + 1)] = { sha256: sha(p), bytes: statSync(p).size };
}

const G = re.gate;
const m = {
  issue: 'META-289',
  fiberyQuestion: 'OQ-15',
  question: 'For an authentic later transaction that changes one or more source files, does source-test co-update history available strictly before that transaction improve identification/ranking of the test files actually touched in that later transaction, beyond deterministic current-tree baselines and test popularity/base rates?',
  observedOutcome: 'test files touched in the later transaction',
  kind: 'observational substrate evidence',
  disposition: G.disposition,
  freeze: {
    preregistrationCommit: first(`${D}/PREREGISTRATION.md`),
    phaseACommit: first(`${D}/raw/pre-outcome.json`),
  },
  predecessors: {
    meta378Receipt: 'f3c7a0741acd14620a4fe8535c65d1908087fa30',
    meta378Disposition: 'NEITHER_PATTERN_REPLICATES (context only, not an input)',
    meta376: 'Canceled — verified, not reopened, not executed',
    inheritedMachineryOnly: ['universe materialization', 'seeded sha256 ordering',
      'offline eligibility re-verification', 'verification-only backfill'],
    inheritedOutcomes: 'none',
  },
  selection: {
    seed: ro.seed,
    orderingRule: ro.orderingRule,
    universeSnapshotUtc: ro.universeSnapshotUtc,
    cohortSize: 4,
    antiLeakExcluded: ro.antiLeakExcluded,
    cohort: Object.fromEntries(Object.entries(co.strata).map(([l, s]) => [l, {
      repository: s.selected.full_name, rankTaken: s.selected.rank, pin: s.selected.pin,
      firstParentCommits: s.selected.firstParentCommits,
      sourceFilesAtPin: s.selected.sourceFilesAtPin, testFilesAtPin: s.selected.testFilesAtPin,
      verificationFailuresBeforeIt: s.attempts.length - 1,
    }])),
  },
  design: {
    queryUnit: 'one eligible source-changing first-parent transaction',
    queriesPerRepository: 200,
    totalQueries: 200 * Object.keys(co.strata).length,
    ks: re.ks,
    primaryK: re.primaryK,
    primaryMetric: 'macro-averaged recall@10 over POSITIVE queries, per repository',
    materialityThreshold: G.threshold,
    nonInflationFactor: G.inflationFactor,
    historyWindow: 'expanding, no depth cap, no decay',
    aggregationPrimary: 'SUM over S(T)',
    aggregationSecondary: 'MAX over S(T) (reported, does not change any verdict)',
  },
  results: Object.fromEntries(Object.entries(re.repos).map(([k, R]) => [k, {
    stratum: R.stratum, queries: R.queries, positive: R.positive,
    newTestOnly: R.newTestOnly, zeroTestTouch: R.zeroTestTouch,
    zeroTestTouchRate: R.zeroTestTouchRate,
    recall10: { H: R.methods.H.recall[10], B0: R.methods.B0.recall[10], B1: R.methods.B1.recall[10] },
    macroRecall10: { H: R.methods.H.recall[10].macro, B0: R.methods.B0.recall[10].macro, B1: R.methods.B1.recall[10].macro },
    delta0: G.perRepo[k].delta0, delta1: G.perRepo[k].delta1, POS: G.perRepo[k].POS,
    coverageH: R.methods.H.coverage, abstentionH: R.methods.H.abstention,
    fraction10: { H: R.methods.H.fraction[10], B0: R.methods.B0.fraction[10], B1: R.methods.B1.fraction[10] },
    paired: R.paired,
  }])),
  gate: { sumPOS: G.sumPOS, totalPositiveQueries: G.totalPositiveQueries,
    reposWithLowHCoverage: G.reposWithLowHCoverage, ladder: G.ladder },
  validation: { invariants: ck.invariants.map((x) => ({ id: x.id, status: x.status })),
    redTests: ck.redTests.map((x) => ({ id: x.id, status: x.status })), failures: ck.failures },
  prohibitionsObserved: {
    agentExperiment: 'not run', testsForCommand: 'not implemented',
    workspaceJsonSemantics: 'unchanged', producerBehavior: 'unchanged',
    coChangeRankingAndCap: 'unchanged', schemaOrCliChange: 'none',
    regressionRecallConstruct: 'withdrawn and not used',
  },
  rerun: 'bash docs/evidence/meta-289/rerun.sh <workDir>',
  files,
};

writeFileSync(`${D}/MANIFEST.json`, `${JSON.stringify(m, null, 2)}\n`);
console.log(`MANIFEST.json written: ${Object.keys(files).length} files, disposition=${m.disposition}`);
