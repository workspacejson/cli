import { WorkspaceJson } from '@workspacejson/spec';
import { AuditConfig, AuditResult, Finding } from '@workspacejson/rules';

declare const DEFAULT_AUDIT_CONFIG: AuditConfig;
declare function runAudit(repoRoot: string, config?: Partial<AuditConfig>): Promise<AuditResult & {
    workspaceJson: WorkspaceJson | undefined;
}>;

declare function renderScoreCard(result: AuditResult, version: string): void;
declare function renderFindingsTable(findings: Finding[]): void;
declare function renderVrekoUpsell(workspaceJsonExists: boolean, workspaceJsonStatus: AuditResult['workspaceJsonStatus'], workspaceJsonErrors: string[]): void;

declare function startInteractiveNavigation(findings: Finding[]): Promise<void>;

declare function saveReport(result: AuditResult, repoRoot: string, reportDir: string): Promise<string>;

export { DEFAULT_AUDIT_CONFIG, renderFindingsTable, renderScoreCard, renderVrekoUpsell, runAudit, saveReport, startInteractiveNavigation };
