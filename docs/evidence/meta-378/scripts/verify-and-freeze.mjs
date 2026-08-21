// verify-and-freeze.mjs — META-378 §7 mechanical verification + §10 basis resolution.
//
// Walks the FROZEN ranked order per stratum, applies V1-V3, and takes the first
// repository that passes. Backfill is therefore not steerable: the order was
// fixed by select-cohort.mjs before any clone existed.
//
// Reads commit TOPOLOGY ONLY (clone, rev-parse, rev-list). No miner runs here
// and no co-change or recurrence output is consulted.
//
// Usage: node verify-and-freeze.mjs <workDir>
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const WORK = process.argv[2];
if (!WORK) { console.error('usage: node verify-and-freeze.mjs <workDir>'); process.exit(2); }

const MIN_FIRST_PARENT = 751;   // §7 V3: 250 (basis) + 500 (window) + 1
const ranked = JSON.parse(readFileSync('docs/evidence/meta-378/raw/ranked-order.json', 'utf8'));

const run = (cwd, ...args) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 1 << 28 });

function verify(fullName, defaultBranch) {
  const slug = fullName.replace('/', '__');
  const dir = join(WORK, slug);
  const attempt = { full_name: fullName, dir, V1: false, V2: false, V3: false };
  try {
    if (!existsSync(dir)) {
      execFileSync('git', ['clone', '--no-checkout', '--filter=blob:none',
        `https://github.com/${fullName}.git`, dir],
        { stdio: 'pipe', encoding: 'utf8', maxBuffer: 1 << 28 });
    }
    attempt.V1 = true;
  } catch (e) { attempt.error = `V1 clone failed: ${String(e.message).slice(0, 200)}`; return attempt; }

  try {
    attempt.pin = run(dir, 'rev-parse', `origin/${defaultBranch}`).trim();
    attempt.V2 = /^[0-9a-f]{40}$/.test(attempt.pin);
  } catch (e) { attempt.error = `V2 default branch unresolved: ${String(e.message).slice(0, 200)}`; return attempt; }
  if (!attempt.V2) return attempt;

  try {
    attempt.firstParentCount = Number(run(dir, 'rev-list', '--count', '--first-parent', attempt.pin).trim());
    attempt.V3 = attempt.firstParentCount >= MIN_FIRST_PARENT;
  } catch (e) { attempt.error = `V3 rev-list failed: ${String(e.message).slice(0, 200)}`; return attempt; }
  if (!attempt.V3) { attempt.error = `V3 firstParentCount=${attempt.firstParentCount} < ${MIN_FIRST_PARENT}`; return attempt; }

  // §10 basis resolution, carried verbatim from META-375.
  const list = run(dir, 'rev-list', '--first-parent', attempt.pin).trim().split('\n');
  attempt.bases = { pin: attempt.pin, b100: list[100], b250: list[250] };
  attempt.basisDates = Object.fromEntries(Object.entries(attempt.bases).map(([k, sha]) =>
    [k, run(dir, 'log', '-1', '--format=%cI', sha).trim()]));
  return attempt;
}

const cohort = {
  issue: 'META-378',
  seed: ranked.seed,
  universeSnapshotUtc: ranked.universeSnapshotUtc,
  minFirstParentCount: MIN_FIRST_PARENT,
  strata: {},
};

for (const [lang, s] of Object.entries(ranked.strata)) {
  const attempts = [];
  let selected = null;
  for (const cand of s.rankedOrder) {
    const a = verify(cand.full_name, cand.default_branch);
    a.rank = s.rankedOrder.indexOf(cand) + 1;
    a.orderKey = cand.orderKey;
    a.default_branch = cand.default_branch;
    if (a.V1 && a.V2 && a.V3) {
      a.status = 'SELECTED';
      attempts.push(a); selected = a;
      console.log(`${lang}: SELECTED rank ${a.rank} ${a.full_name} firstParent=${a.firstParentCount} pin=${a.pin.slice(0, 12)}`);
      break;
    }
    a.status = 'INELIGIBLE_ON_VERIFICATION';
    attempts.push(a);
    console.log(`${lang}: skip rank ${a.rank} ${a.full_name} — ${a.error}`);
  }
  if (!selected) throw new Error(`${lang}: frozen order exhausted without a verified repository`);
  cohort.strata[lang] = { attempts, selected };
}

writeFileSync('docs/evidence/meta-378/raw/cohort.json', `${JSON.stringify(cohort, null, 2)}\n`);
console.log('\ncohort.json written');
for (const [lang, s] of Object.entries(cohort.strata)) {
  console.log(`${lang}: ${s.selected.full_name}  pin=${s.selected.bases.pin.slice(0,12)} b100=${s.selected.bases.b100.slice(0,12)} b250=${s.selected.bases.b250.slice(0,12)}`);
}
