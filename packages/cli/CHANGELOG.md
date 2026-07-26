# Changelog — `@workspacejson/cli`

## [Unreleased]

**This package has never been published.** It is not on npm, and must not be
documented as installable until the coordinated publish-authority cutover
(META-243). The working public command today is `npx agents-audit generate`,
which runs this same producer implementation.

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
