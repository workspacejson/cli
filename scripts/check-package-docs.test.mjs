#!/usr/bin/env node

// Red tests for scripts/check-package-docs.mjs (META-296).
//
// A guard that has only ever been observed exiting 0 is not evidence. Each case
// below copies the repository into a scratch directory, introduces exactly one
// deliberate contradiction, and asserts the guard REJECTS it on the expected
// check. A baseline case asserts the unmodified repository passes, so a guard
// that fails everything cannot masquerade as working.
//
// The `legitimate` block matters as much as the red block. This gate's arbiter
// is the package manifests — name, version, private state — and NOT the npm
// registry. An earlier revision rejected "not yet on npm" for any non-private
// package, which conflated "publication is permitted" with "publication
// happened" and would have failed a correct repository that simply had not
// published yet. Those cases now assert that such prose stays legal.

import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const read = (p) => readFileSync(p, "utf8");
const write = (p, s) => writeFileSync(p, s);

const cases = [
  {
    // The original META-296 defect. It is caught as a MISSING VERSION CLAIM —
    // the table must document the manifest version — not as an inferred
    // statement about npm, which this gate has no standing to make.
    name: "version-claim-missing: the original defect, a row with no version",
    expect: "version-claim-missing",
    mutate: (root) => {
      const p = join(root, "README.md");
      write(p, read(p).replace(
        /(\| `@workspacejson\/cli` \| )`[\d.]+`( \|)/,
        "$1**No — not yet on npm**$2",
      ));
    },
  },
  {
    name: "version-drift: table version disagrees with the manifest",
    expect: "version-drift",
    mutate: (root) => {
      const p = join(root, "README.md");
      write(p, read(p).replace(/(\| `@workspacejson\/cli` \| `)[\d.]+(` \|)/, "$19.9.9$2"));
    },
  },
  {
    name: "version-drift: manifest bumped without updating the table",
    expect: "version-drift",
    mutate: (root) => {
      const p = join(root, "packages/cli/package.json");
      const manifest = JSON.parse(read(p));
      manifest.version = "0.6.0";
      write(p, `${JSON.stringify(manifest, null, 2)}\n`);
    },
  },
  {
    name: "packages-table-coverage: a package is dropped from the table",
    expect: "packages-table-coverage",
    mutate: (root) => {
      const p = join(root, "README.md");
      write(p, read(p).split("\n")
        .filter((l) => !(l.trim().startsWith("|") && l.includes("`agents-audit`")))
        .join("\n"));
    },
  },
  {
    name: "unknown-package-row: the table documents a package that does not exist",
    expect: "unknown-package-row",
    mutate: (root) => {
      const p = join(root, "README.md");
      write(p, read(p).replace(
        /(\| `agents-audit` \| `[\d.]+` \| [^|]*\|)/,
        "$1\n| [`packages/ghost/`](./packages/ghost/) | `@workspacejson/ghost` | `1.0.0` | does not exist |",
      ));
    },
  },
  {
    name: "private-distribution-claim: a private package reads as publicly distributed",
    expect: "private-distribution-claim",
    mutate: (root) => {
      const p = join(root, "packages/cli/package.json");
      const manifest = JSON.parse(read(p));
      manifest.private = true;
      write(p, `${JSON.stringify(manifest, null, 2)}\n`);
    },
  },
  {
    name: "package-readme-name: a package README heading names the wrong package",
    expect: "package-readme-name",
    mutate: (root) => {
      const p = join(root, "packages/cli/README.md");
      write(p, read(p).replace(/^# .*$/m, "# @workspacejson/something-else"));
    },
  },
];

// Cases that MUST stay legal.
const legitimate = [
  {
    // The core boundary. A manifest cannot establish what is on npm, so a
    // statement that a package is not published is not a contradiction of it.
    name: "registry prose: 'not yet on npm' is not contradicted by a manifest",
    mutate: (root) => {
      const p = join(root, "README.md");
      write(p, `${read(p)}\n\nA future package in this repository is not yet on npm.\n`);
    },
  },
  {
    name: "registry prose: 'nothing here is published yet' is a registry claim, not a manifest claim",
    mutate: (root) => {
      const p = join(root, "README.md");
      write(p, `${read(p)}\n\nAt the time of writing nothing here is published yet.\n`);
    },
  },
  {
    name: "authority prose: 'is not published from here' distinguishes authority from status",
    mutate: (root) => {
      const p = join(root, "README.md");
      write(p, `${read(p)}\n\n\`agents-audit\` is not published from here; \`workspace-json/agents-audit\` remains its registry owner.\n`);
    },
  },
  {
    name: "frozen-bridge prose: 'gets no new features' is not a version claim",
    mutate: (root) => {
      const p = join(root, "packages/agents-audit-compat/README.md");
      write(p, `${read(p)}\n\nThis package is frozen and gets no new features.\n`);
    },
  },
];

function runGuard(root) {
  return spawnSync(process.execPath, [join(root, "scripts", "check-package-docs.mjs")], {
    cwd: root,
    encoding: "utf8",
  });
}

function scratchCopy() {
  const directory = mkdtempSync(join(tmpdir(), "wjson-package-docs-"));
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
      console.error(`FAIL  ${testCase.name}: guard ACCEPTED a deliberate contradiction`);
      failed += 1;
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

for (const testCase of legitimate) {
  const { directory, root } = scratchCopy();
  try {
    testCase.mutate(root);
    const result = runGuard(root);
    if (result.status === 0) {
      console.log(`PASS  accepted — ${testCase.name}`);
      passed += 1;
    } else {
      console.error(`FAIL  ${testCase.name}: guard REJECTED legitimate prose`);
      console.error(`${result.stdout}${result.stderr}`);
      failed += 1;
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

// Baseline last: a guard that rejects everything is not a guard.
{
  const { directory, root } = scratchCopy();
  try {
    const result = runGuard(root);
    if (result.status === 0) {
      console.log("PASS  accepted — the unmodified repository");
      passed += 1;
    } else {
      console.error("FAIL  the unmodified repository was REJECTED");
      console.error(`${result.stdout}${result.stderr}`);
      failed += 1;
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

console.log(`\nPackage documentation guard red tests: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
