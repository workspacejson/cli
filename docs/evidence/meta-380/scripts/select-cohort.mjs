// select-cohort.mjs — META-380 §5.2 eligibility + §5.3 seeded ordering.
//
// Reads ONLY the committed universe snapshot. Produces the frozen ranked order.
// Fixed before any repository is cloned, so §5.4 backfill cannot be steered.
// Reads METADATA ONLY.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const SEED = 'META-380/OQ-15/source-test-coupdate-replication/v1';   // §5.3
const EXCLUDED = new Set([                                           // §4 anti-leak
  // META-289 cohort
  'remult/remult', 'flyteorg/flyte', 'LuckPerms/LuckPerms', 'kornia/kornia',
  // META-375 discovery
  'formatjs/formatjs', 'JamieMason/syncpack', 'polyfy/polylith',
  // META-378 cohort
  'nteract/hydrogen', 'thepowersgang/rust_os', 'clojure/core.typed',
  'hyperledger/fabric', 'scikit-image/scikit-image',
]);

const u = JSON.parse(readFileSync('docs/evidence/meta-380/raw/universe.json', 'utf8'));
const key = (n) => createHash('sha256').update(`${SEED}:${n}`, 'utf8').digest('hex');

function eligibility(r, lang) {
  return {
    E1: true,
    E2: r.fork === false,
    E3: r.archived === false && r.disabled === false,
    E4: typeof r.default_branch === 'string' && r.default_branch.length > 0,
    E5: r.stargazers_count >= 1000 && r.stargazers_count <= 40000,
    E6: Date.parse(r.created_at) < Date.parse('2022-01-01T00:00:00Z'),
    E7: Date.parse(r.pushed_at) > Date.parse('2026-01-01T00:00:00Z'),
    E8: r.size >= 5000 && r.size <= 400000,
    E9: !EXCLUDED.has(r.full_name) && r.full_name.split('/')[0] !== 'workspacejson',
    E10: r.language === lang,
  };
}

const out = {
  issue: 'META-380', seed: SEED,
  orderingRule: 'ascending sha256(SEED + ":" + full_name), lowercase hex, lexical',
  universeSnapshotUtc: u.snapshotUtc,
  antiLeakExcluded: [...EXCLUDED], strata: {},
};

for (const [lang, s] of Object.entries(u.strata)) {
  const seen = new Set(); const eligible = [];
  const rejected = { counts: {}, antiLeakHits: [] };
  for (const r of s.items) {
    if (seen.has(r.full_name)) continue;
    seen.add(r.full_name);
    const e = eligibility(r, lang);
    const failed = Object.entries(e).filter(([, v]) => !v).map(([k]) => k);
    if (failed.length === 0) {
      eligible.push({ full_name: r.full_name, id: r.id, default_branch: r.default_branch,
        stars: r.stargazers_count, size: r.size, created_at: r.created_at,
        pushed_at: r.pushed_at, orderKey: key(r.full_name) });
    } else {
      for (const f of failed) rejected.counts[f] = (rejected.counts[f] ?? 0) + 1;
      if (failed.includes('E9')) rejected.antiLeakHits.push(r.full_name);
    }
  }
  eligible.sort((a, b) => (a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0));
  out.strata[lang] = {
    materialized: s.items.length, distinct: seen.size, eligible: eligible.length,
    rejectedByPredicate: rejected.counts,
    antiLeakRepositoriesEncountered: rejected.antiLeakHits,
    rankedOrder: eligible,
  };
  console.log(`${lang}: distinct=${seen.size} eligible=${eligible.length} rejected=${JSON.stringify(rejected.counts)} antiLeakHits=${rejected.antiLeakHits.length}`);
  for (let i = 0; i < Math.min(10, eligible.length); i++)
    console.log(`   rank${i + 1}=${eligible[i].full_name}`);
}

writeFileSync('docs/evidence/meta-380/raw/ranked-order.json', `${JSON.stringify(out, null, 2)}\n`);
console.log('\nranked-order.json written (frozen order, before any clone)');
