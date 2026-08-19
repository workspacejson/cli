#!/usr/bin/env node

// Red tests for scripts/verify-package-tarball.mjs (META-297).
//
// These exist because this guard shipped a green verdict over an invalid
// release. `@workspacejson/cli@0.6.0` was tagged, and its publish run failed at
// this gate with a private workspace package in the packed manifest. The gate
// was correct; what was missing was proof that it stays correct under the OTHER
// packer, where the same defect wears a different spelling.
//
// Two properties are asserted here, and neither was covered before:
//
//   1. The invariant is about IDENTITY, not syntax. `@workspacejson/mining-core`
//      is private and unpublished. Packed with npm it appears as
//      `"workspace:*"`; packed with pnpm the same broken reference is rewritten
//      to `"0.0.0"`, which looks like an ordinary version. A syntactic
//      `workspace:` check passes the second one. The guard must reject both.
//
//   2. The packer is DETERMINISTIC. It used to be inferred from `npm_execpath`,
//      so `pnpm run release:verify-packs` packed with pnpm while CI's
//      `pnpm --filter ... exec ...` packed with npm — the same commit verifying
//      green locally and red in CI, with the green run measuring bytes nobody
//      publishes. Release verification must always measure npm, because
//      `publish-cli.yml` publishes with `npm publish`.

import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const read = (p) => readFileSync(p, "utf8");
const write = (p, s) => writeFileSync(p, s);

// The exact defect that failed the 0.6.0 publish: the public CLI declaring the
// private mining core. Reintroduced deliberately so the guard is measured
// against the real thing rather than a synthetic stand-in.
function declarePrivateWorkspaceDependency(spelling) {
  return (root) => {
    const p = join(root, "packages/cli/package.json");
    const manifest = JSON.parse(read(p));
    manifest.devDependencies = {
      ...manifest.devDependencies,
      "@workspacejson/mining-core": spelling,
    };
    write(p, `${JSON.stringify(manifest, null, 2)}\n`);
  };
}

// The two spellings the same defect wears. `workspace:*` is what a developer
// writes and what npm packs verbatim; `0.0.0` is what pnpm rewrites it into,
// taken from the private package's own manifest. Asserting both is the point:
// the guard must key on the NAME, because only one of these looks wrong.
const WORKSPACE_PROTOCOL = "workspace:*";
const PNPM_REWRITTEN = "0.0.0";

const cases = [
  {
    name: "private-package/npm: workspace:* is rejected on the release path",
    mutate: declarePrivateWorkspaceDependency(WORKSPACE_PROTOCOL),
    env: {},
    expect: ["is a PRIVATE workspace package", "npm preserves the workspace: protocol verbatim"],
  },
  {
    // The case that motivated the redesign. This is the manifest pnpm produces
    // from `workspace:*`, packed by pnpm, and it is the shape a syntactic
    // `workspace:` check waves through. Declared already-rewritten so the case
    // needs no installed workspace for pnpm to resolve against.
    name: "private-package/pnpm: the 0.0.0 rewrite cannot disguise it either",
    mutate: declarePrivateWorkspaceDependency(PNPM_REWRITTEN),
    env: { WORKSPACEJSON_PACKER: "pnpm" },
    expect: ["is a PRIVATE workspace package", "a version string is therefore not evidence the package is published"],
  },
  {
    // Spelling-independence on the packer that actually publishes: a concrete
    // version buys no amnesty either.
    name: "private-package/npm: a concrete version is rejected just as workspace:* is",
    mutate: declarePrivateWorkspaceDependency(PNPM_REWRITTEN),
    env: {},
    expect: ["is a PRIVATE workspace package"],
  },
  {
    // Regression guard for the packer-selection defect itself. Under the old
    // inference this environment produced a pnpm pack; it must now still pack
    // with npm, which the npm-specific wording proves.
    name: "packer determinism: npm_execpath pointing at pnpm no longer changes the packer",
    mutate: declarePrivateWorkspaceDependency(WORKSPACE_PROTOCOL),
    env: { npm_execpath: "/opt/homebrew/lib/node_modules/pnpm/bin/pnpm.cjs" },
    expect: ["npm preserves the workspace: protocol verbatim"],
  },
];

function runVerifier(root, env) {
  return spawnSync(process.execPath, [join(root, "scripts", "verify-package-tarball.mjs")], {
    cwd: join(root, "packages", "cli"),
    encoding: "utf8",
    env: { ...process.env, WORKSPACEJSON_PACKER: undefined, npm_execpath: undefined, ...env },
  });
}

function scratchCopy() {
  const directory = mkdtempSync(join(tmpdir(), "wjson-pack-guard-"));
  const root = join(directory, "repo");
  cpSync(repoRoot, root, {
    recursive: true,
    filter: (src) => !src.includes("/node_modules") && !src.includes("/.git/") && !src.endsWith("/.git"),
  });
  return { directory, root };
}

let passed = 0;
let failed = 0;

for (const testCase of cases) {
  const { directory, root } = scratchCopy();
  try {
    testCase.mutate(root);
    const result = runVerifier(root, testCase.env);
    const output = `${result.stdout}${result.stderr}`;
    const missing = testCase.expect.filter((fragment) => !output.includes(fragment));
    if (result.status !== 0 && missing.length === 0) {
      console.log(`PASS  rejected — ${testCase.name}`);
      passed += 1;
    } else if (result.status !== 0) {
      console.error(`FAIL  ${testCase.name}: rejected, but the reason did not mention ${JSON.stringify(missing)}`);
      console.error(output);
      failed += 1;
    } else {
      console.error(`FAIL  ${testCase.name}: guard ACCEPTED a private workspace package in a published manifest`);
      console.error(output);
      failed += 1;
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

// Baseline last: a guard that rejects everything is not a guard. This runs the
// full verification, including the packed-bin smoke install, so it also proves
// the release path is green on the unmodified repository.
{
  const { directory, root } = scratchCopy();
  try {
    const result = runVerifier(root, {});
    const output = `${result.stdout}${result.stderr}`;
    if (result.status === 0 && output.includes("with npm: packed manifest and runtime files are release-safe")) {
      console.log("PASS  accepted — the unmodified repository, packed with npm");
      passed += 1;
    } else {
      console.error("FAIL  the unmodified repository was REJECTED, or did not pack with npm");
      console.error(output);
      failed += 1;
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

console.log(`\nPackage tarball guard red tests: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
