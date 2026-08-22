# META-379 preregistration

This is an exploratory diagnostic/falsifier on the already-known frozen remult/remult META-289 corpus, not an independent confirmation and not a generalization claim. It changes no standard, producer, schema, ranking, cap, or compatibility bridge.

Primary: POSITIVE queries only; macro recall@10; materiality 0.05 absolute. Report K=1,3,5,10 recall and precision, MRR, coverage, candidate-suite fraction, and exact H−B2. H and B1 must be reproduced exactly from META-289. B2 is `B2_STATIC/v1` in `STATIC-BASELINE-DESIGN.md`; depth is frozen at 4.

Dispositions: `STATIC_BASELINE_CLOSES_GAP` iff H_R@10−B2_R@10 < 0.05 (including B2 ≥ H); `HISTORY_RETAINS_RESIDUAL_SIGNAL` iff difference ≥0.05 and the validity gate passes; `STATIC_BASELINE_NOT_DISTINCTIVE` if graph coverage/ranking movement is inadequate; `DIAGNOSTIC_INDETERMINATE` only for a mechanical invalidity declared before outcomes.

The validity gate requires resolved graph coverage, at least one test→source path, non-identical rankings on actual queries, top-10 movement, and a non-inert import-edge ablation. The outcome stage is a separate script and only it may read the META-289 outcome/result files.
