import ComplianceCriteriaTemplate from './compliance/criteriaReviewTemplate.jsx';
import EcommerceTemplate from './ecommerce/ecommerceTemplate.jsx';
import SecurityTemplate from './security/securityTemplate.jsx';
import HRTemplate from './hr/hrTemplate.jsx';
import ProjectManagementTemplate from './project_management/projectManagementTemplate.jsx';
import MonitoringTemplate from './monitoring/monitoringTemplate.jsx';
import GenericTemplate from './generic/genericTemplate.jsx';

const TEMPLATE_REGISTRY = {
  ecommerce: EcommerceTemplate,
  hrms: HRTemplate,
  cloud: GenericTemplate,
  cspm: GenericTemplate,
  devtools: GenericTemplate,
  endpoint_security: GenericTemplate,
  idp: GenericTemplate,
  itsm: GenericTemplate,
  project_management: ProjectManagementTemplate,
  vulnerability_management: GenericTemplate,
  security: SecurityTemplate,
  compliance: ComplianceCriteriaTemplate,
  monitoring: MonitoringTemplate,
  generic: GenericTemplate,
};

export default TEMPLATE_REGISTRY;
