# Input receipt

Immutable predecessor verified locally by object ID and subject:

* result: `741229352ebacf8c0268cbe30265fbd34260b3ba`
* preregistration: `8f3f762dbc6ae7006f2317fb6137e6e2a754a92a`
* pre-outcome freeze: `7bd2f17c1b715875d0dc8dbace5d2002f46a29dd`

The remote is `https://github.com/workspacejson/cli.git`; its DNS verification is recorded as pending publication-time verification because the sandbox initially could not resolve github.com. The public target repository was cloned at pin `85bb4884ed9428248258e3b8de477c860b9bc60f`, the frozen META-289 remult pin.

The sole construction input is `docs/evidence/meta-289/raw/pre-outcome.json` (SHA is emitted by the script). It supplies the 200 frozen query identities, T0s, source paths, suite membership/hash, and pre-outcome H/B0/B1 lists. Outcome and result files are excluded by the construction script.
