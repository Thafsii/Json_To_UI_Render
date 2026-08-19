export const SUPPORTED_DOMAINS = [
  'ecommerce',
  'hrms',
  'cloud',
  'cspm',
  'devtools',
  'endpoint_security',
  'idp',
  'itsm',
  'project_management',
  'vulnerability_management',
  'security',
  'compliance',
  'monitoring',
  'generic',
];

export const DOMAIN_ALIASES = {
  ecommerce: ['ecommerce', 'e-commerce', 'store', 'retail', 'shopping', 'cart', 'order', 'orders'],
  hrms: ['hrms', 'hr', 'human_resources', 'human_resource_management', 'human_resource', 'human_resources_management', 'hris', 'people_operations', 'employee_management', 'people', 'staff'],
  cloud: ['cloud', 'cloud_service', 'cloud_platform', 'cloud_management', 'cloud_native'],
  cspm: ['cspm', 'cloud_security_posture', 'cloud_security', 'posture_management'],
  devtools: ['devtools', 'developer_tools', 'developer_toolchain', 'devops_tools', 'developer', 'tools'],
  endpoint_security: ['endpoint_security', 'endpoint', 'edr', 'endpoint_protection', 'endpoint_security_platform'],
  idp: ['idp', 'identity_provider', 'identity_management', 'identity', 'iam', 'authentication'],
  itsm: ['itsm', 'it_service_management', 'service_management', 'it_service', 'service_desk'],
  project_management: ['project_management', 'project', 'program_management', 'pm', 'planning', 'roadmap'],
  vulnerability_management: ['vulnerability_management', 'vulnerability', 'vuln_management', 'vulnerability_mgmt', 'cve', 'remediation'],
  security: ['security', 'risk', 'threat', 'cybersecurity', 'cyber_security', 'secops'],
  compliance: ['compliance', 'governance', 'risk_and_compliance', 'grc', 'audit', 'policy'],
  monitoring: ['monitoring', 'observability', 'metrics', 'alerts', 'logs', 'uptime', 'health'],
  generic: ['generic', 'default', 'data', 'json'],
};

export const DEFAULT_DATA_MODEL = {
  ecommerce: 'store',
  hrms: 'employee_management',
  cloud: 'generic',
  cspm: 'generic',
  devtools: 'generic',
  endpoint_security: 'generic',
  idp: 'generic',
  itsm: 'generic',
  project_management: 'project',
  vulnerability_management: 'generic',
  security: 'security_findings',
  compliance: 'criteria_review',
  monitoring: 'observability',
  generic: 'generic',
};

// Domains with a purpose-built dashboard (metrics, charts, tables, detail views).
// Domains not listed here render through the generic JSON explorer — they are
// still valid routing targets, but the UI should say so rather than imply a
// dedicated experience that doesn't exist yet.
export const FULLY_SUPPORTED_DOMAINS = ['ecommerce', 'hrms', 'security', 'compliance', 'monitoring', 'project_management'];

export const isFullySupportedDomain = (domain) => FULLY_SUPPORTED_DOMAINS.includes(normalizeDomain(domain) || domain);

export const DOMAIN_HINTS = {
  ecommerce: ['products', 'orders', 'customers', 'inventory', 'sales', 'categories', 'cart', 'sku', 'price', 'shipping', 'payment'],
  hrms: ['employees', 'departments', 'attendance', 'leave', 'payroll', 'candidates', 'hiring', 'benefits', 'performance', 'position', 'access_control'],
  cloud: ['cloud', 'instance', 'vm', 'region', 'zone', 'provider', 'compute', 'storage', 'cloud_service'],
  cspm: ['cspm', 'cloud_security_posture', 'misconfiguration', 'policy', 'compliance', 'remediation'],
  devtools: ['devtools', 'developer_tools', 'ci', 'cd', 'pipeline', 'toolchain', 'sdk'],
  endpoint_security: ['endpoint', 'edr', 'endpoint_security', 'malware', 'antivirus', 'host_protection', 'threat_detection'],
  idp: ['idp', 'identity_provider', 'authentication', 'sso', 'openid', 'oauth', 'provisioning', 'iam'],
  itsm: ['itsm', 'ticket', 'incident', 'service_request', 'sla', 'change_request', 'service_desk', 'workflow'],
  project_management: ['projects', 'tasks', 'milestones', 'assignees', 'sprints', 'backlog', 'kanban', 'roadmap'],
  vulnerability_management: ['vulnerabilities', 'cve', 'scan', 'remediation', 'asset', 'risk'],
  security: ['assets', 'vulnerabilities', 'findings', 'controls', 'risks', 'severity', 'incident', 'threat', 'remediation'],
  compliance: ['compliance', 'control', 'audit', 'policy', 'requirement', 'risk', 'assessment', 'criteria', 'governance'],
  monitoring: ['metrics', 'alerts', 'logs', 'observability', 'uptime', 'health', 'incident'],
  generic: [],
};

const normalizeKey = (value) => String(value || '').trim().toLowerCase().replace(/[-_\s]+/g, '_');

export const normalizeDomain = (value) => {
  const normalized = normalizeKey(value);
  for (const [canonical, aliases] of Object.entries(DOMAIN_ALIASES)) {
    if (aliases.includes(normalized)) {
      return canonical;
    }
  }
  return null;
};

export const isSupportedDomain = (value) => {
  return SUPPORTED_DOMAINS.includes(normalizeDomain(value));
};

export const getDefaultDataModel = (domain) => {
  const canonical = normalizeDomain(domain);
  return DEFAULT_DATA_MODEL[canonical] || 'generic';
};

export const getDomainHints = () => DOMAIN_HINTS;
