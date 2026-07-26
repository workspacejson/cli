# Contributing

This repository holds the workspace.json **CLI** packages. The specification,
schema and rules live in `workspacejson/standard` and are consumed here as
released packages — do not vendor or edit them here.

## Before You Start

- Read `AGENTS.md` and `OWNERSHIP.md` at the repo root
- Know which package you are changing:
  - `packages/cli/` — `@workspacejson/cli`, the neutral producer (`src/producer/`) and its commands (`src/commands/`)
  - `packages/agents-audit-compat/` — published `agents-audit`, a **frozen** compatibility bridge; do not add features to it
  - `packages/datahub-adapter/` — private DataHub/dbt adapter, staged here pending extraction to `workspacejson/datahub-agent`; do not build on it
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

## Change Expectations

- Update package READMEs when public APIs change
- Update `CHANGELOG.md` for repository-level changes and
  `packages/agents-audit/CHANGELOG.md` for package release notes
- Keep the CLI contract documented in `packages/agents-audit/README.md`
- Add a changeset for anything user-facing in `agents-audit`

## Boundaries enforced in CI

`scripts/check-architecture.mjs` fails the build on:

- imports of `@marcelle-labs/*`, private Vreko source, or `workspace.vreko.json`
- copies of the normative schema (that belongs to `workspacejson/standard`)
- host-integration or site code landing in this repository
- committed `workspace:`, `file:../`, `link:` or sibling-checkout dependencies
- `@workspacejson/cli` losing `private: true`
- any workflow attempting to publish `@workspacejson/spec` or `@workspacejson/rules`

## Reporting Issues

File bugs at [GitHub Issues](https://github.com/workspacejson/cli/issues).
For security vulnerabilities, follow the process in [`SECURITY.md`](./SECURITY.md).
