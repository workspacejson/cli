# B2_STATIC design (frozen before outcomes)

`B2_STATIC/v1` uses only each query's META-289 T0 tree. It resolves TypeScript import declarations through that T0's native TypeScript compiler API and the nearest ancestor `tsconfig.json` (falling back to the T0 root `tsconfig.json`). No repository history, transaction-T changed-file set, or outcome file is available to this stage.

The directed edge is importer → resolved local module. For candidate test `t`, a path is searched in that direction from `t` to any source in the frozen multi-source query, breadth-first, maximum depth **4**. Cycles are visited once. A barrel/index file is an ordinary resolved node; the path continues through it. TS/JS files may be intermediate nodes; candidates and queried sources retain the unchanged META-289 role classifier. External/unresolved modules yield no edge. Path aliases and project references are honored insofar as `ts.resolveModuleName` with the nearest project options resolves them. Cross-package local imports remain edges and package equality is the nearest ancestor `package.json` identity.

Ranking is lexicographic: direct path (distance 1) descending; shortest path distance ascending (no path = infinity); same package descending; frozen META-289 B1 structural score descending; lexical path ascending. The B1 tie-break is reimplemented separately from the unchanged classifier; it has no history or outcome input.

Generated/excluded files are not candidates or queried sources, but may remain graph intermediates if TypeScript resolves them. A missing query source produces no dependency path and is retained. Candidate tests are precisely extant T0 META-289 TEST files.
