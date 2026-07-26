# Changelog

> **`agents-audit` is frozen at `0.4.4`.** The published package is locked for
> hackathon judging and this repository does not publish it. All forward
> development moves to `@workspacejson/cli`, which continues this version line
> at `0.5.0`.
>
> The entries under [Unreleased] exist in this working tree but will not ship
> under the `agents-audit` name. Where they changed the shared producer they
> reach users through `@workspacejson/cli`; where they changed this package's own
> `scan` and presenter surface they remain unreleased.

## [Unreleased — will not ship under this package name]

### Patch Changes

- **Changed:** `generate` now emits `specVersion: "0.4"` and populates
  `generated.conventions` (META-203). The conventions emitter had been
  disconnected since `a3fa85a` while the spec moved to v0.4. v0.4 is a strict
  superset of v0.3, so existing readers are unaffected; readers wanting the new
  field should check `generated.specVersion === "0.4"`. `coChange` and
  `fragility` remain unemitted — optional in v0.4. Console output, exit codes,
  manual-evidence preservation and refusal/force behavior are unchanged.
- **Changed:** `scan` no longer prints a vendor notice when `.agents/workspace.json` is missing or stale. It now names the command that actually fixes the problem — `agents-audit generate` — and still reports the same validation errors. Ratified in META-236: vendor promotion never enters the neutral producer, and is removed or made opt-in in this compatibility package. Exit codes are unchanged and `scan --json` output is byte-identical, so nothing consuming machine-readable output is affected. Human-readable `scan` output does change; this is recorded as an intentional difference in `migration/parity-expected-differences.txt` and enforced by the CI parity gate.
- **Added:** `renderMissingArtifactNotice`, the neutral replacement used by `scan`. `renderVrekoUpsell` remains exported and unchanged for API compatibility — it is simply no longer called by the CLI, so callers who want it can still invoke it. This export set is additive; no historical export was removed.
- `generate --check --dry-run` now fires the drift gate (exit 1, "manual evidence is untouched") instead of the dry-run branch silently winning and exiting 0; the JSON projection is still printed under `--dry-run`. Deferred from 0.4.4 (META-157) because it changes exit-code semantics; landed here as its own reviewed change with regression tests watched red against the pre-change CLI.
- `generate` now surfaces `invalidFileMoved` (result data that has existed since 0.4.3 but was never displayed): when a previous `.agents/workspace.json` was invalid and moved aside, the CLI prints where it was relocated to and that its manual evidence could not be recovered.

## [0.4.4] - 2026-07-23

### Patch Changes

- Updated dependencies: `@workspacejson/rules@0.4.4` and `@workspacejson/spec@0.4.4`.

## [0.4.3] - 2026-07-17

### Patch Changes

- Fix the `agents-audit` CLI entry-point guard so it fires when invoked through npm's `.bin` symlink (`npx agents-audit`, `npm exec agents-audit`). The guard previously compared `resolve(process.argv[1])` against the resolved module URL, which never matched through a symlink — every subcommand (`generate`, `scan`) silently no-op'd and exited 0 instead of running. It now compares real paths via `realpathSync`.

  Also hardens `scripts/verify-package-tarball.mjs` for `agents-audit`: after packing and installing the tarball fresh, it now runs `npx agents-audit generate` and asserts `.agents/workspace.json` actually exists and parses, rather than trusting a clean exit code.

- Updated dependencies
  - @workspacejson/rules@0.4.3
  - @workspacejson/spec@0.4.3

## [0.4.2] - 2026-07-17

### Patch Changes

- Ship strict schema-backed validation, producer-safe generation, and package tarball release guards.
- Updated dependencies
  - @workspacejson/spec@0.4.2
  - @workspacejson/rules@0.4.2

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
