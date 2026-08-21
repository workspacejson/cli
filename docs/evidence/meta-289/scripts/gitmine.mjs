// gitmine.mjs — META-289 §8 transaction extraction and §11 rename/delete rules.
//
// One definition of "transaction" shared by verification, phase-a and phase-b.
// Reads git only. Knows nothing about outcomes, baselines or metrics.
import { execFileSync, spawnSync } from 'node:child_process';

export const MAX_TXN_FILES = 50;           // §8 eligibility upper bound
export const MIN_TXN_FILES = 1;            // §8 eligibility lower bound

export const git = (dir, args, maxBuffer = 1 << 30) =>
  execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', maxBuffer });

// §11: destination-counted renames/copies; deletes are NOT touches.
function applyStatus(status, a, b) {
  const c = status[0];
  if (c === 'D') return null;                       // delete: not a touch
  if (c === 'R' || c === 'C') return b;             // destination only
  if (c === 'A' || c === 'M' || c === 'T') return a;
  return a;                                          // U/X: treat as touch of the path
}

// Ordered newest-first list of first-parent transactions ending at `pin`.
// `limit` bounds the walk; omit for full history.
export function firstParentTransactions(dir, pin, limit) {
  const args = ['log', '--first-parent', '--diff-merges=first-parent', '--name-status',
    '-M', '--format=%x01%H', pin];
  if (limit) args.splice(1, 0, `-n${limit}`);
  let out;
  try {
    out = git(dir, args);
  } catch {
    // Retry without optional flags on older git.
    out = git(dir, args.filter((a) => a !== '--no-renames-empty'));
  }
  const txns = [];
  for (const block of out.split('\x01')) {
    if (!block.trim()) continue;
    const lines = block.split('\n');
    const sha = lines[0].trim();
    if (!/^[0-9a-f]{40}$/.test(sha)) continue;
    const touched = []; let raw = 0;
    for (let i = 1; i < lines.length; i++) {
      const ln = lines[i];
      if (!ln) continue;
      const parts = ln.split('\t');
      if (parts.length < 2) continue;
      raw++;
      const p = applyStatus(parts[0], parts[1], parts[2]);
      if (p) touched.push(p);
    }
    txns.push({ sha, raw, touched });
  }
  return txns;
}

export const isEligibleTxn = (t) => t.raw >= MIN_TXN_FILES && t.raw <= MAX_TXN_FILES;

export function treePaths(dir, rev) {
  return git(dir, ['ls-tree', '-r', '--name-only', rev]).split('\n').filter(Boolean);
}

export function firstParentOf(dir, sha) {
  const r = spawnSync('git', ['-C', dir, 'rev-parse', `${sha}^1`], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

export const firstParentCount = (dir, rev) =>
  Number(git(dir, ['rev-list', '--count', '--first-parent', rev]).trim());
