#!/usr/bin/env node

import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const packageDirectory = process.cwd();
const sourceManifest = JSON.parse(readFileSync(join(packageDirectory, "package.json"), "utf8"));
const packageName = sourceManifest.name;
const expectedVersion = sourceManifest.version;
// npm unconditionally, because `publish-cli.yml` publishes with `npm publish`.
// This default used to be inferred from `npm_execpath`, which made the gate's
// verdict depend on HOW it was invoked rather than on what ships: `pnpm run
// release:verify-packs` sets that variable and packed with pnpm, while CI's
// `pnpm --filter ... exec ...` did not and packed with npm. The same commit
// therefore verified green locally and red in CI, and the green one was
// measuring bytes nobody publishes. Release verification must measure the
// packer that actually produces the published artifact.
//
// WORKSPACEJSON_PACKER=pnpm remains available, and has exactly two legitimate
// uses. Neither is "the release default".
//
//   1. Diagnostic. The red tests use it to prove pnpm's `workspace:` rewriting
//      cannot disguise an invalid reference — see verify-package-tarball.test.mjs.
//
//   2. Packages this repository does not publish. `agents-audit` is frozen and
//      no workflow here publishes it (OWNERSHIP.md), and it depends on its
//      sibling `@workspacejson/cli` by `workspace:*`. Verifying it with npm
//      would assert an npm-publishability property it does not claim and that
//      nothing here acts on. It is verified with pnpm instead, which is how CI
//      has always packed it. The packer-independent private-package check below
//      still applies to it in full; only the syntactic `workspace:` check, which
//      is specifically about npm publishability, is satisfied by the rewrite.
//
//      If META-243 ever makes this repository the publisher of `agents-audit`,
//      that sibling reference becomes a real release defect and this override
//      must go with the same reasoning that removed the CLI's.
const packer = process.env.WORKSPACEJSON_PACKER ?? "npm";

if (!["pnpm", "npm"].includes(packer)) {
  throw new Error(`Unsupported packer ${JSON.stringify(packer)}; use pnpm or npm.`);
}

const tarballName = `${packageName.replace(/^@/, "").replaceAll("/", "-")}-${expectedVersion}.tgz`;
const tarballPath = join(packageDirectory, tarballName);
if (existsSync(tarballPath)) {
  throw new Error(`Refusing to overwrite existing tarball ${tarballName}; remove it before verification.`);
}

const packArgs = packer === "npm" ? ["pack", "--ignore-scripts"] : ["pack"];
const packed = spawnSync(packer, packArgs, { cwd: packageDirectory, encoding: "utf8" });
process.stdout.write(packed.stdout);
process.stderr.write(packed.stderr);
if (packed.status !== 0) process.exit(packed.status ?? 1);

try {
  if (!existsSync(tarballPath)) {
    throw new Error(`${packer} pack did not create ${tarballName}.`);
  }

  // META-247: this was previously left as the raw string `tar` returns, so every
  // assertion that indexed into it (`manifest.bin`, `manifest.dependencies`)
  // silently read `undefined` and passed vacuously. Parsing it makes the
  // packed-manifest checks real for the first time.
  const manifest = JSON.parse(tar("-xOf", tarballPath, "package/package.json"));
  // Release evidence, 2026-07-16: this verifier's first run found that archive
  // listings do not guarantee directory entries. Normalize once so every runtime
  // asset assertion checks the archive's contents, not a packer formatting detail.
  const files = new Set(tar("-tzf", tarballPath).trim().split("\n").filter(Boolean).map(normalizeArchivePath));
  // Private-package check FIRST: it is the packer-independent invariant, so a
  // private reference reports as what it actually is rather than as whichever
  // spelling this packer happened to produce.
  assertNoPrivateWorkspacePackages(manifest);
  assertNoWorkspaceProtocol(manifest, "package");
  assertStandardDependenciesArePinned(manifest);
  assertRuntimeFiles(manifest, files);
  if (packageName === "agents-audit" || packageName === "@workspacejson/cli") {
    assertBinGenerates(tarballPath, manifest);
  }
  console.log(`Verified ${basename(tarballPath)} with ${packer}: packed manifest and runtime files are release-safe.`);
} finally {
  rmSync(tarballPath, { force: true });
}

function tar(...args) {
  const result = spawnSync("tar", args, { cwd: packageDirectory, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `tar ${args.join(" ")} failed.`);
  return result.stdout;
}

function assertNoWorkspaceProtocol(value, path) {
  if (typeof value === "string") {
    if (value.startsWith("workspace:")) throw new Error(`${path} leaks ${JSON.stringify(value)} into the packed manifest.`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoWorkspaceProtocol(item, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) assertNoWorkspaceProtocol(item, `${path}.${key}`);
  }
}

// META-297 release-integrity boundary.
//
// `assertNoWorkspaceProtocol` above is SYNTACTIC and packer-dependent: it looks
// for the literal `workspace:` prefix. That is not the invariant that protects a
// consumer, as this repository learned by failing a release on it.
//
// `@workspacejson/mining-core` is private and unpublished, and the CLI declared
// it as a `workspace:*` devDependency. Packed with npm the string survives
// verbatim and the syntactic check catches it. Packed with pnpm the SAME broken
// reference is rewritten to `"0.0.0"` — a plausible-looking version for a
// package that exists nowhere — and the syntactic check waves it through.
// Switching packers would have published a manifest referencing a package no
// consumer can resolve, with a green gate.
//
// So the invariant is not "no `workspace:` string". It is:
//
//   a public package's packed manifest must not reference a private workspace
//   package at all, under any spelling.
//
// That is packer-independent and states the actual release boundary: what is
// private to this repository must not appear in what we hand to the registry.
// Matching is by NAME, discovered from the workspace, so it cannot be evaded by
// a version rewrite and needs no maintenance when a private package is added.
function privateWorkspacePackageNames() {
  const packagesRoot = resolve(packageDirectory, "..");
  const names = new Set();
  for (const entry of readdirSync(packagesRoot)) {
    const manifestPath = join(packagesRoot, entry, "package.json");
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (manifest.private === true && typeof manifest.name === "string") names.add(manifest.name);
  }
  return names;
}

function assertNoPrivateWorkspacePackages(manifest) {
  // A private package is not handed to the registry, so it has no release
  // boundary to protect and may legitimately reference its private siblings.
  if (sourceManifest.private === true) return;
  const privateNames = privateWorkspacePackageNames();
  if (privateNames.size === 0) return;
  for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
    for (const [name, version] of Object.entries(manifest[field] ?? {})) {
      if (!privateNames.has(name)) continue;
      throw new Error(
        `${packageName} packed ${field}.${name}=${JSON.stringify(version)}, but ${name} is a PRIVATE workspace package and is not published. `
        + `A public package's packed manifest must not reference a private workspace package under any spelling — `
        + `${packer === "pnpm" ? "this manifest was packed by pnpm, which rewrites the workspace: protocol to a concrete version — a version string is therefore not evidence the package is published" : "npm preserves the workspace: protocol verbatim, so a private reference survives packing unchanged"}. `
        + `If the code is bundled at build time, declare the package in the private root workspace instead of in this manifest.`,
      );
    }
  }
}

// Migration note (META-240): the monorepo version of this check asserted that
// spec/rules/agents-audit all carried one fixed-group version, because one
// repository released all three. This repository releases only agents-audit and
// consumes the standard packages from the registry, so the invariant that
// actually protects us now is different: standard dependencies must resolve to
// an exact published version. A range would let a consumer install this CLI
// against contract bytes we never tested, and `workspace:`/`file:` would not
// resolve for a consumer at all.
function assertStandardDependenciesArePinned(manifest) {
  const standardOwned = new Set(["@workspacejson/spec", "@workspacejson/rules"]);
  const exactVersion = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?$/;
  for (const field of ["dependencies", "optionalDependencies", "peerDependencies"]) {
    for (const [name, version] of Object.entries(manifest[field] ?? {})) {
      if (!standardOwned.has(name)) continue;
      if (!exactVersion.test(version)) {
        throw new Error(`${packageName} packed ${field}.${name}=${JSON.stringify(version)}; standard-owned dependencies must be pinned to an exact published version, not a range or local link.`);
      }
    }
  }
}

function assertRuntimeFiles(manifest, files) {
  if (![...files].some((file) => file.startsWith("package/dist/"))) {
    throw new Error("Packed tarball is missing dist/.");
  }
  if (packageName === "@workspacejson/spec" && !files.has("package/schema/v1.json")) {
    throw new Error("Packed spec tarball is missing schema/v1.json, required by validate() at runtime.");
  }
  const bins = typeof manifest.bin === "string" ? { [packageName]: manifest.bin } : manifest.bin ?? {};
  for (const target of Object.values(bins)) {
    const normalized = `package/${target.replace(/^\.\//, "")}`;
    if (!files.has(normalized)) throw new Error(`Packed tarball is missing bin target ${normalized}.`);
  }
}

function normalizeArchivePath(file) {
  return file.replace(/^\.\//, "").replaceAll("\\", "/").replace(/\/{2,}/g, "/");
}

// Packs a workspace sibling this tarball depends on, so the smoke install
// resolves the sibling bytes in THIS working tree rather than whatever is on the
// registry. `agents-audit` depends on @workspacejson/cli; originally this
// existed because the CLI was unpublished, but it is load-bearing beyond that.
// The two packages release on independent tags, so at any moment the registry
// may hold a CLI older than the one `agents-audit` was built and tested against.
// Resolving the sibling from disk is what makes this a test of the candidate.
function packUnpublishedSiblings(manifest, destinationDirectory) {
  const packagesRoot = resolve(packageDirectory, "..");
  const tarballs = [];
  for (const dependency of Object.keys(manifest.dependencies ?? {})) {
    for (const entry of readdirSync(packagesRoot)) {
      const siblingManifestPath = join(packagesRoot, entry, "package.json");
      if (!existsSync(siblingManifestPath)) continue;
      const sibling = JSON.parse(readFileSync(siblingManifestPath, "utf8"));
      if (sibling.name !== dependency) continue;
      const siblingTarball = `${sibling.name.replace(/^@/, "").replaceAll("/", "-")}-${sibling.version}.tgz`;
      const packArgs = packer === "npm"
        ? ["pack", "--ignore-scripts", "--pack-destination", destinationDirectory]
        : ["pack", "--pack-destination", destinationDirectory];
      const packed = spawnSync(packer, packArgs, { cwd: join(packagesRoot, entry), encoding: "utf8" });
      process.stdout.write(packed.stdout);
      process.stderr.write(packed.stderr);
      if (packed.status !== 0) throw new Error(`${packer} pack failed for sibling ${sibling.name}.`);
      console.log(`Resolved unpublished workspace sibling ${sibling.name}@${sibling.version} from disk.`);
      tarballs.push(join(destinationDirectory, siblingTarball));
    }
  }
  return tarballs;
}

function assertBinGenerates(tarballPath, manifest) {
  const smokeDirectory = mkdtempSync(join(tmpdir(), "workspacejson-pack-"));
  try {
    writeFileSync(join(smokeDirectory, "package.json"), JSON.stringify({ private: true }));
    // Migration note (META-240): the monorepo version of this smoke test packed
    // `../rules` and `../spec` off disk, because those packages were siblings in
    // the same repository and were not yet on the registry pre-publish. In this
    // repository they are neither siblings nor unpublished — they are released
    // packages owned by workspacejson/standard, and the whole point of the split
    // is that we consume them the way a real consumer does.
    //
    // Default: let npm resolve them from the registry at the exact pinned
    // version in the packed manifest. Pre-publication coordination (META-243)
    // can point WORKSPACEJSON_STANDARD_TARBALLS at a directory of packed
    // standard candidates to test against bytes that are not published yet.
    const candidateTarballs = standardCandidateTarballs();
    const siblingTarballs = packUnpublishedSiblings(manifest, smokeDirectory);
    run("npm", ["install", "--ignore-scripts", "--no-package-lock", ...candidateTarballs, ...siblingTarballs, tarballPath], smokeDirectory);
    const [binName] = Object.keys(manifest.bin ?? {});
    run("npx", ["--no-install", binName, "generate"], smokeDirectory);

    const artifact = join(smokeDirectory, ".agents", "workspace.json");
    if (!existsSync(artifact)) {
      throw new Error(`Packed ${packageName} bin exited without creating .agents/workspace.json.`);
    }
    JSON.parse(readFileSync(artifact, "utf8"));
  } finally {
    rmSync(smokeDirectory, { recursive: true, force: true });
  }
}

function standardCandidateTarballs() {
  const directory = process.env.WORKSPACEJSON_STANDARD_TARBALLS;
  if (!directory) return [];
  if (!existsSync(directory)) {
    throw new Error(`WORKSPACEJSON_STANDARD_TARBALLS=${directory} does not exist.`);
  }
  const tarballs = readdirSync(directory)
    .filter((file) => file.endsWith(".tgz"))
    .map((file) => join(directory, file));
  if (tarballs.length === 0) {
    throw new Error(`WORKSPACEJSON_STANDARD_TARBALLS=${directory} contains no .tgz candidates.`);
  }
  console.log(`Using packed standard candidates from ${directory}: ${tarballs.map((t) => basename(t)).join(", ")}`);
  return tarballs;
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed with exit ${result.status ?? 1}.`);
}
