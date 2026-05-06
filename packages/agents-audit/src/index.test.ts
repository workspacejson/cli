import { describe, expect, it } from 'vitest';
import { DEFAULT_AUDIT_CONFIG } from './index.js';

describe('agents-audit smoke test', () => {
  it('exports the default audit config', () => {
    expect(DEFAULT_AUDIT_CONFIG.stalenessThresholdDays).toBe(60);
  });
});
