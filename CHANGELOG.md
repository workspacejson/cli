# Changelog — `workspacejson/cli`

This file records **repository-level** history for the CLI repository. Package
release notes live with their packages:

* [`packages/cli/CHANGELOG.md`](./packages/cli/CHANGELOG.md) — `@workspacejson/cli`
* [`packages/agents-audit-compat/CHANGELOG.md`](./packages/agents-audit-compat/CHANGELOG.md) — `agents-audit`

## [Unreleased]

### Changed

- **Restructured to the ratified neutral architecture (META-236 → META-247).**
  `packages/cli/` is now `@workspacejson/cli`, the neutral producer with binary
  `workspacejson`. `packages/agents-audit/` became
  `packages/agents-audit-compat/`, a frozen compatibility bridge that keeps the
  `agents-audit` package name, binary, commands and all nine public exports and
  delegates generation to the neutral package. The migrated DataHub/dbt adapter
  moved to `packages/datahub-adapter/` and is staged pending extraction to
  `workspacejson/datahub-agent` (META-248) — it is not durable architecture
  here. Compatibility was proven by the parity harnesses; the only behavioral
  difference is the ratified vendor-notice change, recorded in
  `migration/parity-expected-differences.txt`.
- **The CLI now compiles against real standard-owned types (META-244).** A
  handwritten `declare module '@workspacejson/spec'` in `types/ambient.d.ts`
  shadowed the published declarations and hid the entire v0.4 contract —
  `WorkspaceJsonV4`, `validateV4`, `CoChangeEntry`, `FragilityEntry` — from this
  repository's compiler. Removed, with a guard rejecting reintroduction.
- **Parity harnesses are now executable gates, enforced in CI.** They previously
  exited 0 regardless of result. They now fail when the set of differences
  changes in either direction — a new difference, or a ratified one silently
  disappearing.
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
