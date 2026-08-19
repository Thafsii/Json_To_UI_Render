import { describe, expect, it } from 'vitest';
import { normalizeSecurityData } from '../securityMapper.js';
import { securityFixture } from '../../../test/fixtures.js';

describe('normalizeSecurityData', () => {
  it('extracts assets, findings, vulnerabilities, incidents, controls and risks', () => {
    const result = normalizeSecurityData(securityFixture);
    expect(result.assets).toHaveLength(2);
    expect(result.findings).toHaveLength(3);
    expect(result.vulnerabilities).toHaveLength(1);
    expect(result.incidents).toHaveLength(1);
    expect(result.controls).toHaveLength(1);
    expect(result.risks).toHaveLength(1);
  });

  it('derives summary counts from findings when no summary block provides them', () => {
    const result = normalizeSecurityData(securityFixture);
    expect(result.summary.criticalFindings).toBe(1);
    expect(result.summary.highFindings).toBe(1);
    expect(result.summary.openFindings).toBe(2);
    expect(result.summary.resolvedFindings).toBe(1);
  });

  it('prefers explicit summary values over derived counts', () => {
    const result = normalizeSecurityData(securityFixture);
    expect(result.summary.totalAssets).toBe(3); // from summary.total_assets, not assets.length (2)
  });

  it('returns empty arrays for missing sections without throwing', () => {
    const result = normalizeSecurityData({});
    expect(result.assets).toEqual([]);
    expect(result.findings).toEqual([]);
    expect(result.risks).toEqual([]);
  });
});
