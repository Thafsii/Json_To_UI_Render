import { safeArray, safeObject, safeNumber, safeString, getFirstExisting, getNestedValue, findArray } from '../shared/dataUtils.js';

const pick = (item, keys) => {
  for (const key of keys) {
    const value = getNestedValue(item, key) ?? item?.[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return null;
};

const normalizeStatusBucket = (status) => {
  const text = String(status || '').toLowerCase();
  if (/not[_\s-]?implemented|missing|gap/.test(text)) return 'not_implemented';
  if (/partial/.test(text)) return 'partial';
  if (/implement|valid|complete|compliant|met/.test(text)) return 'implemented';
  return 'unknown';
};

const normalizeControl = (item) => ({
  id: pick(item, ['control_id', 'id', 'code']),
  name: pick(item, ['name', 'title', 'control_name', 'criteria']),
  category: pick(item, ['category', 'domain', 'family', 'group']),
  status: pick(item, ['status', 'implementation_status', 'validity']),
  risk: pick(item, ['risk', 'risk_level', 'severity']),
  owner: pick(item, ['owner', 'responsible', 'assigned_to']),
  evidence: pick(item, ['evidence', 'evidence_reference', 'proof']),
  gaps: pick(item, ['gaps', 'gap', 'deficiency']),
  recommendation: pick(item, ['recommendation', 'remediation', 'suggested_action']),
  raw: item,
});

const normalizeRisk = (item) => ({
  id: pick(item, ['risk_id', 'id', 'code']),
  title: pick(item, ['title', 'name', 'description']),
  severity: pick(item, ['severity', 'risk_level', 'rating']),
  likelihood: pick(item, ['likelihood', 'probability']),
  impact: pick(item, ['impact', 'consequence']),
  status: pick(item, ['status', 'state']),
  owner: pick(item, ['owner', 'responsible', 'assigned_to']),
  dueDate: pick(item, ['due_date', 'target_date', 'remediation_date']),
  raw: item,
});

const normalizeRemediation = (item) => ({
  issue: pick(item, ['issue', 'title', 'name', 'finding']),
  priority: pick(item, ['priority', 'severity']),
  owner: pick(item, ['owner', 'responsible', 'assigned_to']),
  status: pick(item, ['status', 'state']),
  dueDate: pick(item, ['due_date', 'target_date']),
  progress: safeNumber(pick(item, ['progress', 'percent_complete', 'completion'])),
  raw: item,
});

const normalizeEvidenceItem = (item) => ({
  id: pick(item, ['evidence_id', 'id']),
  name: pick(item, ['name', 'title', 'description']),
  status: pick(item, ['status', 'validity']),
  relatedControl: pick(item, ['control_id', 'related_control', 'control']),
  collectedAt: pick(item, ['collected_at', 'date', 'submitted_at']),
  raw: item,
});

export function normalizeComplianceData(data) {
  const root = safeObject(data);
  const assessment = safeObject(getFirstExisting(root, ['assessment', 'audit', 'review']));
  const summary = safeObject(getFirstExisting(root, ['summary', 'overview', 'assessment_summary']));

  const controlsRaw = safeArray(findArray(root, ['controls', 'control_list', 'criteria', 'requirements']));
  const risksRaw = safeArray(findArray(root, ['risks', 'risk_list', 'risk_register']));
  const remediationRaw = safeArray(findArray(root, ['remediation', 'remediation_plan', 'remediation_items', 'action_plan']));
  const evidenceRoot = getFirstExisting(root, ['evidence', 'evidence_list']);
  const evidenceRaw = safeArray(Array.isArray(evidenceRoot) ? evidenceRoot : findArray(root, ['evidence_items']));
  const evidenceSummaryRaw = safeObject(getFirstExisting(root, ['evidence_summary']) || (!Array.isArray(evidenceRoot) ? evidenceRoot : null));

  const overview = {
    framework: safeString(pick(root, ['framework', 'compliance_framework']) || pick(assessment, ['framework'])),
    organization: safeString(pick(root, ['organization', 'organization_name']) || pick(assessment, ['organization'])),
    assessmentDate: safeString(pick(assessment, ['date', 'assessment_date', 'completed_at']) || pick(root, ['assessment_date'])),
    status: safeString(pick(assessment, ['status', 'overall_status']) || pick(root, ['status'])),
  };

  const controls = controlsRaw.map(normalizeControl);
  const statusCounts = controls.reduce(
    (acc, control) => {
      const bucket = normalizeStatusBucket(control.status);
      acc[bucket] = (acc[bucket] || 0) + 1;
      return acc;
    },
    { implemented: 0, partial: 0, not_implemented: 0, unknown: 0 }
  );

  const risks = risksRaw.map(normalizeRisk);
  const remediation = remediationRaw.map(normalizeRemediation);
  const evidenceItems = evidenceRaw.filter((item) => item && typeof item === 'object' && !Array.isArray(item)).map(normalizeEvidenceItem);

  const criticalGaps = safeNumber(pick(summary, ['critical_gaps', 'critical_control_gaps'])) ?? statusCounts.not_implemented;
  const highRiskGaps = safeNumber(pick(summary, ['high_risk_gaps'])) ?? risks.filter((risk) => /high|critical/i.test(String(risk.severity || ''))).length;

  const metrics = {
    overallScore: safeNumber(pick(summary, ['overall_score', 'score', 'compliance_score'])),
    totalControls: safeNumber(pick(summary, ['total_criteria', 'total_controls'])) ?? controls.length,
    implemented: safeNumber(pick(summary, ['valid', 'implemented'])) ?? statusCounts.implemented,
    partial: safeNumber(pick(summary, ['partially_valid', 'partial'])) ?? statusCounts.partial,
    notImplemented: safeNumber(pick(summary, ['gap', 'not_implemented'])) ?? statusCounts.not_implemented,
    criticalGaps,
    highRiskGaps,
  };

  const evidenceSummary = {
    total: safeNumber(pick(evidenceSummaryRaw, ['total'])) ?? evidenceItems.length,
    valid: safeNumber(pick(evidenceSummaryRaw, ['valid'])) ?? evidenceItems.filter((item) => /valid/i.test(String(item.status || ''))).length,
    expired: safeNumber(pick(evidenceSummaryRaw, ['expired'])) ?? evidenceItems.filter((item) => /expired/i.test(String(item.status || ''))).length,
    missing: safeNumber(pick(evidenceSummaryRaw, ['missing'])) ?? evidenceItems.filter((item) => /missing/i.test(String(item.status || ''))).length,
    partial: safeNumber(pick(evidenceSummaryRaw, ['partial'])) ?? evidenceItems.filter((item) => /partial/i.test(String(item.status || ''))).length,
  };

  const hasEvidenceSummary = Object.keys(evidenceSummaryRaw).length > 0 || evidenceItems.length > 0;

  return {
    overview,
    metrics,
    controls: { items: controls, statusCounts },
    risks: { items: risks },
    evidence: { summary: hasEvidenceSummary ? evidenceSummary : null, items: evidenceItems },
    remediation: { items: remediation },
  };
}
