# Ownership — `workspacejson/cli`

Machine-checked by `scripts/check-architecture.mjs`, run in CI. This document
states the intent; the script is what enforces it.

## Owns

* Producer and audit CLI implementation (`packages/agents-audit/`)
* Repository scanning, deterministic generation and reconciliation of
  `.agents/workspace.json`
* Manual-evidence preservation, drift detection and atomic-write behavior
* The DataHub/dbt adapter package (`packages/cli/`)
* CLI package distribution and the CLI release workflow

## Consumes

* Released public contracts from `workspacejson/standard`:
  `@workspacejson/spec`, `@workspacejson/rules` — pinned to registry-backed
  versions, never workspace links or sibling checkouts

## Must never define

* The normative schema or specification text — that is `workspacejson/standard`
* MCP, Codex, VS Code or other editor/host integration behavior — that is
  `workspacejson/integrations`
* Site content as a source of truth — that is `workspacejson/site`
* Private product behavior of any kind

## Dependency direction

```text
workspacejson/standard
        ↓
workspacejson/cli       workspacejson/integrations
        \                    /
              workspacejson/site
```

This repository depends **downstream only**. It must never be imported by
`workspacejson/standard`.

## Clean-room boundary

No code in this repository may import, copy, require or assume:

```text
@marcelle-labs/*
private Vreko source
workspace.vreko.json
```

Proprietary repositories may consume released Apache-2.0 `@workspacejson/*`
packages. The reverse direction is prohibited.

## Publish authority

| Package | Publishable from here | Current authority |
| -- | -- | -- |
| `agents-audit` | Metadata says yes; **workflow disabled** | `workspace-json/agents-audit` until META-243 |
| `@workspacejson/cli` | **No** — `private: true`, must not be published | none (unpublished by design) |
| `@workspacejson/spec` | **Never** — not owned here | `workspacejson/standard` |
| `@workspacejson/rules` | **Never** — not owned here | `workspacejson/standard` |

This repository holds no publish-capable secret. Authority transfer is
META-243's job, not this repository's.

## Migration source and provenance

Extracted from `workspace-json/agents-audit@e47eb1b8556c4f361db9a78190a2f36b400756e8`
on 2026-07-26 under META-240. See [`migration/PROVENANCE.md`](./migration/PROVENANCE.md).
