#!/usr/bin/env node

// Repository-boundary and clean-room guards for workspacejson/cli (META-165).
//
// These are executable, not documentation. Each check below is paired with a
// deliberate red test in scripts/check-architecture.test.mjs — a guard that has
// never been observed rejecting a violation is not evidence of anything.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = process.env.WORKSPACEJSON_CHECK_ROOT
  ?? resolve(dirname(fileURLToPath(import.meta.url)), "..");

const SKIP_DIRECTORIES = new Set([".git", "node_modules", "dist", "coverage", ".changeset"]);
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".yml", ".yaml", ".md"]);

const violations = [];

function report(check, file, detail) {
  violations.push({ check, file: relative(repoRoot, file) || ".", detail });
}

function walk(directory, visit) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && SKIP_DIRECTORIES.has(entry.name)) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRECTORIES.has(entry.name)) continue;
      walk(full, visit);
    } else if (entry.isFile()) {
      visit(full);
    }
  }
}

const sourceFiles = [];
walk(repoRoot, (file) => {
  if (TEXT_EXTENSIONS.has(extname(file))) sourceFiles.push(file);
});

// This file legitimately names every forbidden pattern, as does the ownership
// documentation that explains the rules. Excluding them by path keeps the guard
// from flagging its own vocabulary while still scanning all real source.
const SELF_REFERENTIAL = new Set([
  join(repoRoot, "scripts", "check-architecture.mjs"),
  join(repoRoot, "scripts", "check-architecture.test.mjs"),
  join(repoRoot, "OWNERSHIP.md"),
  join(repoRoot, "CONTRIBUTING.md"),
  join(repoRoot, "README.md"),
  join(repoRoot, "CHANGELOG.md"),
  join(repoRoot, "AGENTS.md"),
  join(repoRoot, "migration", "PROVENANCE.md"),
]);

// ---------------------------------------------------------------------------
// 1. Clean-room: no proprietary imports or assumptions.
// ---------------------------------------------------------------------------
const PROPRIETARY_PATTERNS = [
  { pattern: /@marcelle-labs\//, detail: "imports or references @marcelle-labs/*" },
  { pattern: /workspace\.vreko\.json/, detail: "assumes the private workspace.vreko.json artifact" },
  { pattern: /from\s+["'][^"']*\bvreko\b[^"']*["']/i, detail: "imports private Vreko source" },
  { pattern: /require\(\s*["'][^"']*\bvreko\b[^"']*["']\s*\)/i, detail: "requires private Vreko source" },
];

for (const file of sourceFiles) {
  if (SELF_REFERENTIAL.has(file)) continue;
  const content = readFileSync(file, "utf8");
  for (const { pattern, detail } of PROPRIETARY_PATTERNS) {
    if (pattern.test(content)) report("clean-room", file, detail);
  }
}

// ---------------------------------------------------------------------------
// 2. No copied normative schema. The schema belongs to workspacejson/standard.
// ---------------------------------------------------------------------------
for (const file of sourceFiles) {
  if (extname(file) !== ".json") continue;
  if (SELF_REFERENTIAL.has(file)) continue;
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    continue;
  }
  if (parsed && typeof parsed === "object" && typeof parsed.$schema === "string"
      && typeof parsed.$id === "string" && parsed.type === "object" && parsed.properties) {
    report("copied-schema", file, "looks like a copied JSON Schema document; the normative schema is owned by workspacejson/standard");
  }
}

// ---------------------------------------------------------------------------
// 2b. No ambient re-declaration of a standard-owned package (META-244).
//
// Ambient module declarations win over node_modules typings, so a handwritten
// `declare module '@workspacejson/spec'` silently shadows the real published
// contract — this repository shipped exactly that until META-244, and it hid
// the entire v0.4 surface from the compiler. workspacejson/standard owns those
// types; consume them, never restate them.
// ---------------------------------------------------------------------------
const AMBIENT_FIRST_PARTY = /declare\s+module\s+['"]@workspacejson\/[^'"]+['"]/;

// Comments are stripped first: this rule is about what the compiler sees, and
// the note in types/ambient.d.ts explaining why the shadow was removed
// necessarily quotes the very syntax it forbids.
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^[ \t]*\/\/.*$/gm, "");
}

for (const file of sourceFiles) {
  if (SELF_REFERENTIAL.has(file)) continue;
  if (!file.endsWith(".d.ts")) continue;
  const match = stripComments(readFileSync(file, "utf8")).match(AMBIENT_FIRST_PARTY);
  if (match) {
    report("shadowed-standard-types", file,
      `${match[0]} re-declares a standard-owned contract; consume the published declarations instead (META-244)`);
  }
}

// ---------------------------------------------------------------------------
// 3. No host-integration or site implementation in the CLI repository.
// ---------------------------------------------------------------------------
const FOREIGN_DIRECTORIES = [
  { path: "packages/mcp", owner: "workspacejson/integrations" },
  { path: "packages/host-codex", owner: "workspacejson/integrations" },
  { path: "packages/host-claude-code", owner: "workspacejson/integrations" },
  { path: "packages/reviewer", owner: "workspacejson/integrations" },
  { path: "apps/vscode-extension", owner: "workspacejson/integrations" },
  { path: "extension", owner: "workspacejson/integrations" },
  { path: "vsix", owner: "workspacejson/integrations" },
  { path: "packages/spec", owner: "workspacejson/standard" },
  { path: "packages/rules", owner: "workspacejson/standard" },
  { path: "src/pages", owner: "workspacejson/site" },
  { path: "astro.config.mjs", owner: "workspacejson/site" },
];

for (const { path, owner } of FOREIGN_DIRECTORIES) {
  const full = join(repoRoot, path);
  if (existsSync(full)) report("repository-boundary", full, `owned by ${owner}, must not exist here`);
}

// ---------------------------------------------------------------------------
// 4. Package manifests: no local links, standard deps pinned, shim stays private.
// ---------------------------------------------------------------------------
const LOCAL_LINK = /^(workspace:|file:|link:|portal:|\.\.?\/)/;
const EXACT_VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?$/;
const STANDARD_OWNED = new Set(["@workspacejson/spec", "@workspacejson/rules"]);

const manifests = [join(repoRoot, "package.json")];
const packagesDirectory = join(repoRoot, "packages");
if (existsSync(packagesDirectory)) {
  for (const entry of readdirSync(packagesDirectory)) {
    const manifest = join(packagesDirectory, entry, "package.json");
    if (existsSync(manifest) && statSync(manifest).isFile()) manifests.push(manifest);
  }
}

for (const manifestPath of manifests) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const isRoot = manifestPath === join(repoRoot, "package.json");

  for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
    for (const [name, range] of Object.entries(manifest[field] ?? {})) {
      if (typeof range !== "string") continue;
      // The private root manifest may workspace-link its own local packages;
      // a published package manifest may not, and no manifest may point at a
      // sibling checkout on disk.
      const isInternalWorkspaceLink = isRoot && range.startsWith("workspace:");
      if (LOCAL_LINK.test(range) && !isInternalWorkspaceLink) {
        report("local-dependency", manifestPath, `${field}.${name}=${JSON.stringify(range)} is a local/sibling link and cannot resolve for a consumer`);
      }
      if (STANDARD_OWNED.has(name) && !EXACT_VERSION.test(range)) {
        report("unpinned-standard-dependency", manifestPath, `${field}.${name}=${JSON.stringify(range)} must be an exact published version`);
      }
    }
  }

  if (manifest.name === "@workspacejson/cli" && manifest.private !== true) {
    report("private-package-publication", manifestPath, "@workspacejson/cli must remain private:true until META-236 ratifies its identity; publishing it is prohibited");
  }

  if (STANDARD_OWNED.has(manifest.name)) {
    report("repository-boundary", manifestPath, `${manifest.name} is owned by workspacejson/standard and must not be defined here`);
  }
}

// ---------------------------------------------------------------------------
// 5. No workflow may publish a package this repository does not own.
// ---------------------------------------------------------------------------
const workflowsDirectory = join(repoRoot, ".github", "workflows");
if (existsSync(workflowsDirectory)) {
  for (const entry of readdirSync(workflowsDirectory)) {
    const file = join(workflowsDirectory, entry);
    if (!/\.ya?ml$/.test(entry)) continue;
    const content = readFileSync(file, "utf8");
    const publishes = /npm\s+publish|changeset\s+publish|pnpm\s+publish/.test(content);
    if (!publishes) continue;
    for (const owned of STANDARD_OWNED) {
      if (content.includes(owned)) {
        report("foreign-publish", file, `publishing workflow references ${owned}, which is published by workspacejson/standard`);
      }
    }
    if (content.includes("@workspacejson/cli")) {
      report("private-package-publication", file, "publishing workflow references the private @workspacejson/cli");
    }
  }
}

// ---------------------------------------------------------------------------

if (violations.length > 0) {
  console.error(`Architecture check failed with ${violations.length} violation(s):\n`);
  for (const { check, file, detail } of violations) {
    console.error(`  [${check}] ${file}\n      ${detail}`);
  }
  console.error("\nSee OWNERSHIP.md for the boundaries these checks enforce.");
  process.exit(1);
}

console.log(`Architecture check passed: ${sourceFiles.length} files and ${manifests.length} manifests scanned; no boundary or clean-room violations.`);
