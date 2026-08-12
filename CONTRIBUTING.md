# Contributing

This repository holds the workspace.json **CLI** packages. The specification,
schema and rules live in `workspacejson/standard` and are consumed here as
released packages — do not vendor or edit them here.

## Before You Start

- Read `AGENTS.md` and `OWNERSHIP.md` at the repo root
- Know which package you are changing:
  - `packages/cli/` — `@workspacejson/cli`, the neutral producer (`src/producer/`) and its commands (`src/commands/`)
  - `packages/agents-audit-compat/` — published `agents-audit`, a **frozen** compatibility bridge; do not add features to it
  - DataHub, dbt or other vendor-specific consumer logic belongs in `workspacejson/datahub-agent`, not here. The adapter that was staged in `packages/datahub-adapter/` was extracted under META-248, and `scripts/check-architecture.mjs` rejects its return
- Keep changes within the owning package when possible
- Avoid changing package entrypoints unless the public surface changes

## Common Commands

```bash
pnpm install
pnpm build          # must precede typecheck on a clean checkout: agents-audit
pnpm typecheck      # consumes @workspacejson/cli's emitted declarations
pnpm test
pnpm run check:architecture
node scripts/check-architecture.test.mjs
node packages/agents-audit-compat/dist/cli.js scan .
node packages/cli/dist/cli.js generate --check
```

## Parity harnesses — the compatibility gate

`agents-audit` is a frozen compatibility bridge. Anything touching its command
surface, exit codes, output or exports must be measured against the frozen
pre-migration source, not just against the current tests.

```bash
migration/parity-agents-audit-runtime.sh   # command + perturbed behavior parity
migration/parity-agents-audit-pack.sh      # packed-artifact and manifest parity
node migration/parity-datahub-shim.mjs     # DataHub adapter parity
```

They are self-contained. On first run the bash harnesses clone the frozen source
at its recorded SHA, build it, build this repository, and pack both sides; the
clone is cached under `~/.cache/workspacejson/cli-parity/`, so later runs take
seconds. The Node harness reuses that same cache and tells you what to run if it
is missing. The cache deliberately lives outside the repository: the frozen
source contains content the architecture guard rejects, so an in-tree cache
would turn `pnpm check:architecture` red.

Overridable via environment: `WORKSPACEJSON_PARITY_CACHE` for the cache root,
`WORKSPACEJSON_OLD_CHECKOUT` to point at an existing clone,
`WORKSPACEJSON_PARITY_OUT` for the working directory,
`WORKSPACEJSON_SKIP_BUILD=1` to reuse existing builds.

**Expected results today:** runtime `27/29` with two recorded intentional
differences from META-236's vendor-notice ruling, and the DataHub adapter
`35/35`. A third difference means you changed something you should not have —
or you owe it an explicit intentional-difference record.

## Change Expectations

- Update package READMEs when public APIs change
- Update `CHANGELOG.md` for repository-level changes and
  `packages/agents-audit-compat/CHANGELOG.md` for package release notes
- Keep the CLI contract documented in `packages/cli/README.md`
- Re-run the parity harnesses before changing anything `agents-audit` exposes
- Add a changeset for anything user-facing in `agents-audit`

## Boundaries enforced in CI

`scripts/check-architecture.mjs` fails the build on:

- imports of `@marcelle-labs/*`, private Vreko source, or `workspace.vreko.json`
- copies of the normative schema (that belongs to `workspacejson/standard`)
- host-integration or site code landing in this repository
- committed `workspace:`, `file:../`, `link:` or sibling-checkout dependencies
- `@workspacejson/cli` losing `private: true`
- any workflow attempting to publish `@workspacejson/spec` or `@workspacejson/rules`

## Review

[`REVIEW.md`](./REVIEW.md) is the review and merge contract: which checks are
required, why a completed review check is not the same as approval, and why
findings are reconciled one thread at a time.

The semantic rules the automated reviewer applies are repo-owned and live in
[`.greptile/rules.md`](./.greptile/rules.md). They are written from producer
failure classes this repository has actually hit — a refused history refresh
reported as a successful one, a basis pin advanced without recounting, an empty
evidence block emitted for a repository that could not be analyzed. Read them
before touching `packages/cli/src/producer/**` or `packages/mining-core/src/**`.

## Reporting Issues

File bugs at [GitHub Issues](https://github.com/workspacejson/cli/issues).
For security vulnerabilities, follow the process in [`SECURITY.md`](./SECURITY.md).
