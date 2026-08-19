import { describe, expect, it } from 'vitest';
import { analyzeJsonWithAi } from '../analyzer.js';
import { ecommerceFixture } from '../../test/fixtures.js';

describe('analyzeJsonWithAi', () => {
  it('reads classification.detectedDomain (regression: the field used to be classification.domain, which is always undefined)', () => {
    const classification = { detectedDomain: 'ecommerce', confidence: 0.8 };
    const result = analyzeJsonWithAi(ecommerceFixture, classification);
    expect(result.domain).toBe('ecommerce');
    expect(result.summary).toContain('ecommerce');
    expect(result.observations.some((line) => line.includes('ecommerce'))).toBe(true);
  });

  it('falls back to "generic" when no classification is provided', () => {
    const result = analyzeJsonWithAi(ecommerceFixture, null);
    expect(result.domain).toBe('generic');
  });

  it('detects repeated object collections as entities', () => {
    const result = analyzeJsonWithAi(ecommerceFixture, { detectedDomain: 'ecommerce', confidence: 0.8 });
    expect(result.entities.some((entity) => entity.name === 'products')).toBe(true);
    expect(result.entities.some((entity) => entity.name === 'orders')).toBe(true);
  });
});
