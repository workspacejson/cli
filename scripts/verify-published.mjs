#!/usr/bin/env node

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

// Migration note (META-240): in the monorepo this script verified the whole
// fixed group and derived the release version from packages/spec. This
// repository publishes neither of the standard contract packages, so verifying
// them here would assert authority it does not hold — and would pass even if
// this repository's own release had failed. It verifies exactly what this
// repository publishes, and takes its version from the package under release.
//
// Each package is released independently under its own tag namespace, so this
// takes the package name as an argument rather than verifying everything: a
// `cli-v*` release must not be reported green because a previously published
// sibling still installs. With no argument it verifies every publishable
// package, which is only meaningful when their versions genuinely agree.
// The health check runs `version`, not `--help`. Both CLIs use commander's
// `.exitOverride()`, which throws a CommanderError with exitCode 0 on the
// `--help` success path; until the fix landing alongside this, that zero was
// coerced to 1, so `--help` reported failure and this verifier could never pass
// for either package. `version` is a normal action that returns 0, and it proves
// more anyway — it executes the installed entry point and prints the version the
// artifact actually carries, rather than text commander produces before any of
// the package's own code runs.
//
// `agents-audit` is frozen at 0.4.4, so its `--help` keeps the old exit code
// permanently. That alone makes `version` the only check that can work for both.
const RELEASABLE = {
  "@workspacejson/cli": {
    manifest: "../packages/cli/package.json",
    check: ["npx", "--no-install", "workspacejson", "version"],
  },
  "agents-audit": {
    manifest: "../packages/agents-audit-compat/package.json",
    check: ["npx", "--no-install", "agents-audit", "version"],
  },
};

const requested = process.argv.slice(2);
for (const name of requested) {
  if (!(name in RELEASABLE)) {
    console.error(`Unknown package ${JSON.stringify(name)}; expected one of: ${Object.keys(RELEASABLE).join(", ")}`);
    process.exit(1);
  }
}
const selected = requested.length > 0 ? requested : Object.keys(RELEASABLE);

// The version comes from the released package's own manifest, never from a
// sibling's. WORKSPACEJSON_RELEASE_VERSION overrides it so the publish workflow
// can assert the exact version its tag named, rather than whatever the manifest
// happens to say by the time this step runs.
const packages = selected.map((name) => {
  const entry = RELEASABLE[name];
  const version = process.env.WORKSPACEJSON_RELEASE_VERSION
    ?? JSON.parse(readFileSync(new URL(entry.manifest, import.meta.url), "utf8")).version;
  return { name, version, check: entry.check };
});

if (requested.length !== 1 && process.env.WORKSPACEJSON_RELEASE_VERSION) {
  console.error("WORKSPACEJSON_RELEASE_VERSION pins one version and cannot apply to multiple packages; name exactly one package.");
  process.exit(1);
}

// npm registry propagation lags publish by seconds to low minutes. A single
// immediate post-publish check has no way to tell "not actually published"
// apart from "not visible here yet" and fails the Release workflow either
// way — training everyone to ignore red, which is worse than no gate at all.
//
// Measured on the 0.5.0 release (2026-07-27): the version endpoint answered
// almost immediately, but the aggregated packument — which is what `npm install`
// resolves against — took ~4m30s to appear. The previous window summed to 75s,
// so it reported a red failure for a release that had in fact published
// correctly, provenance and all. A first-ever publish is the slow case: there is
// no existing packument to update, so budget for minutes, not seconds.
//
// Linear backoff with a ceiling: 10+20+30+40+50+60+60+60+60 ≈ 6m30s total.
const REGISTRY_PROPAGATION_RETRIES = 10;
const REGISTRY_PROPAGATION_BASE_DELAY_MS = 10_000;
const REGISTRY_PROPAGATION_MAX_DELAY_MS = 60_000;
const isRegistryPropagationLag = (stderr) => /\bE(TARGET|404)\b|No matching version found/.test(stderr ?? "");

for (const pkg of packages) {
  const directory = mkdtempSync(join(tmpdir(), "workspacejson-registry-"));
  try {
    writeFileSync(join(directory, "package.json"), JSON.stringify({ private: true, type: "module" }));
    await installWithRetry(pkg, directory);
    run(pkg.check[0], pkg.check.slice(1), directory);
    console.log(`Verified registry install and runtime entry point: ${pkg.name}@${pkg.version}`);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

async function installWithRetry(pkg, directory) {
  for (let attempt = 1; attempt <= REGISTRY_PROPAGATION_RETRIES; attempt++) {
    const result = spawnSync("npm", ["install", "--ignore-scripts", "--no-package-lock", `${pkg.name}@${pkg.version}`], {
      cwd: directory,
      encoding: "utf8",
      env: { ...process.env, npm_config_cache: join(directory, ".npm-cache") },
    });
    if (result.status === 0) {
      process.stdout.write(result.stdout);
      return;
    }
    const lastAttempt = attempt === REGISTRY_PROPAGATION_RETRIES;
    if (!isRegistryPropagationLag(result.stderr) || lastAttempt) {
      process.stdout.write(result.stdout);
      process.stderr.write(result.stderr);
      process.exit(result.status ?? 1);
    }
    const delayMs = Math.min(REGISTRY_PROPAGATION_BASE_DELAY_MS * attempt, REGISTRY_PROPAGATION_MAX_DELAY_MS);
    console.log(`${pkg.name}@${pkg.version} not yet visible on the registry (attempt ${attempt}/${REGISTRY_PROPAGATION_RETRIES}) — retrying in ${delayMs}ms`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: { ...process.env, npm_config_cache: join(cwd, ".npm-cache") },
  });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
