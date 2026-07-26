# @workspacejson/cli

Joins dbt models to [workspace.json](https://www.workspacejson.dev) behavioral
intelligence (fragility, co-change, modification history) by
**repository-root-relative POSIX path**.

## The problem it solves

dbt's `manifest.json` reports `original_file_path` relative to the **dbt project
root**. A workspace.json `fileIndex` is keyed relative to the **git repository
root** (see `@workspacejson/spec`, VR-640). When the dbt project is nested in a
subdirectory — `dbt/` under the repo root, the common real-world layout — the two
path representations differ by exactly that prefix, and a naive join silently
returns **zero rows** (no error). This was reproduced empirically in the HAC-75
probe: 5/5 match at the repo root, 5/5 miss when nested.

## The fix (the normalization shim)

```
projectPrefix = relative(gitRoot, dbtProjectDir)   // "dbt" when nested, "" at root
joinKey        = projectPrefix ? `${projectPrefix}/${original_file_path}` : original_file_path
```

`dbtProjectDir` is wherever `dbt_project.yml` lives. Real repos hold more than one
dbt project, so `findDbtProjects()` enumerates **all** of them rather than
assuming a single knowable path.

## Usage

```bash
workspacejson --git-root . --manifest dbt/target/manifest.json --workspace-json .agents/workspace.json
```

Exits non-zero if any dbt project produces zero joined rows.

## Status

MVP. The path-normalization shim and join are implemented and tested (including
the HAC-75 nested-repo case, red-first). Consumes `@workspacejson/spec` as a
workspace sibling for the `fileIndex` key contract.
