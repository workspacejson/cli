#!/usr/bin/env node

// Red tests for scripts/check-published-status.mjs (META-296).
//
// A guard that has only ever been observed exiting 0 is not evidence. Each case
// below copies the repository into a scratch directory, introduces exactly one
// deliberate contradiction, and asserts the guard REJECTS it on the expected
// check. The final case asserts the unmodified repository passes, so a guard
// that fails everything cannot masquerade as working.
//
// The first case is the exact defect META-296 was filed for: the root README
// saying "not yet on npm" while the manifest carries a real version.

import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const guard = join(repoRoot, "scripts", "check-published-status.mjs");

const read = (p) => readFileSync(p, "utf8");
const write = (p, s) => writeFileSync(p, s);

const cases = [
  {
    name: "publish-status-contradiction: table says a publishable package is not on npm",
    expect: "publish-status-contradiction",
    mutate: (root) => {
      const p = join(root, "README.md");
      write(p, read(p).replace(
        /\| `@workspacejson\/cli` \| \*\*Yes — `[\d.]+`\*\* \|/,
        "| `@workspacejson/cli` | **No — not yet on npm** |",
      ));
    },
  },
  {
    name: "version-drift: table version disagrees with the manifest",
    expect: "version-drift",
    mutate: (root) => {
      const p = join(root, "README.md");
      write(p, read(p).replace(
        /(\| `@workspacejson\/cli` \| \*\*Yes — `)[\d.]+(`\*\* \|)/,
        "$19.9.9$2",
      ));
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
    name: "prose-contradiction: 'nothing here is published yet' returns to the README",
    expect: "prose-contradiction",
    mutate: (root) => {
      const p = join(root, "README.md");
      write(p, read(p).replace(/> \*\*Status\.\*\*/, "> **Status: pre-release.** Nothing here is published yet.\n>\n> **Status.**"));
    },
  },
  {
    name: "prose-contradiction: package README claims the neutral producer is not published",
    expect: "prose-contradiction",
    mutate: (root) => {
      const p = join(root, "packages/cli/README.md");
      write(p, `${read(p)}\n\nNote: this package is not published.\n`);
    },
  },
  {
    name: "prose-contradiction: 'Once X is published' presumes it is not",
    expect: "prose-contradiction",
    mutate: (root) => {
      const p = join(root, "README.md");
      write(p, `${read(p)}\n\nOnce \`@workspacejson/cli\` is published, the neutral equivalent is available.\n`);
    },
  },
  {
    name: "packages-table-coverage: a package is dropped from the table",
    expect: "packages-table-coverage",
    mutate: (root) => {
      const p = join(root, "README.md");
      write(p, read(p).split("\n").filter((l) => !l.includes("`agents-audit`") || !l.trim().startsWith("|")).join("\n"));
    },
  },
  {
    name: "private-published-claim: a private package is documented as published",
    expect: "private-published-claim",
    mutate: (root) => {
      const p = join(root, "packages/cli/package.json");
      const manifest = JSON.parse(read(p));
      manifest.private = true;
      write(p, `${JSON.stringify(manifest, null, 2)}\n`);
    },
  },
];

function runGuard(root) {
  return spawnSync(process.execPath, [join(root, "scripts", "check-published-status.mjs")], {
    cwd: root,
    encoding: "utf8",
  });
}

function scratchCopy() {
  const directory = mkdtempSync(join(tmpdir(), "wjson-published-status-"));
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

// Cases that MUST stay legal. A gate that cannot tell publication *status* from
// publication *authority* would force the repository to delete true statements
// about who owns a release — which is the opposite of what META-296 asks for.
const legitimate = [
  {
    name: "authority prose: 'is not published from here' is a true authority claim",
    mutate: (root) => {
      const p = join(root, "README.md");
      write(p, `${read(p)}\n\n\`agents-audit\` is not published from here; \`workspace-json/agents-audit\` remains its registry owner.\n`);
    },
  },
  {
    name: "authority prose: 'is not published by this repository'",
    mutate: (root) => {
      const p = join(root, "README.md");
      write(p, `${read(p)}\n\n\`@workspacejson/spec\` is not published by this repository.\n`);
    },
  },
  {
    name: "frozen-bridge prose: 'gets no new features' is not a status claim",
    mutate: (root) => {
      const p = join(root, "packages/agents-audit-compat/README.md");
      write(p, `${read(p)}\n\nThis package is frozen and gets no new features.\n`);
    },
  },
];

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

console.log(`\nPublished-status guard red tests: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
