// compat-check.mjs -- proves the META-378 harness measures the same thing
// META-375/377 measured.
//
// META-375 mined each basis in a detached worktree; META-378 mines the same
// history via `mine(repoRoot, { basisRevision })` against a partial clone. The
// two are only interchangeable if they produce identical output, so this script
// re-derives a META-375 basis with the META-378 harness and compares against
// the committed META-375 evidence.
//
// This READS discovery data, which the anti-leak rule permits solely to
// "verify compatibility". It contributes no numerator, denominator, sign, or
// disposition to META-378, and the basis it touches is never added to the
// confirmation cohort.
//
// Usage: node compat-check.mjs <syncpackCloneDir>
import { readFileSync } from 'node:fs';
import { characterizeBasis } from './phase-a.mjs';

const DIR = process.argv[2];
if (!DIR) { console.error('usage: node compat-check.mjs <syncpackCloneDir>'); process.exit(2); }

// META-375 bases.json, syncpack -100.
const BASIS = '233a0b37265ff278bc96ece91f8c2bbfcaeeb280';
const M375 = 'docs/evidence/meta-375/runs/syncpack-b100.characterization.json';

const ref = JSON.parse(readFileSync(M375, 'utf8'));
const got = await characterizeBasis(DIR, 'compat-syncpack-b100', BASIS, false);

const checks = [];
const rec = (id, ok, detail) => checks.push({ id, ok, detail });

rec('K1:qualifying-count', got.qualifying === ref.relationships.length,
  `${got.qualifying} vs ${ref.relationships.length}`);
rec('K2:emitted-count', got.emitted === ref.relationships.filter((r) => r.emitted).length,
  `${got.emitted} vs ${ref.relationships.filter((r) => r.emitted).length}`);

// Ranking identity across the whole qualifying population.
const same = (a, b) => a[0] === b[0] && a[1] === b[1];
let rankMismatch = 0;
for (let i = 0; i < Math.min(got.relationships.length, ref.relationships.length); i++) {
  if (!same(got.relationships[i].files, ref.relationships[i].files)) rankMismatch++;
}
rec('K3:ranking-identical', rankMismatch === 0, `${rankMismatch} positions differ`);

// Support / occurrences identity.
let statMismatch = 0;
for (let i = 0; i < Math.min(got.relationships.length, ref.relationships.length); i++) {
  const g = got.relationships[i];
  const r = ref.relationships[i];
  if (g.support !== r.support || g.occurrences !== r.occurrences) statMismatch++;
}
rec('K4:support-occurrences-identical', statMismatch === 0, `${statMismatch} pairs differ`);

// Endpoint existence identity -- the D4 input R1 depends on.
let existMismatch = 0;
for (let i = 0; i < Math.min(got.relationships.length, ref.relationships.length); i++) {
  const g = got.relationships[i];
  const r = ref.relationships[i];
  if (g.existsA !== r.existsA || g.existsB !== r.existsB) existMismatch++;
}
rec('K5:endpoint-existence-identical', existMismatch === 0, `${existMismatch} pairs differ`);

// Age identity -- the D5 input R2 depends on. META-375 stored the delta
// position under mostRecentSupport.
let ageMismatch = 0;
for (let i = 0; i < Math.min(got.relationships.length, ref.relationships.length); i++) {
  const g = got.relationships[i].ageDeltaPos;
  const r = ref.relationships[i].mostRecentSupport?.deltaPos ?? null;
  if (g !== r) ageMismatch++;
}
rec('K6:age-delta-identical', ageMismatch === 0, `${ageMismatch} pairs differ`);

const failed = checks.filter((c) => !c.ok);
for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'} ${c.id}  ${c.detail}`);
console.log(`\n${checks.length - failed.length}/${checks.length} compatibility checks PASS`);
console.log(JSON.stringify({
  basis: BASIS,
  qualifying: got.qualifying,
  checks,
  passed: checks.length - failed.length,
  total: checks.length,
}, null, 2));
process.exit(failed.length === 0 ? 0 : 1);
