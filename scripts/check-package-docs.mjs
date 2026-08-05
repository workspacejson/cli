#!/usr/bin/env node

// Package documentation truth gate (META-296).
//
// The root README once listed `@workspacejson/cli` as "not yet on npm" while the
// package manifest read 0.5.2 and the package-level README gave install
// instructions. Three surfaces, three stories, nothing mechanical to notice.
//
// WHAT ARBITRATES WHAT — the boundary this gate must not cross:
//
//   The manifests in `packages/*/package.json` are the arbiter for package
//   NAME, VERSION and PRIVATE state. This gate derives those and fails when the
//   documentation contradicts them. It hard-codes no version, so it survives
//   releases.
//
//   The manifests are NOT an arbiter for whether a package is actually on npm.
//   `private !== true` means publication is *permitted*, not that it *happened*.
//   A legitimately unpublished package has a public, versioned manifest and is
//   not lying about anything. During the window between a version bump and the
//   publish that follows it, the manifest carries a version nothing has shipped.
//
//   An earlier revision of this gate conflated the two: it rejected "not yet on
//   npm" for any non-private package, which would have failed a correct
//   repository and asserted a registry fact from a file that cannot establish
//   one. That check is removed rather than softened.
//
//   Registry distribution is verified separately, across repositories, under
//   META-293. Documentation may state npm facts as a dated registry snapshot;
//   this gate neither proves nor disproves them.
//
// The Version column is what keeps the original defect catchable, and for an
// honest reason: the table must carry each package's manifest version, so a cell
// reading "No — not yet on npm" fails as a missing version claim rather than as
// an inferred publication claim.
//
// NOT ASSERTED MECHANICALLY: that package semver is never presented as the
// specification-profile version. A regex cannot separate "produces specification
// v0.4 artifacts" — true, and `agents-audit` happens to be 0.4.4 — from a genuine
// conflation. It is stated in prose in the README instead, and left to review.

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
  .map((entry) => ({ dirName: entry.name, manifestPath: join(packagesDir, entry.name, "package.json") }))
  .filter(({ manifestPath }) => existsSync(manifestPath))
  .map(({ dirName, manifestPath }) => {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    return {
      dir: `packages/${dirName}`,
      name: manifest.name,
      version: manifest.version,
      isPrivate: manifest.private === true,
    };
  });

// --- the root README packages table matches the manifests ------------------

const readme = readFileSync(join(repoRoot, "README.md"), "utf8");

const SEMVER = /(\d+\.\d+\.\d+)/;
const PRIVATE_MARKER = /\bprivate\b|not published|unpublished|internal only/i;

function packagesTableRows(text) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => /^##\s+Packages\s*$/.test(l));
  if (start === -1) return null;
  const rows = [];
  let inTable = false;
  let seenSeparator = false;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith("|")) {
      if (inTable) break;
      continue;
    }
    inTable = true;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 3) continue;
    // The separator divides the header from the data. Everything before it is
    // the header row — counting it as data makes the literal word "Package" look
    // like an undocumented package.
    if (cells.every((c) => /^:?-+:?$/.test(c.replace(/\s/g, "")))) {
      seenSeparator = true;
      continue;
    }
    if (!seenSeparator) continue;
    rows.push({ directory: cells[0], pkg: cells[1], version: cells[2], line: i + 1 });
  }
  return rows;
}

const rows = packagesTableRows(readme);

if (rows === null) {
  report("packages-table-missing", "README.md",
    "no `## Packages` section found; this gate reads that table as the repository's package-documentation claim");
} else {
  for (const pkg of packages) {
    const row = rows.find((r) => r.pkg.includes(pkg.name));
    if (!row) {
      report("packages-table-coverage", "README.md",
        `workspace package ${pkg.name} has no row in the Packages table; every package must be documented`);
      continue;
    }

    if (pkg.isPrivate) {
      if (!PRIVATE_MARKER.test(row.version) && !PRIVATE_MARKER.test(row.pkg)) {
        report("private-distribution-claim", `README.md:${row.line}`,
          `${pkg.name} is \`private: true\` in ${pkg.dir}/package.json, but its row does not say so — a private package must not read as publicly distributed`);
      }
      continue;
    }

    const stated = row.version.match(SEMVER)?.[1];
    if (!stated) {
      report("version-claim-missing", `README.md:${row.line}`,
        `${pkg.name} row states no version. State the manifest version (${pkg.version}) so drift is detectable — this documents the manifest, not npm`);
    } else if (stated !== pkg.version) {
      report("version-drift", `README.md:${row.line}`,
        `${pkg.name} row says ${stated}, ${pkg.dir}/package.json says ${pkg.version}`);
    }
  }

  for (const row of rows) {
    if (!packages.some((p) => row.pkg.includes(p.name))) {
      report("unknown-package-row", `README.md:${row.line}`,
        `row documents "${row.pkg}", which is not a workspace package under packages/`);
    }
  }
}

// --- package READMEs name themselves correctly -----------------------------

for (const pkg of packages) {
  const file = `${pkg.dir}/README.md`;
  if (!existsSync(join(repoRoot, file))) continue;
  const text = readFileSync(join(repoRoot, file), "utf8");
  const heading = text.split("\n").find((l) => l.startsWith("# "));
  if (heading && !heading.includes(pkg.name)) {
    report("package-readme-name", `${file}:1`,
      `heading is "${heading.trim()}" but the manifest name is ${pkg.name}`);
  }
}

// ---------------------------------------------------------------------------

if (violations.length > 0) {
  console.error(`Package documentation check failed with ${violations.length} violation(s):\n`);
  for (const { check, file, detail } of violations) {
    console.error(`  [${check}] ${file}\n      ${detail}`);
  }
  console.error("\nThe package manifests are the arbiter for name, version and private state.");
  console.error("Registry distribution is a separate assertion, owned by META-293.");
  process.exit(1);
}

const summary = packages
  .map((p) => `${p.name}@${p.version}${p.isPrivate ? " (private)" : ""}`)
  .join(", ");
console.log(`Package documentation check passed: ${packages.length} manifest(s) — ${summary} — agree with the documented names and versions.`);
