#!/usr/bin/env node

// Red tests for scripts/check-architecture.mjs (META-165).
//
// A guard that has only ever been observed exiting 0 is not evidence. Each case
// below copies the repository into a scratch directory, introduces exactly one
// deliberate violation, and asserts the guard REJECTS it. The final case asserts
// the unmodified repository passes, so a guard that fails everything cannot
// masquerade as working.

import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const guard = join(repoRoot, "scripts", "check-architecture.mjs");

const cases = [
  {
    name: "clean-room: @marcelle-labs import",
    expect: "clean-room",
    mutate: (root) => write(join(root, "packages/agents-audit-compat/src/violation.ts"),
      `import { thing } from '@marcelle-labs/private-core';\nexport const x = thing;\n`),
  },
  {
    name: "clean-room: private Vreko source import",
    expect: "clean-room",
    mutate: (root) => write(join(root, "packages/cli/src/violation.ts"),
      `import { internal } from '../../../vreko/src/internal.js';\nexport const y = internal;\n`),
  },
  {
    name: "clean-room: workspace.vreko.json assumption",
    expect: "clean-room",
    mutate: (root) => write(join(root, "packages/agents-audit-compat/src/violation.ts"),
      `export const sidecar = '.agents/workspace.vreko.json';\n`),
  },
  {
    // The review policy names the forbidden scopes because the rule is
    // unenforceable without them, so .greptile/config.json and
    // .greptile/rules.md are in SELF_REFERENTIAL. This asserts the exemption is
    // by exact path and did not become a directory-wide hole: any OTHER file
    // under .greptile/ is still scanned. Without this case, "two files are
    // exempt" and "the directory is exempt" are indistinguishable from a green
    // run — the cannot-ever-fail direction of the same check.
    name: "clean-room: .greptile exemption is per-file, not directory-wide",
    expect: "clean-room",
    mutate: (root) => write(join(root, ".greptile/notes.md"),
      `Scratch notes that reference @marcelle-labs/private-core.\n`),
  },
  {
    name: "copied-schema: normative schema copied into the CLI repo",
    expect: "copied-schema",
    mutate: (root) => write(join(root, "packages/agents-audit-compat/schema/v1.json"), JSON.stringify({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://workspacejson.dev/schema/v1.json",
      title: "workspace.json",
      type: "object",
      required: ["manual", "generated"],
      properties: { manual: { type: "object" }, generated: { type: "object" } },
    }, null, 2)),
  },
  {
    name: "shadowed-standard-types: ambient re-declaration of @workspacejson/spec",
    expect: "shadowed-standard-types",
    mutate: (root) => write(join(root, "types/ambient.d.ts"),
      readFileSync(join(root, "types/ambient.d.ts"), "utf8")
      + `\ndeclare module '@workspacejson/spec' {\n  export const version: string;\n}\n`),
  },
  {
    name: "shadowed-standard-types: ambient re-declaration of @workspacejson/rules",
    expect: "shadowed-standard-types",
    mutate: (root) => write(join(root, "types/rogue.d.ts"),
      `declare module "@workspacejson/rules" {\n  export type Finding = unknown;\n}\n`),
  },
  {
    name: "neutral-producer-purity: DataHub logic inside the neutral producer",
    expect: "neutral-producer-purity",
    mutate: (root) => write(join(root, "packages/cli/src/producer/datahub.ts"),
      `export function joinDataHubUrn(urn: string): string {\n  return urn;\n}\n`),
  },
  {
    name: "neutral-producer-purity: dbt logic inside the neutral producer",
    expect: "neutral-producer-purity",
    mutate: (root) => write(join(root, "packages/cli/src/producer/dbt.ts"),
      `export const MANIFEST = "dbt_project.yml";\n`),
  },
  {
    name: "neutral-producer-purity: vendor content inside the neutral producer",
    expect: "neutral-producer-purity",
    mutate: (root) => write(join(root, "packages/cli/src/producer/upsell.ts"),
      `export const PROMO = "Vreko generates it automatically";\n`),
  },
  {
    name: "local-dependency: workspace link to a package this repo does not define",
    expect: "local-dependency",
    mutate: (root) => patchJson(join(root, "packages/cli/package.json"), (m) => {
      m.dependencies["@workspacejson/rules"] = "workspace:*";
    }),
  },
  {
    name: "repository-boundary: host-integration code in the CLI repo",
    expect: "repository-boundary",
    mutate: (root) => write(join(root, "packages/mcp/index.ts"), `export const server = {};\n`),
  },
  {
    name: "repository-boundary: standard package redefined here",
    expect: "repository-boundary",
    mutate: (root) => write(join(root, "packages/spec/package.json"),
      JSON.stringify({ name: "@workspacejson/spec", version: "0.4.4" }, null, 2)),
  },
  {
    name: "local-dependency: committed sibling-checkout path",
    expect: "local-dependency",
    mutate: (root) => patchJson(join(root, "packages/agents-audit-compat/package.json"), (m) => {
      m.dependencies["@workspacejson/spec"] = "file:../../../standard/packages/spec";
    }),
  },
  {
    name: "local-dependency: workspace link in a published package",
    expect: "local-dependency",
    mutate: (root) => patchJson(join(root, "packages/agents-audit-compat/package.json"), (m) => {
      m.dependencies["@workspacejson/rules"] = "workspace:*";
    }),
  },
  {
    name: "unpinned-standard-dependency: floating range on a standard package",
    expect: "unpinned-standard-dependency",
    mutate: (root) => patchJson(join(root, "packages/agents-audit-compat/package.json"), (m) => {
      m.dependencies["@workspacejson/spec"] = "^0.4.4";
    }),
  },
  {
    // META-248: the adapter was extracted to workspacejson/datahub-agent. The
    // old red test mutated its manifest, which no longer exists. What must stay
    // red is its RETURN — re-creating the package here in any form.
    name: "repository-boundary: the extracted DataHub adapter package is re-added",
    expect: "repository-boundary",
    mutate: (root) => write(join(root, "packages/datahub-adapter/package.json"),
      `${JSON.stringify({ name: "@workspacejson/datahub-adapter", version: "0.0.1", private: true }, null, 2)}\n`),
  },
  {
    // Private:true is not a defence once the package is gone — the boundary is.
    // A "helpfully" public re-add must be just as red as a private one.
    name: "repository-boundary: the extracted DataHub adapter returns as a public package",
    expect: "repository-boundary",
    mutate: (root) => write(join(root, "packages/datahub-adapter/package.json"),
      `${JSON.stringify({ name: "@workspacejson/datahub-adapter", version: "0.0.1" }, null, 2)}\n`),
  },
  {
    name: "foreign-publish: release workflow publishing a standard-owned package",
    expect: "foreign-publish",
    mutate: (root) => write(join(root, ".github/workflows/rogue.yml"),
      `name: Rogue\non: workflow_dispatch\njobs:\n  publish:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm publish --workspace @workspacejson/spec\n`),
  },
  {
    name: "repository-boundary: workflow publishing the extracted DataHub adapter",
    expect: "repository-boundary",
    mutate: (root) => write(join(root, ".github/workflows/rogue.yml"),
      `name: Rogue\non: workflow_dispatch\njobs:\n  publish:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm publish --workspace @workspacejson/datahub-adapter\n`),
  },
];

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf8");
}

function patchJson(path, mutate) {
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  mutate(manifest);
  writeFileSync(path, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

function runGuard(root) {
  return spawnSync(process.execPath, [guard], {
    encoding: "utf8",
    env: { ...process.env, WORKSPACEJSON_CHECK_ROOT: root },
  });
}

function scratchCopy() {
  const directory = mkdtempSync(join(tmpdir(), "wsj-arch-red-"));
  const root = join(directory, "repo");
  cpSync(repoRoot, root, {
    recursive: true,
    filter: (source) => !/(^|\/)(\.git|node_modules|dist|coverage)(\/|$)/.test(source),
  });
  return { directory, root };
}

let passed = 0;
let failed = 0;

// Baseline: the unmodified repository must PASS, otherwise every red result
// below would be meaningless.
{
  const { directory, root } = scratchCopy();
  try {
    const result = runGuard(root);
    if (result.status === 0) {
      console.log("PASS  baseline: unmodified repository is accepted");
      passed += 1;
    } else {
      console.error("FAIL  baseline: unmodified repository was REJECTED");
      console.error(result.stdout + result.stderr);
      failed += 1;
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

for (const testCase of cases) {
  const { directory, root } = scratchCopy();
  try {
    testCase.mutate(root);
    const result = runGuard(root);
    const output = `${result.stdout}${result.stderr}`;
    if (result.status !== 0 && output.includes(`[${testCase.expect}]`)) {
      console.log(`PASS  rejected — ${testCase.name}`);
      passed += 1;
    } else if (result.status !== 0) {
      console.error(`FAIL  ${testCase.name}: rejected, but not as [${testCase.expect}]`);
      console.error(output);
      failed += 1;
    } else {
      console.error(`FAIL  ${testCase.name}: guard ACCEPTED a deliberate violation`);
      failed += 1;
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

console.log(`\nArchitecture guard red tests: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
