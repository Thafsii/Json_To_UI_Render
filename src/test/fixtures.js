export const ecommerceFixture = {
  domain: 'ecommerce',
  products: [
    { id: 'p1', name: 'Widget', category: 'Gadgets', brand: 'Acme', price: 19.99, stock: 12 },
    { id: 'p2', name: 'Gizmo', category: 'Gadgets', brand: 'Acme', price: 29.99, stock: 0 },
    { id: 'p3', name: 'Doohickey', category: 'Tools', brand: 'Beta', price: 9.99, stock: 50 },
  ],
  orders: [
    { order_id: 'o1', customer: { name: 'Alice' }, total: 49.98, status: 'delivered' },
    { order_id: 'o2', customer: { name: 'Bob' }, total: 9.99, status: 'pending' },
    { order_id: 'o3', customer: { name: 'Carol' }, total: 29.99, status: 'cancelled' },
  ],
  categories: [
    { name: 'Gadgets', products: 2, revenue: 49.98 },
    { name: 'Tools', products: 1, revenue: 9.99 },
  ],
  sales: {
    daily: [
      { date: '2026-08-01', orders: 3, revenue: 100 },
      { date: '2026-08-02', orders: 5, revenue: 200 },
      { date: '2026-08-03', orders: 2, revenue: 50 },
    ],
    by_category: [
      { category: 'Gadgets', orders: 4, revenue: 300 },
      { category: 'Tools', orders: 1, revenue: 50 },
    ],
  },
  customers: {
    total: 3,
    top_customers: [{ name: 'Alice', orders: 5, total_spent: 500 }],
  },
  dashboard: { total_revenue: 350, total_orders: 3 },
};

export const complianceFixture = {
  domain: 'compliance',
  assessment: { framework: 'SOC 2', organization: 'Acme Corp', date: '2026-06-01', status: 'in_progress' },
  summary: { total_criteria: 4, valid: 2, partially_valid: 1, gap: 1, critical_gaps: 1, high_risk_gaps: 1 },
  controls: [
    { control_id: 'C-1', name: 'Access Control', category: 'Security', status: 'implemented', risk: 'low', owner: 'IT' },
    { control_id: 'C-2', name: 'Backup Policy', category: 'Operations', status: 'partial', risk: 'medium', owner: 'Ops' },
    { control_id: 'C-3', name: 'Incident Response', category: 'Security', status: 'not_implemented', risk: 'high', owner: 'Security' },
    { control_id: 'C-4', name: 'Change Management', category: 'Operations', status: 'implemented', risk: 'low', owner: 'Eng' },
  ],
  risks: [
    { risk_id: 'R-1', title: 'Unpatched systems', severity: 'high', likelihood: 'medium', impact: 'high', status: 'open', owner: 'IT', due_date: '2026-09-01' },
    { risk_id: 'R-2', title: 'Weak passwords', severity: 'medium', likelihood: 'low', impact: 'medium', status: 'mitigated', owner: 'IT', due_date: '2026-08-15' },
  ],
  evidence: [
    { evidence_id: 'E-1', name: 'Access review log', status: 'valid', control_id: 'C-1', collected_at: '2026-05-01' },
    { evidence_id: 'E-2', name: 'Backup test report', status: 'expired', control_id: 'C-2', collected_at: '2026-01-01' },
  ],
  remediation: [
    { issue: 'Implement IR plan', priority: 'high', owner: 'Security', status: 'in_progress', due_date: '2026-09-15', progress: 40 },
  ],
};

export const securityFixture = {
  domain: 'security',
  summary: { total_assets: 3 },
  assets: [
    { id: 'a1', name: 'web-server-1', type: 'server', owner: 'IT', criticality: 'high' },
    { id: 'a2', name: 'db-server-1', type: 'database', owner: 'IT', criticality: 'critical' },
  ],
  findings: [
    { id: 'f1', title: 'Outdated TLS', asset: 'web-server-1', severity: 'high', status: 'open', owner: 'IT' },
    { id: 'f2', title: 'SQL injection', asset: 'db-server-1', severity: 'critical', status: 'resolved', owner: 'Security' },
    { id: 'f3', title: 'Weak cipher', asset: 'web-server-1', severity: 'medium', status: 'open', owner: 'IT' },
  ],
  vulnerabilities: [
    { id: 'v1', cve: 'CVE-2024-0001', severity: 'high', affected_asset: 'web-server-1', status: 'open' },
  ],
  incidents: [
    { id: 'i1', title: 'Unauthorized access attempt', severity: 'high', status: 'resolved', detected_at: '2026-07-01' },
  ],
  controls: [
    { control_id: 'SC-1', name: 'MFA enforcement', status: 'implemented', owner: 'IT' },
  ],
  risks: [
    { id: 'r1', title: 'Data exfiltration risk', severity: 'high', status: 'open', owner: 'Security' },
  ],
};

export const hrFixture = {
  domain: 'hrms',
  employees: [
    { id: 'e1', name: 'John Doe', department: 'Engineering', status: 'active' },
    { id: 'e2', name: 'Jane Roe', department: 'Sales', status: 'active' },
    { id: 'e3', name: 'Sam Lee', department: 'Engineering', status: 'on_leave' },
  ],
  departments: [{ name: 'Engineering', manager: 'Sue' }, { name: 'Sales', manager: 'Tom' }],
  open_positions: [{ title: 'Backend Engineer', department: 'Engineering' }],
};

export const monitoringFixture = {
  domain: 'monitoring',
  alerts: [
    { id: 'al1', name: 'High CPU', severity: 'critical', status: 'active', started_at: '2026-08-01T10:00:00Z' },
    { id: 'al2', name: 'Disk space low', severity: 'medium', status: 'resolved', started_at: '2026-08-02T10:00:00Z' },
    { id: 'al3', name: 'Latency spike', severity: 'high', status: 'active', started_at: '2026-08-03T10:00:00Z' },
  ],
  hosts: [{ name: 'host-1', status: 'healthy' }, { name: 'host-2', status: 'degraded' }],
};

export const projectManagementFixture = {
  domain: 'project_management',
  projects: [{ name: 'Website Revamp', status: 'active' }],
  tasks: [
    { id: 't1', title: 'Design homepage', status: 'in_progress', priority: 'high', assignee: 'Alice' },
    { id: 't2', title: 'Write copy', status: 'to_do', priority: 'medium', assignee: 'Bob' },
    { id: 't3', title: 'QA testing', status: 'done', priority: 'low', assignee: 'Carol' },
  ],
  milestones: [{ name: 'Launch', status: 'pending' }],
};

export const unknownFixture = {
  organization: { id: 'org-1', name: 'Mystery Inc' },
  widgets: [{ id: 1, color: 'red' }, { id: 2, color: 'blue' }],
};
