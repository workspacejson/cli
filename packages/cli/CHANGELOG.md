# Changelog — `@workspacejson/cli`

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
