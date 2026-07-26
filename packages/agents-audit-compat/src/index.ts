// agents-audit public API — UNCHANGED SURFACE.
//
// This package is a frozen compatibility bridge (META-236). Generation now
// lives in @workspacejson/cli; `generateWorkspaceJson` and `detectCiProvider`
// are re-exported from there so every historical import path keeps working.
// All nine exports below were importable from agents-audit before META-247 and
// must remain so.
export { runAudit, DEFAULT_AUDIT_CONFIG } from './audit.js';
export { generateWorkspaceJson, detectCiProvider } from '@workspacejson/cli';
export { renderFindingsTable, renderScoreCard, renderVrekoUpsell, renderMissingArtifactNotice } from './presenter.js';
export { startInteractiveNavigation } from './navigator.js';
export { saveReport } from './reporter.js';
