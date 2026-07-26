import type { AuditConfig } from '@workspacejson/rules';

// `detectCiProvider` is a neutral producer primitive and now lives in
// @workspacejson/cli. It is re-exported here because it is part of this
// package's historical public API and must remain importable from
// `agents-audit` (META-247).
export { detectCiProvider } from '@workspacejson/cli';

export const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  stalenessThresholdDays: 60,
  highActivityCommitCount: 20,
  conventionMismatchPrecisionMode: true,
  failOn: null,
  save: false,
  reportDir: '.agents/audit-history',
  ignore: [],
};
