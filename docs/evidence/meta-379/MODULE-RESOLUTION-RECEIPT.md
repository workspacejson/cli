# Module-resolution receipt

At the frozen remult pin, B2_STATIC uses TypeScript 5.9.2 from the repository's lockfile. For each T0 it parses each TS/JS import declaration and calls `ts.resolveModuleName` with compiler options from the nearest ancestor tsconfig. The graph has mean 647.885 META-289 SOURCE nodes, 132.685 TEST nodes, and 1,541.390 resolved local import edges per query T0.
