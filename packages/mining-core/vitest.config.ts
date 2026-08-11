import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // These tests drive real git against real repositories, which is the whole
    // point — a mocked `diff-tree` would prove nothing about extraction. The
    // cost is real too: v2.2.1's frozen parameters spend one `rev-parse` and
    // one `diff-tree` per commit, sequentially, and the 5s default expires
    // partway through.
    //
    // Raising the budget rather than batching the git calls is deliberate. The
    // commands are quoted from the preregistration and REQ-001 verifies against
    // them verbatim; replacing them with a faster equivalent would make the
    // extraction no longer the thing that was frozen.
    //
    // Measured on an Apple M4 Pro: a bound 500-transition window costs 7.3-8.2s
    // with a short PATH and 27.2-29.9s with a 36-entry one, because Node
    // re-resolves the `git` binary through PATH on all 1000 spawns. Extraction
    // is spawn-bound, not git-bound. Scoring the events costs 1-24ms.
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
