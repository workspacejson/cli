# Workspace Notes

- This repository holds two distinct CLI packages. `./packages/agents-audit/` is the published `agents-audit` package and contains the real workspace.json generator (`./packages/agents-audit/src/generate.ts`). `./packages/cli/` is the private `@workspacejson/cli` DataHub/dbt join shim and is not the generator.
- Keep package entry points aligned with `./packages/agents-audit/src/index.ts` and `./packages/cli/src/index.ts`.
- Review changes against `./packages/agents-audit/src/cli.ts` before release.
- `@workspacejson/spec` and `@workspacejson/rules` are consumed as released packages from `workspacejson/standard`; never vendor, copy or workspace-link them here.
- Keep workspace metadata in `./CHANGELOG.md` and `./README.md` current.
- Workspace layout is defined in `./pnpm-workspace.yaml`; repository boundaries are defined in `./OWNERSHIP.md` and enforced by `./scripts/check-architecture.mjs`.
