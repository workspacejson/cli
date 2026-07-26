#!/usr/bin/env node
// Independent parity proof for the PRIVATE DataHub/dbt shim (@workspacejson/cli).
//
// This deliberately shares nothing with the agents-audit parity run. A green
// producer result is not evidence about this package: it is a different package,
// with different code, different dependencies and a different contract.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, existsSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

// Paths are derived, never hardcoded. The old side is a clone of the frozen
// pre-migration source; migration/parity-lib.sh resolves, pins and builds it,
// and caches it under ~/.cache/workspacejson/cli-parity so repeat runs are
// cheap. The cache lives OUTSIDE the repository on purpose: the frozen source
// contains content the architecture guard exists to reject, so caching it in
// the working tree turns scripts/check-architecture.mjs red.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const XDG_CACHE = process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache");
const PARITY_CACHE = process.env.WORKSPACEJSON_PARITY_CACHE ?? join(XDG_CACHE, "workspacejson", "cli-parity");
const OLD_CHECKOUT = process.env.WORKSPACEJSON_OLD_CHECKOUT ?? join(PARITY_CACHE, "source-agents-audit");

const SIDES = {
  old: join(OLD_CHECKOUT, "packages/cli"),
  new: join(REPO_ROOT, "packages/datahub-adapter"),
};

for (const [side, dir] of Object.entries(SIDES)) {
  if (!existsSync(join(dir, "package.json"))) {
    console.error(`\nERROR: missing the ${side} side at ${dir}\n`);
    console.error(side === "old"
      ? "Run migration/parity-lib.sh's bootstrap first — the simplest way is:\n"
        + "  bash -c 'source migration/parity-lib.sh && parity_resolve_old_checkout && parity_build_old'\n"
        + "or point WORKSPACEJSON_OLD_CHECKOUT at an existing clone of the frozen source.\n"
      : "The DataHub adapter has been extracted from this repository (META-248).\n"
        + "Re-run this harness from workspacejson/datahub-agent against its candidate.\n");
    process.exit(1);
  }
  if (!existsSync(join(dir, "dist/index.js"))) {
    console.error(`\nERROR: ${side} side is not built (${join(dir, "dist/index.js")} missing).`);
    console.error(side === "old"
      ? "Build the frozen source: (cd " + OLD_CHECKOUT + " && pnpm install --no-frozen-lockfile && pnpm -r build)\n"
      : "Build this repository: pnpm install && pnpm -r build\n");
    process.exit(1);
  }
}

let pass = 0, fail = 0;
const failures = [];

function check(label, condition, detail = "") {
  if (condition) { console.log(`  PASS  ${label}`); pass += 1; }
  else { console.log(`  FAIL  ${label}${detail ? `\n          ${detail}` : ""}`); fail += 1; failures.push(label); }
}

function equalish(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// ---------------------------------------------------------------------------
console.log("==============================================================");
console.log(" 1. PACKAGE IDENTITY AND PRIVACY");
console.log("==============================================================");

const manifests = {};
for (const [side, dir] of Object.entries(SIDES)) {
  manifests[side] = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
}
// META-247 INTENTIONAL DIFFERENCE: the package was renamed so the neutral CLI
// could take the `@workspacejson/cli` name. The rename is the ratified change;
// everything below still asserts that BEHAVIOR is untouched.
check("renamed to an accurate identity, old name released for the neutral CLI",
  manifests.old.name === "@workspacejson/cli" && manifests.new.name === "@workspacejson/datahub-adapter",
  `old=${manifests.old.name} new=${manifests.new.name}`);
check("version unchanged: 0.0.1",
  manifests.old.version === manifests.new.version && manifests.new.version === "0.0.1");
check("STILL PRIVATE (private:true) — must never be published",
  manifests.old.private === true && manifests.new.private === true,
  `old=${manifests.old.private} new=${manifests.new.private}`);
// META-247 INTENTIONAL DIFFERENCE: the `workspacejson` bin now belongs to the
// neutral CLI, so this private adapter had to surrender it or collide.
check("bin surrendered `workspacejson` to the neutral CLI",
  manifests.old.bin.workspacejson === "./dist/cli.js"
  && manifests.new.bin["workspacejson-datahub-adapter"] === "./dist/cli.js"
  && manifests.new.bin.workspacejson === undefined);
check("exports/main/types unchanged",
  equalish(manifests.old.exports, manifests.new.exports)
  && manifests.old.main === manifests.new.main
  && manifests.old.types === manifests.new.types);
check("declares NO generate command (it is not the producer)",
  !JSON.stringify(manifests.new).includes("generate")
  && !readFileSync(join(SIDES.new, "src/cli.ts"), "utf8").includes("generateWorkspaceJson"));
check("does not depend on agents-audit or @workspacejson/rules",
  !("agents-audit" in (manifests.new.dependencies ?? {}))
  && !("@workspacejson/rules" in (manifests.new.dependencies ?? {})));

// ---------------------------------------------------------------------------
console.log("\n==============================================================");
console.log(" 2. PATH NORMALIZATION AND KEY CONSTRUCTION (old vs new)");
console.log("==============================================================");

const mods = {};
for (const [side, dir] of Object.entries(SIDES)) {
  mods[side] = await import(join(dir, "dist/index.js"));
}

const normalizeCases = [
  ["./src/models/a.sql", "src/models/a.sql"],
  ["src/models/a.sql/", "src/models/a.sql"],
  ["src/models/a.sql", "src/models/a.sql"],
  ["./a//b/", "a//b"],
];
for (const [input, expected] of normalizeCases) {
  const o = mods.old.canonical(input), n = mods.new.canonical(input);
  check(`canonical(${JSON.stringify(input)}) => ${JSON.stringify(n)}`, o === n && n === expected, `old=${o} new=${n} expected=${expected}`);
}

const prefixCases = [
  ["/repo", "/repo", ""],                       // dbt project IS the git root
  ["/repo", "/repo/analytics", "analytics"],     // nested one level
  ["/repo", "/repo/sub/warehouse", "sub/warehouse"],
  ["/repo", "/elsewhere", null],                 // escapes the git root
];
for (const [root, proj, expected] of prefixCases) {
  const o = mods.old.computeProjectPrefix(root, proj), n = mods.new.computeProjectPrefix(root, proj);
  check(`computeProjectPrefix(${root}, ${proj}) => ${JSON.stringify(n)}`, o === n && n === expected, `old=${o} new=${n} expected=${expected}`);
}

const keyCases = [
  ["", "models/customers.sql", "models/customers.sql"],
  ["analytics", "models/customers.sql", "analytics/models/customers.sql"],
  ["sub/warehouse", "./models/x.sql", "sub/warehouse/models/x.sql"],
];
for (const [prefix, original, expected] of keyCases) {
  const o = mods.old.normalizeModelPath(prefix, original), n = mods.new.normalizeModelPath(prefix, original);
  check(`normalizeModelPath(${JSON.stringify(prefix)}, ${JSON.stringify(original)}) => ${JSON.stringify(n)}`,
    o === n && n === expected, `old=${o} new=${n} expected=${expected}`);
}

// ---------------------------------------------------------------------------
console.log("\n==============================================================");
console.log(" 3. dbt PROJECT DISCOVERY AND MANIFEST EXTRACTION");
console.log("==============================================================");

const repo = mkdtempSync(join(tmpdir(), "shim-parity-"));
mkdirSync(join(repo, "analytics/models"), { recursive: true });
mkdirSync(join(repo, "sub/warehouse/models"), { recursive: true });
mkdirSync(join(repo, "node_modules/decoy"), { recursive: true });
writeFileSync(join(repo, "analytics/dbt_project.yml"), "name: analytics\n");
writeFileSync(join(repo, "sub/warehouse/dbt_project.yml"), "name: warehouse\n");
writeFileSync(join(repo, "node_modules/decoy/dbt_project.yml"), "name: decoy\n"); // must be ignored

const foundOld = mods.old.findDbtProjects(repo);
const foundNew = mods.new.findDbtProjects(repo);
check("findDbtProjects discovers BOTH dbt projects (multi-project guard)",
  foundNew.length === 2 && equalish(foundOld, foundNew), `old=${JSON.stringify(foundOld)} new=${JSON.stringify(foundNew)}`);
check("findDbtProjects ignores node_modules (would otherwise inflate the count)",
  !foundNew.some((p) => p.includes("node_modules")));
check("findDbtProjects output is deterministic (sorted)",
  equalish(foundNew, [...foundNew].sort()));

const manifest = {
  nodes: {
    "model.analytics.customers": { resource_type: "model", unique_id: "model.analytics.customers", original_file_path: "models/customers.sql" },
    "model.analytics.orders":    { resource_type: "model", unique_id: "model.analytics.orders",    original_file_path: "models/orders.sql" },
    "test.analytics.not_a_model":{ resource_type: "test",  unique_id: "test.analytics.not_a_model", original_file_path: "tests/t.sql" },
    "model.analytics.nopath":    { resource_type: "model", unique_id: "model.analytics.nopath" },
  },
};
const modelsOld = mods.old.extractModels(manifest), modelsNew = mods.new.extractModels(manifest);
check("extractModels returns only resource_type=model with a path",
  modelsNew.length === 2 && equalish(modelsOld, modelsNew), `new=${JSON.stringify(modelsNew)}`);
check("extractModels tolerates an empty manifest",
  equalish(mods.old.extractModels({}), mods.new.extractModels({})) && mods.new.extractModels({}).length === 0);

// ---------------------------------------------------------------------------
console.log("\n==============================================================");
console.log(" 4. JOIN AGAINST fileIndex (the actual DataHub fix)");
console.log("==============================================================");

const fileIndex = { "analytics/models/customers.sql": { fragility: 0.5 }, "analytics/models/orders.sql": { fragility: 0.1 } };

const joinedOld = mods.old.joinModels(modelsNew, "analytics", fileIndex);
const joinedNew = mods.new.joinModels(modelsNew, "analytics", fileIndex);
check("nested dbt project joins 2/2 after prefix normalization",
  joinedNew.matched === 2 && joinedNew.total === 2 && equalish(joinedOld, joinedNew));

// The regression this shim exists to prevent: WITHOUT the prefix, a nested
// project silently matches nothing.
const naiveOld = mods.old.joinModels(modelsNew, "", fileIndex);
const naiveNew = mods.new.joinModels(modelsNew, "", fileIndex);
check("PERTURBED: without the project prefix the same join collapses to 0/2",
  naiveNew.matched === 0 && naiveNew.total === 2 && equalish(naiveOld, naiveNew),
  `new matched=${naiveNew.matched}/${naiveNew.total}`);

const partial = mods.new.joinModels(modelsNew, "analytics", { "analytics/models/customers.sql": {} });
check("PERTURBED: partial fileIndex yields a partial match (1/2), not all-or-nothing",
  partial.matched === 1 && partial.total === 2);
check("join rows expose normalizedKey and matched for every model",
  joinedNew.rows.length === 2 && joinedNew.rows.every((r) => typeof r.normalizedKey === "string" && typeof r.matched === "boolean"));

// ---------------------------------------------------------------------------
console.log("\n==============================================================");
console.log(" 5. CLI RUNTIME: fileIndex shapes and zero-join exit code");
console.log("==============================================================");

function runCli(side, { workspace, manifestNodes, projectDir = "analytics" }) {
  const dir = mkdtempSync(join(tmpdir(), `shim-cli-${side}-`));
  mkdirSync(join(dir, projectDir, "target"), { recursive: true });
  writeFileSync(join(dir, projectDir, "dbt_project.yml"), "name: analytics\n");
  writeFileSync(join(dir, projectDir, "target/manifest.json"), JSON.stringify({ nodes: manifestNodes }));
  mkdirSync(join(dir, ".agents"), { recursive: true });
  writeFileSync(join(dir, ".agents/workspace.json"), JSON.stringify(workspace));
  const result = spawnSync(process.execPath, [
    join(SIDES[side], "dist/cli.js"),
    "--git-root", dir,
    "--manifest", join(dir, projectDir, "target/manifest.json"),
    "--workspace-json", join(dir, ".agents/workspace.json"),
  ], { encoding: "utf8" });
  rmSync(dir, { recursive: true, force: true });
  return { status: result.status, out: `${result.stdout}${result.stderr}` };
}

const nodes = {
  "model.a.customers": { resource_type: "model", unique_id: "model.a.customers", original_file_path: "models/customers.sql" },
};
const nestedGenerated = { generated: { fileIndex: { "analytics/models/customers.sql": {} } } };
const legacyTopLevel  = { fileIndex: { "analytics/models/customers.sql": {} } };
const noMatch         = { generated: { fileIndex: { "totally/other/path.sql": {} } } };

for (const [label, workspace, expectStatus, expectPattern] of [
  ["generated.fileIndex joins and exits 0", nestedGenerated, 0, /1\/1 models matched/],
  ["legacy top-level fileIndex fallback still supported", legacyTopLevel, 0, /1\/1 models matched/],
  ["ZERO-JOIN exits non-zero (the silent failure HAC-75 surfaces)", noMatch, 1, /0\/1 models matched/],
]) {
  for (const side of ["old", "new"]) {
    const r = runCli(side, { workspace, manifestNodes: nodes });
    check(`[${side}] ${label}`, r.status === expectStatus && expectPattern.test(r.out),
      `status=${r.status} (expected ${expectStatus})\n          ${r.out.split("\n").slice(0, 3).join("\n          ")}`);
  }
}

// dbt project outside the git root must refuse rather than emit bogus keys
for (const side of ["old", "new"]) {
  const dir = mkdtempSync(join(tmpdir(), `shim-outside-${side}-`));
  const outside = mkdtempSync(join(tmpdir(), `shim-elsewhere-${side}-`));
  mkdirSync(join(outside, "target"), { recursive: true });
  writeFileSync(join(outside, "target/manifest.json"), JSON.stringify({ nodes }));
  mkdirSync(join(dir, ".agents"), { recursive: true });
  writeFileSync(join(dir, ".agents/workspace.json"), JSON.stringify(nestedGenerated));
  const r = spawnSync(process.execPath, [
    join(SIDES[side], "dist/cli.js"),
    "--git-root", dir, "--manifest", join(outside, "target/manifest.json"),
    "--workspace-json", join(dir, ".agents/workspace.json"),
  ], { encoding: "utf8" });
  check(`[${side}] PERTURBED: dbt project outside git root refuses with exit 2`,
    r.status === 2 && /is not inside git root/.test(`${r.stdout}${r.stderr}`),
    `status=${r.status}`);
  rmSync(dir, { recursive: true, force: true }); rmSync(outside, { recursive: true, force: true });
}

rmSync(repo, { recursive: true, force: true });

console.log("\n==============================================================");
console.log(` RESULT: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
if (fail) console.log(` FAILED: ${failures.join(", ")}`);
console.log("==============================================================");
process.exit(fail ? 1 : 0);
