# Changelog

All notable changes to `agents-audit` are documented here.

## [0.4.1] - 2026-06-02

### Changed
- `generate` now writes to `.agents/workspace.json` (was `.agents/agents.workspace.json`).
- `scan` audit reader checks `.agents/workspace.json` as canonical; falls back to
  `.agents/agents.workspace.json` (old canonical) then `workspace.json` at repo root
  (legacy), emitting a deprecation warning for both fallback paths.
- CLI `generate` command description updated to reflect correct output path.
- Upsell message strings updated from `agents.workspace.json` to `workspace.json`.
- Package description and keywords updated to remove stale filename references.
- `@workspacejson/spec` dependency updated to `0.4.1`.

## [0.3.0] - 2026-05-12

### Changed
- Version bump to align with `@workspacejson/spec@0.3.0` monorepo restructure and
  schema shape change (`manual`, `generated`, `agents`, `health` four-property layout).
- `generate` output and `scan` reader updated to v0.3 schema shape.

## [0.2.1] - 2026-05-10

### Changed

- Prepare the CLI for the canonical `.agents/agents.workspace.json` path while retaining the
  root-path fallback during the v0.x migration window.
- Add an external `@workspacejson/spec` dependency pin in the published package manifest.

## [0.2.0] - 2026-05-08

### Added

- `generate` subcommand: `agents-audit generate [path] [--dry-run]` writes
  `agents.workspace.json` to the repository root from a live scan.
- `scan` output displays `✓ All checks passed` on clean repositories instead of an
  empty findings table.
- Remediation hints from rule findings appear inline below the finding message in the
  terminal table.
- Saved Markdown reports (via `--save`) now print the output path to stdout after writing.

### Changed

- `scan` terminal output and saved reports filter to `FAIL` and `WARN` findings only.
  `PASS`, `SKIP`, `INSUFFICIENT_DATA`, and `PREVIEW` rows are no longer shown.
- Interactive findings navigator receives only `FAIL`/`WARN` findings.
- Score card alignment improved; `D` grade no longer rendered in yellow (now red).
- `.agents/agents.workspace.json` is the canonical workspace file path. `agents.workspace.json`
  remains a read fallback during the v0.x migration window. New files written by `generate`
  go to `.agents/agents.workspace.json`.

### Fixed

- `--fail-on info` incorrectly exited non-zero on clean repositories. The fix applies a
  severity rank map so only findings with a matching `severity` field are counted.
- `tests in a __tests__ directory` convention synonym never matched because the remark
  parser converts `__tests__` to bold text. The parser now uses raw source lines for
  synonym matching.

### Security

- `--config <path>` is validated to be within the repository root before reading; paths
  outside the root fall back to defaults with a warning.
- `reportDir` (from `agents.workspace.json` or `.agentsauditrc`) is verified to be within
  the repository root before any write. A path outside the root throws rather than writing.
- `.agentsauditrc` fields are sanitised before merging: non-array `ignore`, non-string
  `reportDir`, and non-finite numeric thresholds are discarded.
- Config parse errors no longer expose the absolute filesystem path or raw JSON error text.

## [0.1.1] - 2026-05-06

### Changed

- Added npm discoverability keywords.

## [0.1.0] - 2026-05-06

### Added

- Initial release: `agents-audit scan` CLI for AGENTS.md hygiene scoring.
- Validates and displays `agents.workspace.json` when present.
