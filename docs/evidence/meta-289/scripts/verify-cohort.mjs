// verify-cohort.mjs — META-289 §5.5 mechanical verification and §5.6 backfill.
//
// Walks the FROZEN §5.4 ranked order per stratum, applying V1..V6 in order, and
// takes the first repository that passes. Every attempt — pass or fail — is
// recorded with its failing check. No repository may be skipped for any reason
// other than a recorded V-failure, and none may be replaced after any outcome
// exists (§5.6).
//
// Reads repository content and changed-file PATHS. Reads NO outcome: V6 asks
// only whether a transaction changed a SOURCE file, which is the §12 query
// definition. Test-role touches of evaluation transactions are never read here.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { isSource, isTest } from './classify.mjs';
import { firstParentTransactions, isEligibleTxn, treePaths, firstParentCount, git } from './gitmine.mjs';

const WORK = process.env.META289_WORK;
if (!WORK) throw new Error('META289_WORK must be set to the clone working directory');
mkdirSync(WORK, { recursive: true });

const SCAN_BOUND = 600;        // §10
const EVAL_N = 200;            // §10
const MIN_FP = 1500;           // V3
const MIN_SOURCE = 100;        // V4
const MIN_TEST = 30;           // V5

const ranked = JSON.parse(readFileSync('docs/evidence/meta-289/raw/ranked-order.json', 'utf8'));

function verify(fullName, defaultBranch) {
  const dir = `${WORK}/${fullName.replace('/', '__')}`;
  const rec = { full_name: fullName, checks: {} };
  // V1 — full, non-shallow clone
  try {
    if (!existsSync(`${dir}/.git`)) {
      execFileSync('git', ['clone', '--quiet', '--no-single-branch',
        `https://github.com/${fullName}.git`, dir], { stdio: 'pipe', timeout: 900_000 });
    }
    if (git(dir, ['rev-parse', '--is-shallow-repository']).trim() !== 'false') throw new Error('shallow');
    rec.checks.V1 = true;
  } catch (e) {
    rec.checks.V1 = false; rec.failed = 'V1'; rec.reason = String(e.message).slice(0, 200); return rec;
  }
  // V2 — default branch HEAD resolves; this SHA is the pin
  try {
    rec.pin = git(dir, ['rev-parse', `origin/${defaultBranch}`]).trim();
    rec.pinDate = git(dir, ['show', '-s', '--format=%cI', rec.pin]).trim();
    rec.checks.V2 = /^[0-9a-f]{40}$/.test(rec.pin);
  } catch (e) {
    rec.checks.V2 = false; rec.failed = 'V2'; rec.reason = String(e.message).slice(0, 200); return rec;
  }
  if (!rec.checks.V2) { rec.failed = 'V2'; return rec; }
  // V3 — first-parent depth
  rec.firstParentCommits = firstParentCount(dir, rec.pin);
  rec.checks.V3 = rec.firstParentCommits >= MIN_FP;
  if (!rec.checks.V3) { rec.failed = 'V3'; return rec; }
  // V4/V5 — extant source and test populations in the pin tree
  const paths = treePaths(dir, rec.pin);
  rec.sourceFilesAtPin = paths.filter(isSource).length;
  rec.testFilesAtPin = paths.filter(isTest).length;
  rec.checks.V4 = rec.sourceFilesAtPin >= MIN_SOURCE;
  if (!rec.checks.V4) { rec.failed = 'V4'; return rec; }
  rec.checks.V5 = rec.testFilesAtPin >= MIN_TEST;
  if (!rec.checks.V5) { rec.failed = 'V5'; return rec; }
  // V6 — the §10 backward scan yields exactly EVAL_N source-changing transactions
  const scan = firstParentTransactions(dir, rec.pin, SCAN_BOUND);
  let found = 0;
  for (const t of scan) {
    if (!isEligibleTxn(t)) continue;
    if (t.touched.some(isSource)) found++;
    if (found >= EVAL_N) break;
  }
  rec.scanned = scan.length;
  rec.sourceChangingInScan = found;
  rec.checks.V6 = found >= EVAL_N;
  if (!rec.checks.V6) { rec.failed = 'V6'; return rec; }
  rec.dir = dir;
  rec.passed = true;
  return rec;
}

const out = { issue: 'META-289', scanBound: SCAN_BOUND, evalN: EVAL_N,
  thresholds: { MIN_FP, MIN_SOURCE, MIN_TEST }, strata: {} };

for (const [lang, s] of Object.entries(ranked.strata)) {
  const attempts = [];
  let selected = null;
  for (const cand of s.rankedOrder) {
    const rec = verify(cand.full_name, cand.default_branch);
    rec.rank = s.rankedOrder.indexOf(cand) + 1;
    rec.orderKey = cand.orderKey;
    attempts.push(rec);
    console.log(`${lang} rank${rec.rank} ${cand.full_name}: ${rec.passed ? 'PASS' : `INELIGIBLE_ON_VERIFICATION(${rec.failed})`}`);
    if (rec.passed) { selected = rec; break; }
    if (attempts.length >= 25) break;                     // safety bound; recorded
  }
  if (!selected) throw new Error(`${lang}: no repository passed V1-V6 within 25 frozen-order attempts`);
  out.strata[lang] = { attempts, selected: { full_name: selected.full_name, rank: selected.rank,
    pin: selected.pin, pinDate: selected.pinDate, firstParentCommits: selected.firstParentCommits,
    sourceFilesAtPin: selected.sourceFilesAtPin, testFilesAtPin: selected.testFilesAtPin,
    scanned: selected.scanned, sourceChangingInScan: selected.sourceChangingInScan, dir: selected.dir } };
}

writeFileSync('docs/evidence/meta-289/raw/cohort.json', `${JSON.stringify(out, null, 2)}\n`);
console.log('\ncohort.json written');
for (const [lang, s] of Object.entries(out.strata)) {
  console.log(`  ${lang}: ${s.selected.full_name} @ ${s.selected.pin.slice(0, 12)} fp=${s.selected.firstParentCommits} src=${s.selected.sourceFilesAtPin} test=${s.selected.testFilesAtPin}`);
}
