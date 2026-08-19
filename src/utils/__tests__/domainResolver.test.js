import { describe, expect, it } from 'vitest';
import { resolveDomainRouting } from '../domainResolver.js';
import { ecommerceFixture, unknownFixture } from '../../test/fixtures.js';

describe('resolveDomainRouting', () => {
  it('honors an explicit domain field', () => {
    const result = resolveDomainRouting({ domain: 'compliance', foo: 'bar' });
    expect(result.detectedDomain).toBe('compliance');
    expect(result.selectedTemplate).toBe('compliance');
    expect(result.confidence).toBe(1);
    expect(result.aiDetection).toBe(false);
  });

  it('honors an explicit template field over content sniffing', () => {
    const result = resolveDomainRouting({ template: 'security', products: [1, 2, 3] });
    expect(result.detectedDomain).toBe('security');
  });

  it('detects a known domain from content when no explicit field is set', () => {
    const { domain, ...rest } = ecommerceFixture;
    const result = resolveDomainRouting(rest);
    expect(result.aiDetection).toBe(true);
    expect(result.detectedDomain).toBe('ecommerce');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('falls back to generic for unrecognized content', () => {
    const result = resolveDomainRouting(unknownFixture);
    expect(result.aiDetection).toBe(true);
    expect(result.detectedDomain).toBe('generic');
    expect(result.fallbackUsed).toBe(true);
  });

  it('normalizes domain aliases (e.g. "hr" -> "hrms")', () => {
    const result = resolveDomainRouting({ domain: 'hr' });
    expect(result.detectedDomain).toBe('hrms');
  });

  it('handles null input without throwing', () => {
    expect(() => resolveDomainRouting(null)).not.toThrow();
  });
});
