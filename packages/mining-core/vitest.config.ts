import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // These tests drive real git against real repositories, which is the whole
    // point — a mocked `diff-tree` would prove nothing about extraction. The
    // cost is real too: v2.2.1's frozen parameters spend one `rev-parse` and
    // one `diff-tree` per commit, sequentially, so a 44-commit history is a
    // low-hundreds-of-milliseconds-per-commit walk and the 5s default expires
    // partway through.
    //
    // Raising the budget rather than batching the git calls is deliberate. The
    // commands are quoted from the preregistration and REQ-001 verifies against
    // them verbatim; replacing them with a faster equivalent would make the
    // extraction no longer the thing that was frozen. The runtime itself is
    // REQ-010's question and Phase 3 has not started.
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
});
