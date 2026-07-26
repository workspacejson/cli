# Workspace Notes

- This repository holds two packages. `./packages/cli/` is `@workspacejson/cli`, the neutral workspace.json producer — generation lives in `./packages/cli/src/producer/` and command routing in `./packages/cli/src/commands/`. `./packages/agents-audit-compat/` is the published `agents-audit` compatibility package.
- The DataHub/dbt adapter that was staged here was extracted to `workspacejson/datahub-agent` under META-248. Do not re-add DataHub-, dbt- or vendor-specific consumer logic in any form — not as a sibling package, not inside the producer. `scripts/check-architecture.mjs` rejects it and is red-tested. (Its former path is deliberately not written here: `agents-audit` scans this file and resolves referenced paths, so naming a deleted directory fails the repository's own audit.)
- Keep package entry points aligned with `./packages/cli/src/index.ts` and `./packages/agents-audit-compat/src/index.ts`.
- `agents-audit` is a frozen compatibility bridge. Do not add features to it; both binaries route through `./packages/cli/src/commands/generate.ts` so they cannot drift.
- `@workspacejson/spec` and `@workspacejson/rules` are consumed as released packages from `workspacejson/standard`; never vendor, copy or workspace-link them here.
- Keep workspace metadata in `./CHANGELOG.md` and `./README.md` current.
- Workspace layout is defined in `./pnpm-workspace.yaml`; repository boundaries are defined in `./OWNERSHIP.md` and enforced by `./scripts/check-architecture.mjs`.
- Compatibility is gated by the parity harnesses in `./migration/`. Run them before changing anything `agents-audit` exposes.
