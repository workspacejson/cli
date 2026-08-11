# META-310 evidence driver

The driver that produced canonical co-change artifacts for three external
repositories. The artifacts, run receipts and the full evidence receipt live in
`workspacejson/standard` at `docs/evidence/meta-310/`.

This directory holds only the tooling, because the driver imports
`@workspacejson/cli` and `standard` sits at the top of the dependency graph —
its `check-architecture` refuses any file in that repository importing a sibling.

## Files

| File | What it is |
| -- | -- |
| `meta310-mine.mjs` | The driver, **as the exact bytes that ran**. `sha256 5be5c814caed895b30a26d6fee697e1b65bc01c95789235dc49ad2a3f805e83c` |
| `runner-package.json` | The runner manifest, **rewritten to be portable** — see below |

### `meta310-mine.mjs` is byte-frozen; `runner-package.json` is not

The driver's digest is published in the evidence receipt, so its bytes are the
reproduction claim rather than an approximation of it. It has not been edited
since the run — including three NUL bytes used as separators in the cross-check
comparison key, which make Git render it as binary. That is sound (a NUL cannot
occur in a path, so the key is unambiguous) and both sides of every comparison
used the same function, so the reported results are unaffected.

The manifest is a different case and is **deliberately not byte-frozen**. As it
ran it carried machine-local absolute paths under `/private/tmp/...`, which
resolve on exactly one machine and fail to install anywhere else — so shipping
those bytes verbatim would have documented the environment while preventing
anyone from recreating it. Raised in review on PR #21 and fixed here.

The as-run copy hashed
`fed868de3cce3c5e75010fa7062221fb53f155a20ca90c850c5ed47be5a59795`, and that
digest appears in the frozen-contract receipt. **It no longer matches this file.**
The two differ only in the tarball directory prefix; the package set, the
versions and the `overrides` that force `file:` resolution are identical. No
result depends on the prefix — what the run depended on is the *content* of the
four tarballs, and those digests are recorded in the evidence receipt and are
unchanged.

## Reproducing

The manifest's `file:./tarballs/...` paths are relative to **the directory the
manifest is installed from**, which is the fresh runner directory — not this
directory in the repository. Everything the runner needs therefore has to end up
inside `$RUN`. Steps are ordered so that following them literally works.

1. Create the fresh runner directory. It must contain no reused `node_modules`
   and no carried-over lockfile:

   ```sh
   RUN=/some/empty/dir
   mkdir -p "$RUN/tarballs"
   ```

2. Check out the two pinned revisions and build from **clean detached worktrees**,
   not working trees:

   - `workspacejson/cli` @ `031c3504a0977b8d90ac518c82a39a2f4ec741a9`
   - `workspacejson/standard` @ `f95c42f89c8fe39995c10918bea880729cf17bbd`

3. `npm pack` the four packages **into `$RUN/tarballs/`**
   (`npm pack --pack-destination "$RUN/tarballs"`), then verify their digests:

   | Tarball | `sha256` |
   | -- | -- |
   | `workspacejson-spec-0.4.4.tgz` | `2e0c326e7d8b50d3e3fa801944659803cd95d13dc253e65e1ace8dfccf949111` |
   | `workspacejson-rules-0.4.4.tgz` | `548dd788725899ccaded6568121a271eeb593f143c581ec7e4714b50d9e5dbb7` |
   | `workspacejson-cli-0.5.2.tgz` | `aa0ab7526a8f8fc6316f8b809d2ee5cdd04c80c5483a29d39e8dfbcc2e15ad18` |
   | `workspacejson-mining-core-0.0.0.tgz` | `4f2a632d874dc862fc6425c81324378598c6183215aa80fe88465c3e0847577e` |

   These digests are the real pin. The tarball *contents* are what the run
   depended on; the directory holding them is not.

4. Copy **both** files from this directory into `$RUN`, the manifest under the
   name `package.json`, then install:

   ```sh
   cp runner-package.json "$RUN/package.json"
   cp meta310-mine.mjs    "$RUN/"
   cd "$RUN" && npm install
   ```

   `@workspacejson/cli` declares `spec` and `rules` by *version*, and the
   candidate and published packages carry identical version numbers, so nothing
   but `file:` resolution distinguishes them. Audit the result:

   ```
   registry URLs for @workspacejson/* in the lockfile   must be 0
   all four packages resolve                            file:
   copies of @workspacejson/spec in the tree            must be 1
   ```

5. Clone each target **full, not shallow**, check out the pinned revision from
   the evidence receipt, and run from `$RUN`:

   ```sh
   node meta310-mine.mjs <label> <repoRoot> <outDir>
   ```

Compare **history-block** digests, not whole-file digests: the latter include
`generatedAt`, which records the generation run rather than the evidence.

Before trusting a rerun, calibrate: run the driver against `workspacejson/standard`
@ `8e08c8c5cd110e7f95bbd52246ea295c22b072e3` and confirm it reproduces history-block
`7012352617df37f442a627b8dfc334ed17d63dd2a69bb2d875f759bfddcc7b4f` with 50 entries.
That is the artifact committed at `.agents/workspace.json` in that repository, so a
mismatch means the harness is wrong before any target is touched.

Environment as run: Node v22.19.0, npm (bundled), pnpm 9.0.0, darwin.
