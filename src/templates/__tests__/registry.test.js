import { describe, expect, it } from 'vitest';
import templateRegistry from '../registry.js';
import GenericTemplate from '../generic/genericTemplate.jsx';
import EcommerceTemplate from '../ecommerce/ecommerceTemplate.jsx';
import SecurityTemplate from '../security/securityTemplate.jsx';
import ComplianceTemplate from '../compliance/criteriaReviewTemplate.jsx';
import HRTemplate from '../hr/hrTemplate.jsx';
import MonitoringTemplate from '../monitoring/monitoringTemplate.jsx';
import ProjectManagementTemplate from '../project_management/projectManagementTemplate.jsx';
import { SUPPORTED_DOMAINS, isFullySupportedDomain } from '../../config/domainConfig.js';

describe('template registry', () => {
  it('maps every fully-supported domain to its dedicated template, not the generic fallback', () => {
    expect(templateRegistry.ecommerce).toBe(EcommerceTemplate);
    expect(templateRegistry.security).toBe(SecurityTemplate);
    expect(templateRegistry.compliance).toBe(ComplianceTemplate);
    expect(templateRegistry.hrms).toBe(HRTemplate);
    expect(templateRegistry.monitoring).toBe(MonitoringTemplate);
    expect(templateRegistry.project_management).toBe(ProjectManagementTemplate);
  });

  it('routes every domain declared in SUPPORTED_DOMAINS to *some* registered template', () => {
    SUPPORTED_DOMAINS.forEach((domain) => {
      expect(templateRegistry[domain]).toBeDefined();
    });
  });

  it('domains not marked as fully supported render through the generic template (no over-promising)', () => {
    SUPPORTED_DOMAINS.filter((domain) => !isFullySupportedDomain(domain) && domain !== 'generic').forEach((domain) => {
      expect(templateRegistry[domain]).toBe(GenericTemplate);
    });
  });
});
