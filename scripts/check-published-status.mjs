#!/usr/bin/env node

// Published-status and version truth gate (META-296).
//
// The root README once said `@workspacejson/cli` was "not yet on npm" while the
// package manifest read 0.5.2 and the package-level README gave install
// instructions and claimed npm provenance. Three surfaces, three different
// stories. Nothing mechanical could notice.
//
// WHAT THIS ASSERTS — and deliberately does not:
//
//   The manifests in this repository are the arbiter for package NAME, VERSION
//   and PRIVATE state. This gate derives those from `packages/*/package.json`
//   and fails when prose contradicts them. It never hard-codes a version, so it
//   keeps working across releases.
//
//   It does NOT contact the registry, and it does not claim a package is on npm.
//   "Is the published tarball what this repository says it is" is a distribution
//   assertion across repositories and belongs to META-293, not here. Baking a
//   registry call into a repo-local gate would also make CI fail for reasons
//   that have nothing to do with the commit under test.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const violations = [];
const report = (check, file, detail) => violations.push({ check, file, detail });

// --- the arbiter: workspace manifests -------------------------------------

const packagesDir = join(repoRoot, "packages");
const packages = readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(packagesDir, entry.name, "package.json"))
  .filter((manifestPath) => existsSync(manifestPath))
  .map((manifestPath) => {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    return {
      dir: `packages/${manifestPath.split("/").slice(-2, -1)[0]}`,
      name: manifest.name,
      version: manifest.version,
      isPrivate: manifest.private === true,
      manifestPath,
    };
  });

const publishable = packages.filter((p) => !p.isPrivate);

// --- 1: the root README packages table matches the manifests ---------------

const readmePath = join(repoRoot, "README.md");
const readme = readFileSync(readmePath, "utf8");

const NEGATION = /\bno\b|not yet|not published|unpublished|not on npm/i;
const SEMVER = /(\d+\.\d+\.\d+)/;

function packagesTableRows(text) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => /^##\s+Packages\s*$/.test(l));
  if (start === -1) return null;
  const rows = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith("|")) {
      if (rows.length > 0) break;
      continue;
    }
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 3) continue;
    if (/^-+$/.test(cells[0].replace(/\s/g, ""))) continue; // separator
    rows.push({ directory: cells[0], pkg: cells[1], published: cells[2], line: i + 1 });
  }
  return rows;
}

const rows = packagesTableRows(readme);

if (rows === null) {
  report("packages-table-missing", "README.md",
    "no `## Packages` section found; this gate reads that table as the repository's published-status claim");
} else {
  for (const pkg of packages) {
    const row = rows.find((r) => r.pkg.includes(pkg.name));
    if (!row) {
      report("packages-table-coverage", "README.md",
        `workspace package ${pkg.name} has no row in the Packages table; every package must state its status`);
      continue;
    }

    if (pkg.isPrivate) {
      if (!NEGATION.test(row.published)) {
        report("private-published-claim", `README.md:${row.line}`,
          `${pkg.name} is \`private: true\` in ${pkg.dir}/package.json, but the table does not say it is unpublished`);
      }
      continue;
    }

    if (NEGATION.test(row.published)) {
      report("publish-status-contradiction", `README.md:${row.line}`,
        `${pkg.name} is publishable (no \`private: true\` in ${pkg.dir}/package.json, publishConfig.access=` +
        `${JSON.stringify(JSON.parse(readFileSync(pkg.manifestPath, "utf8")).publishConfig?.access)}) but the table says "${row.published}"`);
      continue;
    }

    const stated = row.published.match(SEMVER)?.[1];
    if (!stated) {
      report("version-claim-missing", `README.md:${row.line}`,
        `${pkg.name} row states no version; state the manifest version (${pkg.version}) so drift is detectable`);
    } else if (stated !== pkg.version) {
      report("version-drift", `README.md:${row.line}`,
        `${pkg.name} row says ${stated}, manifest says ${pkg.version}`);
    }
  }
}

// --- 2: no prose anywhere contradicts a publishable package ----------------

const docFiles = ["README.md", ...packages.map((p) => `${p.dir}/README.md`)]
  .filter((f) => existsSync(join(repoRoot, f)));

// Deliberately literal. A looser "package name near a negative word" heuristic
// flags legitimate prose such as "it gets no new features", which is true and
// should stay.
//
// PUBLICATION STATUS IS NOT PUBLICATION AUTHORITY. "`agents-audit` is not
// published from here" is a true and necessary statement about which repository
// owns the release, and META-296 requires that distinction be preserved rather
// than flattened. Only bare status claims are contradictions; the negative
// lookahead below is what keeps authority prose legal.
const NEGATIVE_PROSE = [
  { pattern: /nothing here is published yet/i, why: "asserts the repository publishes nothing" },
  { pattern: /not yet on npm/i, why: "asserts a package is absent from npm" },
  { pattern: /is not published(?!\s+(?:from|by)\b)/i, why: "asserts a package is not published at all" },
  { pattern: /is unpublished(?!\s+(?:from|by)\b)/i, why: "asserts a package is unpublished" },
];

for (const file of docFiles) {
  const text = readFileSync(join(repoRoot, file), "utf8");
  const lines = text.split("\n");

  lines.forEach((line, index) => {
    for (const { pattern, why } of NEGATIVE_PROSE) {
      if (pattern.test(line)) {
        report("prose-contradiction", `${file}:${index + 1}`,
          `${why}, while ${publishable.map((p) => p.name).join(" and ")} are publishable in this repository: "${line.trim()}"`);
      }
    }

    // "Once X is published, ..." presumes X is not published yet.
    const conditional = line.match(/once\s+`?(@?[\w@/.-]+?)`?\s+is published/i);
    if (conditional) {
      const named = publishable.find((p) => p.name === conditional[1]);
      if (named) {
        report("prose-contradiction", `${file}:${index + 1}`,
          `presumes ${named.name} is not yet published, but it is publishable at ${named.version}: "${line.trim()}"`);
      }
    }
  });
}

// ---------------------------------------------------------------------------

if (violations.length > 0) {
  console.error(`Published-status check failed with ${violations.length} violation(s):\n`);
  for (const { check, file, detail } of violations) {
    console.error(`  [${check}] ${file}\n      ${detail}`);
  }
  console.error("\nThe package manifests are the arbiter. Correct the prose, or correct the manifest.");
  process.exit(1);
}

const summary = packages
  .map((p) => `${p.name}@${p.version}${p.isPrivate ? " (private)" : ""}`)
  .join(", ");
console.log(`Published-status check passed: ${packages.length} manifest(s) — ${summary} — agree with ${docFiles.length} documentation surface(s).`);
