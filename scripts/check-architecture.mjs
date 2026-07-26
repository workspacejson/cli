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
  // Extracted under META-248. It was DataHub consumer logic staged here while
  // its permanent owner was decided, never durable CLI architecture. Listing
  // it keeps it from drifting back: `neutral-producer-purity` only scans
  // packages/cli, so a re-added sibling package would otherwise pass.
  { path: "packages/datahub-adapter", owner: "workspacejson/datahub-agent" },
  { path: "src/pages", owner: "workspacejson/site" },
  { path: "astro.config.mjs", owner: "workspacejson/site" },
];

for (const { path, owner } of FOREIGN_DIRECTORIES) {
  const full = join(repoRoot, path);
  if (existsSync(full)) report("repository-boundary", full, `owned by ${owner}, must not exist here`);
}

// ---------------------------------------------------------------------------
// 3b. The neutral producer stays neutral: no vendor-specific or host-specific
// consumer logic inside packages/cli.
//
// The migrated DataHub/dbt adapter is staged in this repository pending
// extraction to workspacejson/datahub-agent, which owns DataHub consumption.
// It must not leak into the neutral producer on its way out, and no future
// vendor adapter may take its place there.
// ---------------------------------------------------------------------------
// Substring matching, not word-boundary matching. A red test caught the
// difference: `\bdatahub\b` does not match `joinDataHubUrn`, which is exactly
// the shape vendor logic arrives in. The file NAME is checked too, since
// `producer/datahub.ts` is a violation regardless of what it contains.
const NEUTRALITY_PATTERNS = [
  { pattern: /dbt[_-]?project|\bdbt\b/i, detail: "dbt-specific logic" },
  { pattern: /datahub/i, detail: "DataHub-specific logic" },
  { pattern: /vreko/i, detail: "vendor-specific (Vreko) content" },
];

const neutralPackage = join(repoRoot, "packages", "cli");
if (existsSync(neutralPackage)) {
  for (const file of sourceFiles) {
    if (!file.startsWith(neutralPackage + "/")) continue;
    if (SELF_REFERENTIAL.has(file)) continue;
    const subject = `${relative(repoRoot, file)}\n${stripComments(readFileSync(file, "utf8"))}`;
    for (const { pattern, detail } of NEUTRALITY_PATTERNS) {
      if (pattern.test(subject)) {
        report("neutral-producer-purity", file,
          `${detail} must not live in the neutral producer; DataHub consumption is owned by workspacejson/datahub-agent`);
      }
    }
  }
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

// Names of packages defined inside THIS repository. A `workspace:` range that
// points at one of these is a normal monorepo link that pnpm rewrites to a real
// version at pack time. A `workspace:` range pointing anywhere else means a
// cross-repository link, which cannot resolve for a consumer and is exactly
// what the split was meant to eliminate. The original rule conflated the two
// (META-247).
const localPackageNames = new Set(
  manifests
    .map((p) => {
      try { return JSON.parse(readFileSync(p, "utf8")).name; } catch { return undefined; }
    })
    .filter(Boolean),
);

for (const manifestPath of manifests) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

  for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
    for (const [name, range] of Object.entries(manifest[field] ?? {})) {
      if (typeof range !== "string") continue;
      // `workspace:` is allowed only for packages this repository defines.
      // `file:`, `link:`, `portal:` and relative paths are never allowed —
      // they point outside the dependency graph a consumer can resolve.
      const isInternalWorkspaceLink = range.startsWith("workspace:") && localPackageNames.has(name);
      if (LOCAL_LINK.test(range) && !isInternalWorkspaceLink) {
        report("local-dependency", manifestPath, `${field}.${name}=${JSON.stringify(range)} is a local/sibling link to a package this repository does not define; it cannot resolve for a consumer`);
      }
      if (STANDARD_OWNED.has(name) && !EXACT_VERSION.test(range)) {
        report("unpinned-standard-dependency", manifestPath, `${field}.${name}=${JSON.stringify(range)} must be an exact published version`);
      }
    }
  }

  if (manifest.name === "@workspacejson/datahub-adapter") {
    report("repository-boundary", manifestPath, "@workspacejson/datahub-adapter was extracted to workspacejson/datahub-agent under META-248 and must not be redefined here");
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
    if (content.includes("@workspacejson/datahub-adapter")) {
      report("repository-boundary", file, "publishing workflow references @workspacejson/datahub-adapter, which was extracted to workspacejson/datahub-agent under META-248 and is not publishable from here");
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
