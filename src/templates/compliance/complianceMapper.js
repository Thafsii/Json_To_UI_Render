import { safeArray, safeObject, safeNumber, getFirstExisting, getNestedValue } from '../shared/dataUtils.js';

const findArray = (root, keys) => {
  for (const key of keys) {
    if (Array.isArray(root[key])) {
      return root[key];
    }
  }
  const entry = Object.entries(root).find(([, value]) => Array.isArray(value));
  return entry ? entry[1] : [];
};

const findSummary = (root) => {
  const candidate = getFirstExisting(root, ['summary', 'overview', 'dashboard']);
  if (candidate && typeof candidate === 'object') {
    return candidate;
  }
  return safeObject(root);
};

export function normalizeComplianceData(data) {
  const root = safeObject(data);
  const summary = safeObject(findSummary(root));

  const criteria = safeArray(findArray(root, ['criteria', 'criteria_list', 'requirements']));
  const controls = safeArray(findArray(root, ['controls', 'control_list']));
  const policies = safeArray(findArray(root, ['policies', 'policy_list']));
  const findings = safeArray(findArray(root, ['findings', 'assessment_findings']));
  const risks = safeArray(findArray(root, ['risks', 'risk_list']));
  const evidence = safeArray(findArray(root, ['evidence', 'evidence_list']));

  return {
    summary,
    criteria,
    controls,
    policies,
    findings,
    risks,
    evidence,
  };
}
