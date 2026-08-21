// universe.mjs — META-378 §5 universe materialization.
//
// Paginates the frozen GitHub Search queries and writes every returned
// repository record verbatim to raw/universe.json. The COMMITTED SNAPSHOT is
// the universe; selection reproduces from that file, not from the live API.
//
// Reads repository METADATA ONLY. No clone, no miner, no co-change output.
//
// Usage: node universe.mjs
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const STRATA = ['TypeScript', 'Rust', 'Clojure', 'Go', 'Python'];
const QUERY = (lang) =>
  `language:${lang} stars:800..25000 created:<2022-01-01 pushed:>2026-01-01 fork:false archived:false size:2000..250000`;
const PER_PAGE = 100;
const MAX_PAGES = 10; // GitHub hard-caps search at 1000 results

const gh = (path) =>
  JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8', maxBuffer: 1 << 28 }));

const KEEP = [
  'id', 'full_name', 'html_url', 'default_branch', 'language', 'fork',
  'archived', 'disabled', 'stargazers_count', 'size', 'created_at',
  'pushed_at', 'updated_at',
];

const snapshot = {
  issue: 'META-378',
  preregistration: 'docs/evidence/meta-378/PREREGISTRATION.md §5',
  snapshotUtc: new Date().toISOString(),
  api: 'search/repositories',
  sort: 'stars',
  order: 'desc',
  perPage: PER_PAGE,
  maxPages: MAX_PAGES,
  strata: {},
};

for (const lang of STRATA) {
  const q = QUERY(lang);
  const enc = encodeURIComponent(q);
  const items = [];
  const pages = [];
  let total = null;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const r = gh(`search/repositories?q=${enc}&sort=stars&order=desc&per_page=${PER_PAGE}&page=${page}`);
    if (total === null) total = r.total_count;
    pages.push({ page, returned: r.items.length });
    for (const it of r.items) items.push(Object.fromEntries(KEEP.map((k) => [k, it[k]])));
    if (r.items.length < PER_PAGE) break;
  }
  snapshot.strata[lang] = { query: q, totalCount: total, pages, materialized: items.length, items };
  console.log(`${lang}: total_count=${total} materialized=${items.length} pages=${pages.length}`);
}

writeFileSync('docs/evidence/meta-378/raw/universe.json', `${JSON.stringify(snapshot, null, 2)}\n`);
const all = Object.values(snapshot.strata).reduce((s, x) => s + x.materialized, 0);
console.log(`\nuniverse.json written: ${all} repository records across ${STRATA.length} strata`);
console.log(`snapshot ${snapshot.snapshotUtc}`);
