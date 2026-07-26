# workspacejson/cli

CLI distribution for the **workspace.json** standard: repository scanning and
deterministic generation of `.agents/workspace.json`.

This repository owns the *producer implementation and its executables*. It does
not own the specification — the normative schema, rules and contracts live in
[`workspacejson/standard`](https://github.com/workspacejson/standard) and are
consumed here as released packages.

> **Status: pre-release.** The architecture below landed in META-247 and is the
> ratified target shape, but nothing here is published yet and the public
> documentation is deliberately unfinished. The working command today is
> `npx agents-audit generate`.

## Packages

| Directory | Package | Published? | Role |
| -- | -- | -- | -- |
| [`packages/cli/`](./packages/cli/) | `@workspacejson/cli` | **No — not yet on npm** | the neutral producer and its `workspacejson` binary |
| [`packages/agents-audit-compat/`](./packages/agents-audit-compat/) | `agents-audit` | **Yes — `0.4.4`** | frozen compatibility bridge; preserves the historical command and API |

`packages/datahub-adapter/` also exists but is **not part of this repository's
architecture** — it is a private DataHub/dbt adapter staged here pending
extraction to `workspacejson/datahub-agent`, which owns DataHub consumption. See
[`OWNERSHIP.md`](./OWNERSHIP.md).

## Generating the artifact

Today, the command that works is the compatibility one:

```bash
npx agents-audit generate
```

Once `@workspacejson/cli` is published, the neutral equivalent is:

```bash
workspacejson generate            # write .agents/workspace.json
workspacejson generate --dry-run  # print the projection, write nothing
workspacejson generate --check    # non-writing drift gate for CI
workspacejson generate --force    # recover from an invalid existing artifact
```

Both routes run **the same implementation** — `agents-audit` delegates to
`@workspacejson/cli`, so the two binaries cannot drift apart during the
compatibility window.

`agents-audit` additionally keeps its audit commands (`scan`, `version`) and all
nine of its historical public exports.

## Compatibility guarantee

`agents-audit` is a **frozen bridge**: its package name, binary, commands, exit
codes, output and exported API are unchanged, and it gets no new features. The
guarantee is enforced by executable parity harnesses in
[`migration/`](./migration/), which run real packed candidates from before and
after each change:

```bash
migration/parity-agents-audit-runtime.sh   # 29/29 producer behavior
migration/parity-datahub-shim.mjs          # 35/35 adapter behavior
```

Removing the compatibility package is gated on downstream consumers — Buildomator,
the VS Code extension, MCP installers and documentation — moving to the neutral
command first.

## Development

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm test
pnpm run check:architecture                 # boundary and clean-room guards
node scripts/check-architecture.test.mjs    # deliberate-violation red tests
pnpm run release:verify-packs               # packed-tarball verification
```

Requires Node.js >= 20.

## Publishing

**Publishing from this repository is disabled.** The release workflow has no
enabled trigger, holds no npm credential and contains no publish step.
`workspace-json/agents-audit` remains the sole publisher of `agents-audit` until
the coordinated authority cutover in META-243.

`@workspacejson/cli` has never been published. Do not document
`npm install @workspacejson/cli` as if it works.

## Provenance

Extracted with full history from
`workspace-json/agents-audit@e47eb1b8556c4f361db9a78190a2f36b400756e8`.
See [`migration/PROVENANCE.md`](./migration/PROVENANCE.md).

## License

Apache-2.0. See [`LICENSE`](./LICENSE).
