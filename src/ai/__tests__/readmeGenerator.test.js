import { describe, expect, it } from 'vitest';
import { generateReadme } from '../readmeGenerator.js';
import { analyzeJsonWithAi } from '../analyzer.js';
import { analyzeJsonStructure } from '../../analyzer/structuralAnalyzer.js';
import { resolveDomainRouting } from '../../utils/domainResolver.js';
import { normalizeComplianceData } from '../../templates/compliance/complianceMapper.js';
import { complianceFixture, unknownFixture } from '../../test/fixtures.js';

describe('generateReadme', () => {
  it('uses classification.detectedDomain, not classification.domain (regression for the audited field-name bug)', () => {
    const classification = { detectedDomain: 'compliance', confidence: 0.9, domainSource: 'Explicit JSON' };
    const readme = generateReadme({ json: complianceFixture, classification, analysis: null, structure: null });
    expect(readme).toContain('compliance');
    expect(readme).not.toContain('undefined');
  });

  it('produces a complete report end-to-end for a compliance fixture', () => {
    const classification = resolveDomainRouting(complianceFixture);
    const structure = analyzeJsonStructure(complianceFixture);
    const analysis = analyzeJsonWithAi(complianceFixture, classification);
    const domainData = normalizeComplianceData(complianceFixture);

    const readme = generateReadme({ json: complianceFixture, classification, analysis, structure, domainData });

    expect(readme).toContain('# Overview');
    expect(readme).toContain('# Compliance Summary');
    expect(readme).toContain('SOC 2');
    expect(readme).not.toContain('undefined');
  });

  it('degrades gracefully with no classification/analysis/structure', () => {
    const readme = generateReadme({ json: unknownFixture, classification: null, analysis: null, structure: null });
    expect(readme).toContain('generic');
    expect(readme).not.toContain('undefined');
  });
});
