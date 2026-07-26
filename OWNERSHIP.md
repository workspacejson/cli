# Ownership — `workspacejson/cli`

Machine-checked by `scripts/check-architecture.mjs`, run in CI with red tests in
`scripts/check-architecture.test.mjs`. This document states the intent; the
script is what enforces it.

## Packages

| Directory | Package | Distribution | Role |
| -- | -- | -- | -- |
| `packages/cli/` | `@workspacejson/cli` | public, **not yet published** | the neutral workspace.json producer and its `workspacejson` binary |
| `packages/agents-audit-compat/` | `agents-audit` | public, published `0.4.4` | frozen compatibility bridge for the historical `agents-audit` command and API |
| `packages/datahub-adapter/` | `@workspacejson/datahub-adapter` | **private, never published** | **migration staging only** — see below |

## Owns

* The neutral producer: deterministic generation, repository scanning,
  reconciliation, manual-evidence preservation, atomic writes, drift detection
  (`packages/cli/src/producer/`)
* Public command routing and CLI UX (`packages/cli/src/commands/`)
* The historical `agents-audit` audit behavior and its compatibility surface
* CLI package distribution and the CLI release workflow

## Consumes

* Released public contracts from `workspacejson/standard`:
  `@workspacejson/spec`, `@workspacejson/rules` — pinned to exact registry
  versions, never workspace links or sibling checkouts

## Must never define

* The normative schema or specification text — `workspacejson/standard`
* MCP, Codex, VS Code or other editor/host integration behavior —
  `workspacejson/integrations`
* Site content as a source of truth — `workspacejson/site`
* **DataHub-specific consumption, joining, orchestration or evaluation** —
  `workspacejson/datahub-agent`
* Private product behavior of any kind

## `packages/datahub-adapter/` is staging, not architecture

This package is **not durable CLI architecture**. It is the DataHub/dbt adapter
migrated intact from the `agents-audit` monorepo, parked here only because
META-240 had to preserve it somewhere while its permanent owner was decided.

It is a **consumer** adapter — it reads an existing `.agents/workspace.json` and
joins dbt models against `generated.fileIndex`. That is DataHub consumer logic,
not neutral producer logic, and it belongs to `workspacejson/datahub-agent`.

Until it is extracted:

* it stays `private: true` and is never published;
* the neutral CLI **must not depend on it** — the dependency direction is
  one-way and the guard enforces it;
* it is not polished, documented or advertised as a CLI-owned package;
* it does not appear in the durable CLI package map.

Its 35/35 parity harness (`migration/parity-datahub-shim.mjs`) travels with it
and must pass against the DataHub-owned candidate after extraction.

**Do not confuse this adapter with a hypothetical `workspacejson signals
datahub` producer surface.** They run in opposite directions: this adapter
consumes the artifact; a signals surface would produce DataHub-specific
evidence. No such producer surface is admitted, and none may be added without an
explicit ADR-002 Gate A ruling.

## Dependency direction

```text
workspacejson/standard
        ↓
workspacejson/cli ──→ agents-audit (compat)
        ↑
        │  (consumes released contracts and the public CLI interface)
workspacejson/integrations      workspacejson/datahub-agent
        \                              /
              workspacejson/site
```

Within this repository: `agents-audit` depends on `@workspacejson/cli`. Never
the reverse. `@workspacejson/datahub-adapter` depends on neither.

## Clean-room boundary

No code here may import, copy, require or assume:

```text
@marcelle-labs/*
private Vreko source
workspace.vreko.json
```

Additionally, `packages/cli/` must contain **no** vendor- or host-specific
content at all — no DataHub, dbt or Vreko logic, by filename or by content.
Guard: `neutral-producer-purity`.

## Publish authority

| Package | Publishable from here | Current authority |
| -- | -- | -- |
| `agents-audit` | metadata says yes; **workflow disabled** | `workspace-json/agents-audit` until META-243 |
| `@workspacejson/cli` | metadata says yes; **workflow disabled, never published** | none yet — META-243 |
| `@workspacejson/datahub-adapter` | **No** — private, and leaving this repository | none |
| `@workspacejson/spec`, `@workspacejson/rules` | **Never** — not owned here | `workspacejson/standard` |

This repository holds no publish-capable secret.

## Migration source and provenance

Extracted from `workspace-json/agents-audit@e47eb1b8556c4f361db9a78190a2f36b400756e8`
on 2026-07-26 under META-240; restructured to the ratified architecture under
META-247. See [`migration/PROVENANCE.md`](./migration/PROVENANCE.md).
