// denominators.mjs -- META-378 Phase A denominator/cell audit.
//
// Builds every R1 and R2 cell for all 15 bases WITHOUT reading the held-out
// recurrence outcome. It reads raw/phase-a.json, which by construction carries
// no outcome keys, and re-asserts their absence before doing anything.
//
// Usage: node denominators.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { assertNoOutcome } from './phase-a.mjs';

const MIN_N = 10;                                                // section 15
const AGE_BUCKETS = ['0-24', '25-99', '100-249', '250-499'];     // section 13
const EXISTENCE = ['BOTH_CURRENT', 'ONE_ABSENT', 'BOTH_ABSENT']; // section 12
const CLASSES = ['EMPTY', 'EMITTED_ONLY', 'OMITTED_ONLY', 'SPARSE', 'COMPARABLE'];

const a = JSON.parse(readFileSync('docs/evidence/meta-378/raw/phase-a.json', 'utf8'));
assertNoOutcome(a, 'denominator audit input');

export function classifyCell(emittedN, omittedN) {
  if (emittedN === 0 && omittedN === 0) return 'EMPTY';
  if (omittedN === 0) return 'EMITTED_ONLY';
  if (emittedN === 0) return 'OMITTED_ONLY';
  return emittedN >= MIN_N && omittedN >= MIN_N ? 'COMPARABLE' : 'SPARSE';
}

export function cellsFor(relationships, keyOf, universe) {
  const m = new Map(universe.map((k) => [k, { stratum: k, emittedN: 0, omittedN: 0 }]));
  for (const r of relationships) {
    const k = keyOf(r);
    if (!m.has(k)) m.set(k, { stratum: k, emittedN: 0, omittedN: 0 });
    const c = m.get(k);
    if (r.emitted) c.emittedN++; else c.omittedN++;
  }
  for (const c of m.values()) c.class = classifyCell(c.emittedN, c.omittedN);
  return [...m.values()];
}

const audit = { issue: 'META-378', phase: 'A', minN: MIN_N, outcomeIsolated: true, bases: {} };

for (const [label, b] of Object.entries(a.bases)) {
  const d4 = cellsFor(b.relationships, (r) => r.existence, EXISTENCE);
  const d5 = cellsFor(b.relationships, (r) => r.age, AGE_BUCKETS);
  audit.bases[label] = {
    repo: b.repo,
    language: b.language,
    basisKind: b.basisKind,
    isPin: b.isPin,
    contributesRecurrence: !b.isPin,
    qualifying: b.qualifying,
    emitted: b.emitted,
    omitted: b.omitted,
    D4: d4,
    D5: d5,
    D4summary: Object.fromEntries(CLASSES.map((c) => [c, d4.filter((x) => x.class === c).length])),
    D5summary: Object.fromEntries(CLASSES.map((c) => [c, d5.filter((x) => x.class === c).length])),
  };
}

assertNoOutcome(audit, 'denominator audit output');
writeFileSync('docs/evidence/meta-378/tables/denominators.json', `${JSON.stringify(audit, null, 2)}\n`);

const held = Object.entries(audit.bases).filter(([, b]) => b.contributesRecurrence);
console.log(`minN=${MIN_N}  bases=${Object.keys(audit.bases).length}  recurrence-contributing=${held.length}  (outcome NOT loaded)`);
console.log('\nR1 -- BOTH_CURRENT cell class, per recurrence-contributing basis');
let k = 0;
for (const [label, b] of held) {
  const c = b.D4.find((x) => x.stratum === 'BOTH_CURRENT');
  if (c.class === 'COMPARABLE') k++;
  console.log(`  ${label.padEnd(20)} emitted=${String(c.emittedN).padStart(3)} omitted=${String(c.omittedN).padStart(4)}  ${c.class}`);
}
console.log(`  => K (comparable BOTH_CURRENT bases) = ${k}`);

console.log('\nR2 -- age cell classes, per recurrence-contributing basis');
let c2 = 0;
for (const [label, b] of held) {
  const comp = b.D5.filter((x) => x.class === 'COMPARABLE');
  c2 += comp.length;
  console.log(`  ${label.padEnd(20)} ${b.D5.map((x) => `${x.stratum}:${x.emittedN}/${x.omittedN}${x.class === 'COMPARABLE' ? '*' : ''}`).join('  ')}`);
}
console.log(`  => C2 (comparable age cells) = ${c2}`);
console.log('\ndenominators.json written');
