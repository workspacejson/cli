// verify-input.mjs — META-377 Phase 1 input gate.
// Proves the local META-375 inputs are byte-identical to the ones the frozen
// META-375 RECEIPT.md attests, and that every declared input file is present.
// Any mismatch is a stop condition: this script exits non-zero and META-377
// must not proceed.
//
// Usage: node verify-input.mjs <meta375Dir> [--json]
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

const dir = process.argv[2] ?? 'docs/evidence/meta-375';
const asJson = process.argv.includes('--json');

const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

function walk(d, acc = []) {
  for (const e of readdirSync(d).sort()) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const files = walk(dir).map((p) => ({ path: relative(dir, p), abs: p, sha256: sha256(p) }));

// The nine frozen bases. Pin bases carry zero held-out transactions by
// definition (PREREGISTRATION §13) and contribute no recurrence observation.
const BASES = [
  'syncpack-pin', 'syncpack-b100', 'syncpack-b250',
  'formatjs-pin', 'formatjs-b100', 'formatjs-b250',
  'polylith-pin', 'polylith-b100', 'polylith-b250',
];
const HELD_OUT_BASES = BASES.filter((b) => !b.endsWith('-pin'));

const failures = [];
const checks = [];
const record = (id, ok, detail) => { checks.push({ id, ok, detail }); if (!ok) failures.push(`${id}: ${detail}`); };

// I1 — every declared primary input is present.
for (const b of BASES) {
  for (const kind of ['characterization', 'dump', 'receipt', 'workspace']) {
    const want = `runs/${b}.${kind}.json`;
    record(`I1:${want}`, files.some((f) => f.path === want), want);
  }
}
for (const want of ['runs/aggregate.json', 'PREREGISTRATION.md', 'REPORT.md', 'RECEIPT.md']) {
  record(`I1:${want}`, files.some((f) => f.path === want), want);
}

// I2 — the SHA-256 prefixes META-375's RECEIPT.md attests must match the
// bytes on disk. RECEIPT.md records the first 16 hex of each runs/ artifact.
const receiptText = readFileSync(join(dir, 'RECEIPT.md'), 'utf8');
const attested = new Map(); // "<label>.<kind>" -> 16-hex prefix
for (const line of receiptText.split('\n')) {
  const m = line.match(/^\|\s*([a-z]+-(?:pin|b100|b250))\s*\|\s*([0-9a-f]{16})\s*\|\s*([0-9a-f]{16})\s*\|\s*([0-9a-f]{16})\s*\|\s*([0-9a-f]{16})\s*\|/);
  if (m) {
    attested.set(`${m[1]}.dump`, m[2]);
    attested.set(`${m[1]}.characterization`, m[3]);
    attested.set(`${m[1]}.receipt`, m[4]);
    attested.set(`${m[1]}.workspace`, m[5]);
  }
  const a = line.match(/^\|\s*aggregate\.json\s*\|\s*([0-9a-f]{16})\s*\|/);
  if (a) attested.set('aggregate', a[1]);
}
record('I2:receipt-table-parsed', attested.size === BASES.length * 4 + 1,
  `parsed ${attested.size} attested digests (expected ${BASES.length * 4 + 1})`);

for (const [key, prefix] of attested) {
  const path = key === 'aggregate' ? 'runs/aggregate.json' : `runs/${key}.json`;
  const f = files.find((x) => x.path === path);
  const actual = f?.sha256.slice(0, 16);
  record(`I2:${path}`, actual === prefix, `receipt=${prefix} actual=${actual ?? 'MISSING'}`);
}

// I3 — relationship counts on disk must equal the qualifying counts the
// frozen aggregate records. This is the META-377 input count.
const agg = JSON.parse(readFileSync(join(dir, 'runs/aggregate.json'), 'utf8'));
let totalRelationships = 0;
for (const b of BASES) {
  const ch = JSON.parse(readFileSync(join(dir, `runs/${b}.characterization.json`), 'utf8'));
  const dp = JSON.parse(readFileSync(join(dir, `runs/${b}.dump.json`), 'utf8'));
  const q = agg.perBasis[b].qualifying;
  totalRelationships += ch.relationships.length;
  record(`I3:${b}:characterization==aggregate`, ch.relationships.length === q,
    `${ch.relationships.length} vs ${q}`);
  record(`I3:${b}:dump==aggregate`, dp.pairs.length === q, `${dp.pairs.length} vs ${q}`);
}

// I4 — pin bases carry zero held-out transactions by definition.
for (const b of BASES.filter((x) => x.endsWith('-pin'))) {
  const ch = JSON.parse(readFileSync(join(dir, `runs/${b}.characterization.json`), 'utf8'));
  record(`I4:${b}:zero-held-out-transactions`,
    (ch.heldOutWindow?.transactionsTotal ?? 0) === 0,
    `transactionsTotal=${ch.heldOutWindow?.transactionsTotal ?? 0}`);
}

// I5 — exactly six bases carry a non-empty frozen held-out window.
const withHeldOut = BASES.filter((b) => {
  const ch = JSON.parse(readFileSync(join(dir, `runs/${b}.characterization.json`), 'utf8'));
  return (ch.heldOutWindow?.transactionsTotal ?? 0) > 0;
});
record('I5:six-held-out-bases',
  withHeldOut.length === 6 && HELD_OUT_BASES.every((b) => withHeldOut.includes(b)),
  withHeldOut.join(','));

const out = {
  meta375Dir: dir,
  fileCount: files.length,
  totalRelationships,
  heldOutBases: withHeldOut,
  checks: checks.length,
  passed: checks.length - failures.length,
  failures,
  files,
};

if (asJson) console.log(JSON.stringify(out, null, 2));
else {
  console.log(`files=${out.fileCount} relationships=${out.totalRelationships}`);
  console.log(`checks ${out.passed}/${out.checks} PASS`);
  for (const f of failures) console.log(`FAIL ${f}`);
}
process.exit(failures.length === 0 ? 0 : 1);
