# Changelog — `workspacejson/cli`

This file records **repository-level** history for the CLI repository. Package
release notes live with their packages:

* [`packages/agents-audit/CHANGELOG.md`](./packages/agents-audit/CHANGELOG.md) — `agents-audit`

## [Unreleased]

### Changed

- Repository created by history-preserving extraction from
  `workspace-json/agents-audit@e47eb1b8556c4f361db9a78190a2f36b400756e8`
  (META-240). No package was renamed, no public command changed, and no package
  was published as part of the move.
- `@workspacejson/spec` and `@workspacejson/rules` dependencies changed from
  `workspace:*` to the registry-backed pin `0.4.4`. This reproduces the exact
  dependency bytes that `pnpm pack` already wrote into the published
  `agents-audit@0.4.4` tarball, so packed output is unchanged.
- `repository` and `bugs` metadata repointed from `workspace-json/agents-audit`
  to `workspacejson/cli`.
- Release workflow landed **non-authoritative**: it cannot publish and holds no
  npm credential. `workspace-json/agents-audit` remains the sole publisher of
  `agents-audit` until META-243.

## Historical release family

Releases through `0.4.4` were produced from the `workspace-json/agents-audit`
monorepo as a fixed group of `@workspacejson/spec`, `@workspacejson/rules` and
`agents-audit`, tagged `v0.4.x` in that repository. Those tags remain valid
provenance for the pre-migration history and are **not** re-created here; per
META-243 this repository will use package-scoped tags such as
`agents-audit-v0.4.5`.

Historical monorepo changelog:
<https://github.com/workspace-json/agents-audit/blob/e47eb1b8556c4f361db9a78190a2f36b400756e8/CHANGELOG.md>
