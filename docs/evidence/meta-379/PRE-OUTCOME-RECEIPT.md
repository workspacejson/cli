# Pre-outcome receipt

This commit freezes `B2_STATIC/v1`, its depth (4), resolution rules, ranking order, validity measurements, and outcome-isolation boundary before META-289 outcome/result files are read by META-379 code.

`scripts/pre-outcome.mjs` has one permitted input record and rejects explicit outcome paths. It contains no import or read of META-289 `raw/outcomes.json` or `raw/results.json`. The later evaluator must consume the frozen ranking receipt and only then access outcomes.

The initial construction run processed T0 record 0 only as an environment check; it did not read outcomes. Full construction remains required before outcome evaluation.
