import type { AuditConfig } from '@workspacejson/rules';

export const DEFAULT_AUDIT_CONFIG: AuditConfig = {
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
