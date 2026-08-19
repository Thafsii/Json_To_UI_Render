import { describe, expect, it } from 'vitest';
import { normalizeComplianceData } from '../complianceMapper.js';
import { complianceFixture } from '../../../test/fixtures.js';

describe('normalizeComplianceData', () => {
  it('extracts overview metadata from the assessment block', () => {
    const result = normalizeComplianceData(complianceFixture);
    expect(result.overview.framework).toBe('SOC 2');
    expect(result.overview.organization).toBe('Acme Corp');
  });

  it('normalizes controls and computes status counts', () => {
    const result = normalizeComplianceData(complianceFixture);
    expect(result.controls.items).toHaveLength(4);
    expect(result.controls.statusCounts.implemented).toBe(2);
    expect(result.controls.statusCounts.partial).toBe(1);
    expect(result.controls.statusCounts.not_implemented).toBe(1);
  });

  it('normalizes risks and evidence', () => {
    const result = normalizeComplianceData(complianceFixture);
    expect(result.risks.items).toHaveLength(2);
    expect(result.evidence.items).toHaveLength(2);
    expect(result.evidence.summary.expired).toBe(1);
  });

  it('normalizes remediation items', () => {
    const result = normalizeComplianceData(complianceFixture);
    expect(result.remediation.items).toHaveLength(1);
    expect(result.remediation.items[0].progress).toBe(40);
  });

  it('handles missing sections without throwing and without fabricating data', () => {
    const result = normalizeComplianceData({ assessment: { framework: 'ISO 27001' } });
    expect(result.controls.items).toEqual([]);
    expect(result.risks.items).toEqual([]);
    expect(result.evidence.summary).toBeNull();
  });

  it('handles null input', () => {
    expect(() => normalizeComplianceData(null)).not.toThrow();
  });
});
