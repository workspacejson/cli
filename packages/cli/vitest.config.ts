import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // `candidate-tests/` is deliberately outside this workspace's suite.
    //
    // Those files exercise the observation form, which the published
    // `@workspacejson/spec@0.4.4` and `@workspacejson/rules@0.4.4` reject —
    // their schema predates ADR-003 A-009. They run against PACKED candidate
    // builds in a disposable environment, on the Node test runner, so that this
    // workspace keeps passing against its legitimate published dependencies.
    // Excluding them here is what keeps the two boundaries from contaminating
    // each other; it is not a way of skipping them.
    exclude: ['**/node_modules/**', '**/dist/**', 'candidate-tests/**'],
  },
});
