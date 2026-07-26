# Contributing

This repository holds the workspace.json **CLI** packages. The specification,
schema and rules live in `workspacejson/standard` and are consumed here as
released packages — do not vendor or edit them here.

## Before You Start

- Read `AGENTS.md` and `OWNERSHIP.md` at the repo root
- Know which of the two CLI packages you are changing:
  - `packages/agents-audit/` — published `agents-audit`, contains the real generator
  - `packages/cli/` — private `@workspacejson/cli`, the DataHub/dbt join shim
- Keep changes within the owning package when possible
- Avoid changing package entrypoints unless the public surface changes

## Common Commands

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm run check:architecture
node packages/agents-audit/dist/cli.js scan .
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
