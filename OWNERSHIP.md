# Ownership — `workspacejson/cli`

Machine-checked by `scripts/check-architecture.mjs`, run in CI with red tests in
`scripts/check-architecture.test.mjs`. This document states the intent; the
script is what enforces it.

## Packages

| Directory | Package | Distribution | Role |
| -- | -- | -- | -- |
| `packages/cli/` | `@workspacejson/cli` | public, published from here on `cli-v*` tags | the neutral workspace.json producer and its `workspacejson` binary |
| `packages/agents-audit-compat/` | `agents-audit` | public, published `0.4.4` | frozen compatibility bridge for the historical `agents-audit` command and API |

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

## `packages/datahub-adapter/` was extracted — META-248, 2026-07-26

The DataHub/dbt adapter is **gone from this repository**. It was never durable
CLI architecture: it was migrated intact from the `agents-audit` monorepo and
parked here only because META-240 had to preserve it somewhere while its
permanent owner was decided.

It is a **consumer** adapter — it reads an existing `.agents/workspace.json` and
joins dbt models against `generated.fileIndex`. That is DataHub consumer logic,
not neutral producer logic, and it belongs to `workspacejson/datahub-agent`,
which now owns it as an internal module at `src/adapters/workspacejson/`.

Its parity harness travelled with it, as this document required. At the
DataHub-owned candidate it reports **35/35**, plus per-file source identity
against this repository's own frozen pre-migration source
(`workspace-json/agents-audit@e47eb1b8`): four of five files byte-identical,
with one documented type-only deviation. Provenance is recorded in
`docs/provenance.md` there. The `DataHub adapter parity` CI step was removed
here because the artifact it measured is no longer here.

The extraction is machine-enforced, not merely documented:

* `repository-boundary` lists `packages/datahub-adapter` as owned by
  `workspacejson/datahub-agent`, so re-adding the directory fails the check —
  `neutral-producer-purity` alone would not catch it, since that rule only
  scans `packages/cli/`;
* redefining the `@workspacejson/datahub-adapter` package name in any manifest
  fails, whether or not it is marked private;
* a workflow referencing that package name for publication fails.

All three are red-tested in `scripts/check-architecture.test.mjs`.

### One deviation found on extraction, still unfixed here

The adapter typechecked in this repository only because
`packages/datahub-adapter/tsconfig.json` included `types/ambient.d.ts`, which
**shadows `node:fs`** with a hand-written `Dirent`. Against real
`@types/node@22.19.17`, `ReturnType<typeof readdirSync>` selects the Buffer
overload and `findDbtProjects` does not compile (4 errors).

The shadowing pattern is the same class of defect META-244 already fixed once
here for `@workspacejson/spec`. `types/ambient.d.ts` still shadows `node:fs`
for the remaining packages and is worth auditing on the same grounds.

**Do not confuse the extracted adapter with a hypothetical `workspacejson
signals datahub` producer surface.** They run in opposite directions: this adapter
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
the reverse. `workspacejson/datahub-agent` sits downstream of both and consumes
released contracts only — nothing here depends on it.

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
| `@workspacejson/cli` | **Yes** — `.github/workflows/publish-cli.yml`, on `cli-v*.*.*` tags | this repository (META-236 settled the name; no prior authority existed) |
| `@workspacejson/datahub-adapter` | **No** — extracted under META-248; redefining it here is a guard failure | `workspacejson/datahub-agent` (internal module, unpublished) |
| `@workspacejson/spec`, `@workspacejson/rules` | **Never** — not owned here | `workspacejson/standard` |

This repository holds one publish-capable secret, `NPM_TOKEN`, scoped to
`@workspacejson/cli`. `agents-audit` remains published by
`workspace-json/agents-audit` until META-243, so the two packages release on
disjoint tag namespaces (`cli-v*` and, later, its own) and no single workflow
holds authority over both.

## Migration source and provenance

Extracted from `workspace-json/agents-audit@e47eb1b8556c4f361db9a78190a2f36b400756e8`
on 2026-07-26 under META-240; restructured to the ratified architecture under
META-247. See [`migration/PROVENANCE.md`](./migration/PROVENANCE.md).
