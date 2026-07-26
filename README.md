# workspacejson/cli

CLI distribution for the **workspace.json** standard: repository scanning,
deterministic generation and reconciliation of `.agents/workspace.json`, and
CLI-side adapters.

This repository owns the *producer implementation and its executables*. It does
not own the specification. The normative schema, rules and contracts live in
[`workspacejson/standard`](https://github.com/workspacejson/standard); this
repository consumes them as released packages.

## The generator command today

```bash
npx agents-audit generate
```

That is the real, published, working command for producing
`.agents/workspace.json`. It is implemented in
[`packages/agents-audit/`](./packages/agents-audit/) and published to npm as
[`agents-audit`](https://www.npmjs.com/package/agents-audit).

```bash
agents-audit scan .              # audit AGENTS.md hygiene
agents-audit generate            # write .agents/workspace.json
agents-audit generate --dry-run  # print the projection, write nothing
agents-audit generate --check    # non-writing drift gate for CI
agents-audit generate --force    # recover from an invalid existing artifact
```

## This repository contains two different CLI packages

They are **not** the same tool, and one of them is not installable.

| Directory | Package | Published? | What it actually does |
| -- | -- | -- | -- |
| [`packages/agents-audit/`](./packages/agents-audit/) | `agents-audit` | **Yes — public, `0.4.4`** | `AGENTS.md` audit **and the current workspace.json producer**. Binary: `agents-audit`. |
| [`packages/cli/`](./packages/cli/) | `@workspacejson/cli` | **No — `private: true`, not on npm** | A DataHub/dbt adapter: normalizes dbt model paths to repository-root-relative keys and joins them against an existing `generated.fileIndex`. Binary declared as `workspacejson`, but the package is not distributed. |

### `packages/cli` is not the generator

The directory being named `cli` and the package being named
`@workspacejson/cli` is misleading, and it has misled before. It contains no
generation logic. It reads a `.agents/workspace.json` that something else
already produced. If you are looking for the code that *writes* the artifact,
it is `packages/agents-audit/src/generate.ts`.

### Do not advertise `@workspacejson/cli` as installable

`npm install @workspacejson/cli` does not work and is expected not to work —
the package is `private: true` and returns `E404` from the registry. Any
documentation, extension text or integration guide that tells a user to install
it is wrong.

## The future neutral CLI identity is undecided

Whether a neutral producer package appears, whether `agents-audit` becomes a
compatibility bridge or stays a distinct audit product, and what happens to the
private DataHub shim are **open questions**, tracked in
[META-236](https://linear.app/marcelle-labs/issue/META-236). Nothing in this
repository should be read as having settled them. Until META-236 is ratified,
the answer to "what does a cold user run?" is `npx agents-audit generate`.

## Ownership boundaries

| Repository | Owns |
| -- | -- |
| [`workspacejson/standard`](https://github.com/workspacejson/standard) | specification, JSON Schema, rules, ADRs, conformance fixtures — **contract authority** |
| **`workspacejson/cli`** (this repo) | producer/audit CLI implementation, repository scanning, generation, CLI distribution |
| [`workspacejson/integrations`](https://github.com/workspacejson/integrations) | MCP, Codex, VS Code, host adapters |
| [`workspacejson/site`](https://github.com/workspacejson/site) | `workspacejson.dev` presentation and documentation assembly |

This repository contains **no** normative schema copy, **no** host-integration
implementation, and **no** site implementation. See [`OWNERSHIP.md`](./OWNERSHIP.md).

## Development

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm test
pnpm run check:architecture     # clean-room and repository-boundary guards
pnpm run release:verify-packs   # packed-tarball verification for agents-audit
```

Requires Node.js >= 20.

## Publishing

**Publishing from this repository is currently disabled.** The release workflow
is non-authoritative and cannot publish: it holds no npm credential and exits
before any publish step. `workspace-json/agents-audit` remains the sole publisher
of `agents-audit` until the coordinated authority cutover in
[META-243](https://linear.app/marcelle-labs/issue/META-243).

## Provenance

Extracted with full history from
`workspace-json/agents-audit@e47eb1b8556c4f361db9a78190a2f36b400756e8`.
See [`migration/PROVENANCE.md`](./migration/PROVENANCE.md) for the extraction
command, old→new commit mapping, included/excluded paths and rollback procedure.

## License

Apache-2.0. See [`LICENSE`](./LICENSE).
