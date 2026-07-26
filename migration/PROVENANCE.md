# Migration provenance — `workspacejson/cli`

This repository was created by a history-preserving extraction from the
`workspace-json/agents-audit` monorepo. It is not a fresh authoring of the CLI
packages; the commit history below is the original history, rewritten only to
drop paths that other repositories now own.

Tracked in Linear as **META-240**, under the **META-237** four-repository
migration program and the **META-238** source freeze.

## Source

| Field | Value |
| -- | -- |
| Source repository | `workspace-json/agents-audit` (public) |
| Frozen source SHA | `e47eb1b8556c4f361db9a78190a2f36b400756e8` |
| Source branch | `main` |
| Source head commit | merge of PR #23, `feat(agents-audit): land deferred generate display behaviors (META-157)` |
| Migration date | 2026-07-26 |
| Target repository | `workspacejson/cli` (this repository) |
| Target branch | `migration/meta-240-cli-extraction` |

The frozen SHA was re-measured with `git rev-parse HEAD` against a clean clone
at migration time. It was not inherited from an earlier note.

## Extraction command

```bash
git clone --no-local workspace-json/agents-audit cli-extract
cd cli-extract && git checkout main   # e47eb1b8556c4f361db9a78190a2f36b400756e8

git filter-repo --force \
  --path packages/agents-audit/ \
  --path packages/cli/ \
  --path scripts/verify-package-tarball.mjs \
  --path scripts/verify-published.mjs \
  --path scripts/verify-npm-publish-access.mjs \
  --path types/ambient.d.ts \
  --path tsconfig.base.json \
  --path pnpm-workspace.yaml \
  --path .npmrc \
  --path .gitignore \
  --path .changeset/README.md \
  --path .github/ISSUE_TEMPLATE/ \
  --path .github/pull_request_template.md \
  --path CODE_OF_CONDUCT.md
```

`git filter-repo` rewrites commit IDs. The complete old→new mapping is committed
at [`migration/commit-map.txt`](./commit-map.txt) (133 entries; 53 commits
preserved, 79 dropped as containing no CLI-owned change).

History: **124 commits → 51 commits**.

Key mappings:

```text
e47eb1b8556c4f361db9a78190a2f36b400756e8 -> 929be520f0ea62c9ec9a3de32f1473c61e1de5eb  (frozen source head)
f6cf3464da5c00c0a7b43faf431c076ddb224507 -> 927818e67eaa1f4834644b4a6b25fc7bff4d8bcb  (META-157 generate display)
8dca4e788b0004acd37570b95e4b75e99689e3c3 -> 8b895a9b56818c46ea232ece065a263de124a941  (@workspacejson/cli scaffold)
161cffb9b17112a49f6d77e228bb35464e3e59d9 -> a519dfa810a7d608d8c307038e475d06335d064b  (bin entry-point guard fix)
```

## Included paths

```text
packages/agents-audit/**            published producer + audit CLI
packages/cli/**                     private DataHub/dbt join shim
scripts/verify-package-tarball.mjs
scripts/verify-published.mjs
scripts/verify-npm-publish-access.mjs
types/ambient.d.ts
tsconfig.base.json
pnpm-workspace.yaml
.npmrc
.gitignore
.changeset/README.md
.github/ISSUE_TEMPLATE/**
.github/pull_request_template.md
CODE_OF_CONDUCT.md
```

## Excluded paths

| Excluded | Owner |
| -- | -- |
| `packages/spec/**` | `workspacejson/standard` (META-239) |
| `packages/rules/**` | `workspacejson/standard` (META-239) |
| `docs/audits/**` | historical monorepo reconciliation records; stay with the source repo |
| `.planning/**` | rules-phase planning artifacts; path is `.gitignore`d going forward |
| `assets/**` | branding, site/standard-owned |
| `.agents/workspace.json` | this repository's own generated artifact — regenerated here, not inherited |
| `pnpm-lock.yaml` | every entry encodes the monorepo dependency graph; regenerated |
| root `README.md`, `CHANGELOG.md`, `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`, `package.json` | monorepo-scoped; rewritten here as CLI-owned documents |

## Extraction fidelity

Verified after filtering, before any reconstruction:

```text
git rev-parse <source>:packages/agents-audit == git rev-parse HEAD:packages/agents-audit
  3266ed425e6f5ad29a50c8b13759518955b4c473   IDENTICAL
git rev-parse <source>:packages/cli         == git rev-parse HEAD:packages/cli
  fcd97c028c70639d89f23bbc78db0e396f2abaad   IDENTICAL
git rev-parse <source>:types                == git rev-parse HEAD:types
  80ee90072829feade3d84742502f215f8ce2893c   IDENTICAL
```

Excluded-path leak check returned 0 commits for every excluded path across the
filtered history.

## The source repository was not modified

`workspace-json/agents-audit` remains untouched and remains the authoritative
publisher for `agents-audit` until the coordinated cutover in META-243. No
reverse-merge machinery exists between the two repositories.

## Rollback

| Field | Value |
| -- | -- |
| Rollback ref (source of truth) | `workspace-json/agents-audit@e47eb1b8556c4f361db9a78190a2f36b400756e8` |
| Rollback procedure | Abandon this repository. The frozen source SHA still contains both packages at `packages/agents-audit/` and `packages/cli/`, still builds them, and still holds sole publish authority via `NPM_TOKEN`. No registry state, dist-tag, package name, or published artifact was changed by this migration, so rollback requires no republish and no consumer action. |
| Registry state at migration | `agents-audit@0.4.4` (`latest`), `@workspacejson/spec@0.4.4`, `@workspacejson/rules@0.4.4`; `@workspacejson/cli` absent (private) |

## Deferred, deliberately not performed here

* META-236 — neutral producer package/command identity
* META-195 — producer `fileIndex` / `frameworkManifest` enrichment
* META-235 — `version` / `specVersion` dual emission
* META-243 — publish-authority cutover and old-repository lock
