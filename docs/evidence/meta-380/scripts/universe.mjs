// universe.mjs — META-380 §5.1 universe materialization.
//
// Paginates the frozen GitHub Search query and writes every returned
// repository record verbatim to raw/universe.json. The COMMITTED SNAPSHOT is
// the universe; selection reproduces from that file, not from the live API.
//
// Reads repository METADATA ONLY. No clone, no history, no outcome.
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const STRATUM = 'TypeScript';                                    // §5.1
const QUERY = `language:${STRATUM} stars:1000..40000 created:<2022-01-01 pushed:>2026-01-01 fork:false archived:false size:5000..400000`;
const PER_PAGE = 100;
const MAX_PAGES = 10;                                            // GitHub hard cap

const gh = (path) =>
  JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8', maxBuffer: 1 << 28 }));

const KEEP = ['id', 'full_name', 'html_url', 'default_branch', 'language', 'fork',
  'archived', 'disabled', 'stargazers_count', 'size', 'created_at', 'pushed_at', 'updated_at'];

mkdirSync('docs/evidence/meta-380/raw', { recursive: true });

const snapshot = {
  issue: 'META-380',
  preregistration: 'docs/evidence/meta-380/PREREGISTRATION.md §5.1',
  snapshotUtc: new Date().toISOString(),
  api: 'search/repositories', sort: 'stars', order: 'desc',
  perPage: PER_PAGE, maxPages: MAX_PAGES, strata: {},
};

const q = QUERY;
const enc = encodeURIComponent(q);
const items = []; const pages = []; let total = null;
for (let page = 1; page <= MAX_PAGES; page++) {
  const r = gh(`search/repositories?q=${enc}&sort=stars&order=desc&per_page=${PER_PAGE}&page=${page}`);
  if (total === null) total = r.total_count;
  pages.push({ page, returned: r.items.length });
  for (const it of r.items) items.push(Object.fromEntries(KEEP.map((k) => [k, it[k]])));
  if (r.items.length < PER_PAGE) break;
}
snapshot.strata[STRATUM] = { query: q, totalCount: total, pages, materialized: items.length, items };
console.log(`${STRATUM}: total_count=${total} materialized=${items.length} pages=${pages.length}`);

writeFileSync('docs/evidence/meta-380/raw/universe.json', `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`\nuniverse.json written: ${items.length} records @ ${snapshot.snapshotUtc}`);
