import type { AuditConfig } from '@workspacejson/rules';

/**
 * Producer configuration.
 *
 * Structurally this is still `@workspacejson/rules`' `AuditConfig`, because the
 * generator consumes that package's rule engine to compute `generated.hygiene`.
 * That dependency is on a standard-owned package, not on the audit product, so
 * it is the sanctioned direction — but the *name* is audit-shaped, which is a
 * historical artifact. Aliasing it here keeps the neutral producer's own
 * vocabulary neutral without forking a standard-owned type (META-236).
 */
export type ProducerConfig = AuditConfig;

export const DEFAULT_PRODUCER_CONFIG: ProducerConfig = {
  stalenessThresholdDays: 60,
  highActivityCommitCount: 20,
  conventionMismatchPrecisionMode: true,
  failOn: null,
  save: false,
  reportDir: '.agents/audit-history',
  ignore: [],
};

export function detectCiProvider(
  files: string[],
): 'github-actions' | 'gitlab-ci' | 'circleci' | 'jenkins' | 'none' | 'unknown' {
  if (files.some((f) => f.startsWith('.github/workflows/') || f.includes('/.github/workflows/'))) {
    return 'github-actions';
  }
  if (files.some((f) => f === '.gitlab-ci.yml' || f.endsWith('/.gitlab-ci.yml'))) {
    return 'gitlab-ci';
  }
  if (files.some((f) => f.startsWith('.circleci/') || f.includes('/.circleci/'))) {
    return 'circleci';
  }
  if (files.some((f) => f === 'Jenkinsfile' || f.endsWith('/Jenkinsfile'))) {
    return 'jenkins';
  }
  return 'unknown';
}
