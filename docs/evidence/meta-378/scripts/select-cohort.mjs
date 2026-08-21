// select-cohort.mjs — META-378 §6 eligibility + §8 seeded deterministic ordering.
//
// Reads ONLY the committed universe snapshot. Produces the frozen ranked order
// per stratum. This ordering is fixed before any repository is cloned, so the
// §7 backfill cannot be steered.
//
// Reads repository METADATA ONLY. No clone, no miner, no co-change output.
//
// Usage: node select-cohort.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const SEED = 'META-378/OQ-14/replication/v1';          // PREREGISTRATION §8
const DISCOVERY = new Set([                             // PREREGISTRATION §3 anti-leak
  'formatjs/formatjs',
  'JamieMason/syncpack',
  'polyfy/polylith',
]);

const u = JSON.parse(readFileSync('docs/evidence/meta-378/raw/universe.json', 'utf8'));
const key = (fullName) => createHash('sha256').update(`${SEED}:${fullName}`, 'utf8').digest('hex');

// §6 eligibility. Every predicate re-verified from the snapshot record rather
// than trusted from the query, so the filter is auditable offline.
function eligibility(r) {
  const created = Date.parse(r.created_at);
  const pushed = Date.parse(r.pushed_at);
  return {
    E2: r.fork === false,
    E3: r.archived === false && r.disabled === false,
    E4: typeof r.default_branch === 'string' && r.default_branch.length > 0,
    E5: r.stargazers_count >= 800 && r.stargazers_count <= 25000,
    E6: created < Date.parse('2022-01-01T00:00:00Z'),
    E7: pushed > Date.parse('2026-01-01T00:00:00Z'),
    E8: r.size >= 2000 && r.size <= 250000,
    E9: !DISCOVERY.has(r.full_name),
  };
}

const out = {
  issue: 'META-378',
  seed: SEED,
  orderingRule: 'ascending sha256(SEED + ":" + full_name), lowercase hex, lexical',
  universeSnapshotUtc: u.snapshotUtc,
  discoveryExcluded: [...DISCOVERY],
  strata: {},
};

for (const [lang, s] of Object.entries(u.strata)) {
  const seen = new Set();
  const eligible = [];
  const rejected = { counts: {}, discoveryHits: [] };
  for (const r of s.items) {
    if (seen.has(r.full_name)) continue;      // de-duplicate across pages
    seen.add(r.full_name);
    const e = eligibility(r);
    const failed = Object.entries(e).filter(([, v]) => !v).map(([k]) => k);
    if (failed.length === 0) {
      eligible.push({ full_name: r.full_name, id: r.id, default_branch: r.default_branch,
        stars: r.stargazers_count, size: r.size, created_at: r.created_at,
        pushed_at: r.pushed_at, orderKey: key(r.full_name) });
    } else {
      for (const f of failed) rejected.counts[f] = (rejected.counts[f] ?? 0) + 1;
      if (failed.includes('E9')) rejected.discoveryHits.push(r.full_name);
    }
  }
  eligible.sort((a, b) => (a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0));
  out.strata[lang] = {
    materialized: s.items.length,
    distinct: seen.size,
    eligible: eligible.length,
    rejectedByPredicate: rejected.counts,
    discoveryRepositoriesEncountered: rejected.discoveryHits,
    rankedOrder: eligible,
  };
  console.log(`${lang}: distinct=${seen.size} eligible=${eligible.length} rejected=${JSON.stringify(rejected.counts)} discoveryHits=${rejected.discoveryHits.length}`);
  console.log(`   rank1=${eligible[0]?.full_name}  rank2=${eligible[1]?.full_name}  rank3=${eligible[2]?.full_name}`);
}

writeFileSync('docs/evidence/meta-378/raw/ranked-order.json', `${JSON.stringify(out, null, 2)}\n`);
console.log('\nranked-order.json written (frozen order, before any clone)');
