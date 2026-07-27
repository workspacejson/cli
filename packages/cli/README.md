# @workspacejson/cli

The **workspace.json producer**. Scans a repository and generates
`.agents/workspace.json` deterministically, preserving human-authored `manual`
evidence across regenerations.

## Install

```bash
npm install -g @workspacejson/cli   # or: npx @workspacejson/cli generate
```

Requires Node.js >= 20. Published from
[`workspacejson/cli`](https://github.com/workspacejson/cli) with
[npm provenance](https://docs.npmjs.com/generating-provenance-statements), so
every release is traceable to the workflow run and commit that built it.

> **Migrating from `agents-audit`?** That package is frozen at `0.4.4` and this
> one continues its version line from `0.5.0`. The producer is the same
> implementation, but the surface is deliberately smaller:
>
> | `agents-audit` | `@workspacejson/cli` |
> | -- | -- |
> | `agents-audit generate` | `workspacejson generate` |
> | `agents-audit scan` | no equivalent — this is the producer, not the audit |
> | `.agentsauditrc` | not read; a neutral config file is still to be named |

## Commands

```bash
workspacejson generate            # write .agents/workspace.json
workspacejson generate --dry-run  # print the projection, write nothing
workspacejson generate --check    # non-writing drift gate for CI
workspacejson generate --force    # recover from an invalid existing artifact
```

## Behavior

- **Manual evidence is preserved verbatim.** Regeneration replaces
  producer-owned sections only; anything under `manual` survives untouched.
- **Writes are atomic** — a temporary file is renamed into place, so a crash
  never leaves a half-written artifact.
- **Invalid artifacts are refused, not overwritten.** If an existing
  `.agents/workspace.json` cannot be parsed or fails validation, `generate`
  exits non-zero rather than destroying evidence it cannot read. `--force`
  moves the invalid file aside as `workspace.json.invalid.<timestamp>` instead
  of deleting it.
- **Unchanged material output does not create drift.** The producer compares a
  stable projection of generated content that excludes volatile timestamps, so
  re-running on an unchanged repository is a no-op and `--check` stays usable as
  a CI gate.

## Library use

```ts
import { generateWorkspaceJson } from '@workspacejson/cli';

const result = await generateWorkspaceJson(process.cwd());
console.log(result.path, result.written, result.drift);
```

`generateWorkspaceJson(repoRoot, config?, options?)` accepts
`{ dryRun, check, force, producer }`. The `producer` identity is written to
`generated.by` and defaults to this package — `agents-audit` passes its own
identity so its historical artifacts keep stamping the same provenance.

## Contracts

Schema, types and validation come from
[`workspacejson/standard`](https://github.com/workspacejson/standard) as
released packages (`@workspacejson/spec`, `@workspacejson/rules`). This package
implements the contract; it does not define it.

## License

Apache-2.0.
