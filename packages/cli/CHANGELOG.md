# Changelog — `@workspacejson/cli`

## 0.6.2

### Patch Changes

- Enter the `npm-publish` environment in the publish job, so the scoped
  `NPM_TOKEN` is actually in scope. **`0.6.1` was tagged but never published**;
  this is the same release with that workflow defect corrected.

  No package, mining, retrieval, provenance or artifact behavior changes. The
  `0.5.0` standard authority migration and the `0.6.1` packaging-boundary repair
  both ship here unchanged.

  **What stopped `0.6.1`.** The publish run cleared every gate — guards, build,
  typecheck, tests, and the tarball verification that stopped `0.6.0` — then
  failed on the credential check with both variables empty:

  ```
  NODE_AUTH_TOKEN:
  NPM_TOKEN:
  ```

  `NPM_TOKEN` is stored as an **environment** secret on the `npm-publish`
  environment, and this repository holds no repository-level `NPM_TOKEN` at all.
  GitHub exposes an environment secret only to a job that explicitly declares
  `environment:`. The `publish` job never did, so `${{ secrets.NPM_TOKEN }}`
  resolved to the empty string and the guard reported a missing credential on a
  repository whose credential was correctly configured the whole time.

  `publish` is the job id; `npm-publish` is the environment. Nothing in the run
  output made that distinction visible, which is most of why it read as a token
  problem.

  **The fix is one line of behavior.** The job now declares
  `environment: npm-publish`, and takes `name: npm-publish` so the Actions UI
  labels it with the same word as the scope it needs. The workflow header, which
  said "Required repository secret", now names the environment secret it actually
  requires and records why the token is scoped that way — an environment is the
  reviewer-gateable boundary the standard's own releases publish behind, so
  widening the token to the repository would have been the wrong repair.

  **Why the tag moved rather than the run being re-run.** A re-run replays the
  workflow as it existed at the tagged commit, and `cli-v0.6.1` points at a commit
  whose workflow has no `environment:` line. Re-running it would fail identically.
  The failed tag is left in place: `0.6.0` and `0.6.1` each record a real defect
  that a gate caught before anything reached the registry.

## 0.6.1

### Patch Changes

- Repair the release boundary so a private workspace package cannot reach the
  published manifest. **`0.6.0` was tagged but never published**; this is the same
  release with the packaging defect that stopped it corrected.

  No mining, retrieval, provenance or artifact semantics change. The `0.5.0`
  standard authority migration that `0.6.0` carried is unchanged and ships here.

  **What stopped `0.6.0`.** `publish-cli.yml` failed at the tarball gate, two
  steps before `npm publish`, with:

  ```
  package.devDependencies.@workspacejson/mining-core leaks "workspace:*" into the packed manifest.
  ```

  `@workspacejson/mining-core` is private and unpublished. The CLI declared it as
  a `workspace:*` devDependency under META-297, which broke the invariant
  `publish-cli.yml` relied on to publish with npm. The last release predates that
  commit, so this was the first publish attempt since the invariant became false.
  **It was not caused by the standard authority migration**, which only touched
  `dependencies` and `version`.

  **Why the gate had not caught it earlier.** The verifier chose its packer from
  `npm_execpath`, so `pnpm run release:verify-packs` packed with pnpm while CI
  packed with npm — the same commit verifying green locally and red in CI, with
  the green run measuring bytes nobody publishes. The packer is now `npm`
  unconditionally, because that is what `npm publish` ships. `WORKSPACEJSON_PACKER=pnpm`
  remains as an explicit diagnostic mode.

  **The invariant was also the wrong shape.** It tested for the literal
  `workspace:` string, which is syntactic and packer-dependent:

  ```
  npm  pack → "@workspacejson/mining-core": "workspace:*"   ← caught
  pnpm pack → "@workspacejson/mining-core": "0.0.0"         ← waved through
  ```

  `0.0.0` is a dangling reference to a package that exists nowhere, wearing a
  version that reads as legitimate. Switching packers would have published it with
  a green gate. The invariant is now identity-based and packer-independent:

  > a public package's packed manifest must not reference a private workspace
  > package at all, under any spelling.

  Private packages are discovered by name from the workspace, so the rule needs no
  maintenance when one is added and cannot be evaded by a version rewrite.

  **The build relationship is unchanged.** `mining-core` is still compiled into
  `dist/` by tsup; only its declaration moved to the private root workspace, where
  repository build infrastructure belongs. Because that removed the dependency
  edge pnpm used to order `pnpm -r build`, the CLI's own build script now builds
  its bundle input first — the guarantee travels with the package that needs it,
  rather than depending on how the build was invoked.

## 0.6.0

### Minor Changes

- Move the producer's standard authority to the canonical `workspacejson/standard`
  release: `@workspacejson/spec` and `@workspacejson/rules` `0.4.4` -> `0.5.0`.

  This is an authority-migration release. No capability, mining, ranking,
  provenance or command-surface changes ship with it.

  **Why the packages moved, not just the versions.** `0.4.4` of both packages was
  published from `workspace-json/agents-audit`; `0.5.0` is published from
  `workspacejson/standard`. The dependency edge, not only the version range, now
  points at the canonical publisher.

  **Why this is a minor rather than a patch.** Nothing in this package's own API
  changed. But `dist/index.d.ts` carries `WorkspaceJsonV4` in an exported
  signature (`GenerateResult.content`, `writeWorkspaceAtomically`), so `spec`'s
  `0.5.0` source-level break propagates to anyone consuming those types.
  `CoChangeEntry` is now a union whose members declare the other form's field as
  `?: never`, so reading `entry.rate` off it without narrowing stops compiling:

  ```ts
  const r: number = result.content.generated.coChange[0].rate; // was fine, now a type error
  ```

  `@workspacejson/spec` and `@workspacejson/rules` classified that propagation as a
  minor for exactly this reason, and this package inherits it rather than hiding
  it behind a patch.

  **Artifact output is unchanged.** Every `.agents/workspace.json` this producer
  emits is byte-identical to the one the previously pinned build emits, modulo the
  `generatedAt` and `hygiene.scannedAt` timestamps. That was verified by running
  the pinned build and this one over the same inputs and diffing the normalized
  artifacts; the frozen-source parity harness for the `agents-audit` bridge also
  reports its ratified baseline of four expected differences, unchanged.

  **`agents-audit` deliberately stays on `0.4.4`.** The compatibility bridge is
  frozen and locked for judging (OWNERSHIP.md), is not published from this
  repository, and its published artifact declares no dependency on this package.
  Moving its pins would put a frozen, parity-gated surface at risk for no benefit,
  so the two packages now resolve different versions of the standard on purpose.

  **One guarded behavior change, currently unreachable.** `computeHygieneScore`
  returns `HygieneScore | null` as of `rules@0.5.0`, returning `null` when a scan
  observed nothing. Where that happens the producer now omits `generated.hygiene`
  entirely — the field is not in the schema's `generated.required` set, and
  absence is the only truthful option, since every placeholder value is a
  measurement claim that was not made. This path is not reachable through the
  current producer: its rule set emits at least one finding for every input tried,
  including an empty repository, so `computeHygieneScore` never receives the empty
  array that produces `null`. The handling is in place because the type demands
  it, not because output changed.

## 0.5.2

### Patch Changes

- **Fixed:** the package README told readers the package was not published.

  `README.md` is listed in `files`, so it ships in the tarball and renders on the
  npm package page. It still carried the pre-release notice — "Not yet published.
  This package is not on npm… Do not document `npm install @workspacejson/cli` as
  if it works" — which meant the page for a published package advised against
  installing it and pointed at `agents-audit` instead.

  Replaced with real install instructions, a note that releases carry npm
  provenance, and a migration table for anyone arriving from `agents-audit`: the
  binary is renamed, there is no `scan`, and `.agentsauditrc` is not read.

  Documentation only; no code change.

## 0.5.1

### Patch Changes

- **Fixed:** `workspacejson --help` and `workspacejson --version` exited `1`
  instead of `0`.

  The CLI uses commander's `.exitOverride()`, which throws rather than exiting —
  including on the success paths, where `--help` and `--version` raise a
  `CommanderError` carrying `exitCode: 0`. The handler read that with
  `Number(error.exitCode) || 1`, and `0 || 1` is `1`, so both commands reported
  failure to every shell, script and CI job that checked their status. The output
  was always correct; only the exit code was wrong.

  Inherited from `agents-audit`, where the same expression is present and, since
  that package is frozen at `0.4.4`, will remain. Regression tests assert the exit
  code for `--help`, `--version` and the `version` subcommand, plus a guard that an
  unknown option still exits non-zero — verified red against the pre-fix source.

## [0.5.0] - 2026-07-27

First release under the `workspacejson` name, and the continuation of
`agents-audit`'s version line. That package is frozen at `0.4.4` — locked for
hackathon judging — and all forward development happens here, so the numbering
carries over rather than restarting.

**Why `0.5.0` and not `0.4.5`.** Measured against `agents-audit@0.4.4`, this
binary _removes_ surface: there is no `scan` command, no config file (see
Notes), and the binary itself is renamed from `agents-audit` to `workspacejson`.
A patch bump would promise a drop-in successor, and the first thing a migrating
user would hit is a missing command. Under 0.x, breaking changes go in the minor
slot.

Migrating from `agents-audit@0.4.4`:

| Before                      | After                                       |
| --------------------------- | ------------------------------------------- |
| `npx agents-audit generate` | `npx workspacejson generate`                |
| `npx agents-audit scan`     | no equivalent — the producer does not audit |
| `.agentsauditrc`            | not read (see Notes)                        |

### Changed

- **The emitted profile is now v0.4, and `generated.conventions` is populated
  again (META-203).** `a3fa85a` removed the conventions expression and hardcoded
  `specVersion: '0.3'` — correct for v0.3, but the spec moved to v0.4 and the
  producer was never rewired. Conventions are detected by
  `@workspacejson/rules` and emitted as `{ raw, type, canonical }`, ordered by
  source line so the output is deterministic. v0.4 is a strict superset of v0.3,
  so this is additive; `coChange` and `fragility` remain unemitted and are
  optional in v0.4.

### Added

- Initial package: the neutral workspace.json producer, binary `workspacejson`.
  Created in META-247 from the implementation ratified in META-236.
- `src/producer/` — deterministic generation, repository scanning,
  reconciliation, manual-evidence preservation, atomic writes and drift
  detection. Harvested from `agents-audit`'s `generate.ts`, which had no
  dependency on the audit product and moved wholesale.
- `src/commands/` — public command routing. `agents-audit` invokes the same
  `runGenerate` implementation, so the two binaries cannot drift apart during
  the compatibility window.
- `generateWorkspaceJson` accepts a caller-supplied `producer` identity, written
  to `generated.by`. It defaults to this package; `agents-audit` passes its
  historical identity so its artifacts remain byte-identical. `generated.by` is
  excluded from the material projection, so this never affects drift detection.
- `generateWorkspaceJson` accepts a caller-supplied `commandName`, used in
  refusal and remediation messages. Previously these hardcoded `agents-audit`,
  which would have told a `workspacejson` user to run a different tool.

### Notes

- Config-file support is deliberately absent. `agents-audit` reads
  `.agentsauditrc`, an audit-shaped name the neutral producer should not
  inherit; naming a neutral config file is a public-surface decision left to the
  OSS polish work (META-245).
- Contracts come from `workspacejson/standard` as released packages
  (`@workspacejson/spec`, `@workspacejson/rules`), pinned to exact versions.
  This package implements the contract; it does not define it.
