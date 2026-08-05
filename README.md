# workspacejson/cli

CLI distribution for the **workspace.json** standard: repository scanning and
deterministic generation of `.agents/workspace.json`.

This repository owns the *producer implementation and its executables*. It does
not own the specification — the normative schema, rules and contracts live in
[`workspacejson/standard`](https://github.com/workspacejson/standard) and are
consumed here as released packages.

> **Status.** The architecture below landed in META-247 and is the ratified
> target shape. Both packages are published; the versions in the table are the
> manifest versions in this repository, checked by `pnpm run check:published-status`.
> Package semver is independent of the specification profile — `@workspacejson/cli`
> at `0.5.x` produces specification **v0.4** artifacts and is not evidence that
> schema v0.5 shipped.

## Packages

| Directory | Package | Published? | Role |
| -- | -- | -- | -- |
| [`packages/cli/`](./packages/cli/) | `@workspacejson/cli` | **Yes — `0.5.2`** | the neutral producer and its `workspacejson` binary |
| [`packages/agents-audit-compat/`](./packages/agents-audit-compat/) | `agents-audit` | **Yes — `0.4.4`** | frozen compatibility bridge; preserves the historical command and API |

Those two packages are the whole repository. The private DataHub/dbt adapter
that was staged here has been **extracted to `workspacejson/datahub-agent`**
(META-248), which owns DataHub consumption; it was never durable architecture
here. The boundary is machine-enforced and red-tested — see
[`OWNERSHIP.md`](./OWNERSHIP.md).

## Generating the artifact

The neutral producer is the current route:

```bash
npx @workspacejson/cli generate .

workspacejson generate            # write .agents/workspace.json
workspacejson generate --dry-run  # print the projection, write nothing
workspacejson generate --check    # non-writing drift gate for CI
workspacejson generate --force    # recover from an invalid existing artifact
```

The historical command still works and is kept working:

```bash
npx agents-audit generate
```

Both routes run **the same implementation** — `agents-audit` delegates to
`@workspacejson/cli`, so the two binaries cannot drift apart during the
compatibility window. New setups should use the neutral producer; `agents-audit`
exists for setups already pinned to it.

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

The two packages release independently, on disjoint tag namespaces, so no single
workflow ever holds authority over both.

| Package | Publisher | Tag |
| -- | -- | -- |
| `@workspacejson/cli` | this repository, [`publish-cli.yml`](./.github/workflows/publish-cli.yml) | `cli-v*.*.*` |
| `agents-audit` | **frozen at `0.4.4`** — not published from here | none |

`@workspacejson/cli` continues `agents-audit`'s version line, starting at
`0.5.0`. `agents-audit` is locked for hackathon judging and receives no further
releases; it is excluded from changesets via `ignore` so a workspace-wide
version run cannot bump it by accident.

To release `@workspacejson/cli`:

```bash
pnpm changeset version          # bumps packages/cli/package.json + CHANGELOG
git commit -am "release: ..." && git push
git tag cli-v0.5.0 && git push --tags
```

The tag is both the trigger and the source of truth for the version: it is
validated as clean semver and asserted equal to the manifest before anything
reaches the registry, so a tag that disagrees with `package.json` fails the run
rather than publishing a version nobody named.

**`agents-audit` is not published from here, and is not scheduled to be.** It is
frozen at `0.4.4`; `workspace-json/agents-audit` published that release and
remains its registry owner. The unreleased entries in its changelog exist in
this working tree but will not ship under that name — the shared producer
changes among them reach users through `@workspacejson/cli` instead.

## Provenance

Extracted with full history from
`workspace-json/agents-audit@e47eb1b8556c4f361db9a78190a2f36b400756e8`.
See [`migration/PROVENANCE.md`](./migration/PROVENANCE.md).

## License

Apache-2.0. See [`LICENSE`](./LICENSE).
