import { safeArray, safeObject, safeNumber, getFirstExisting, getNestedValue, findArray } from '../shared/dataUtils.js';

export function normalizeSecurityData(data) {
  const root = safeObject(data);
  const assets = safeArray(findArray(root, ['assets', 'asset_list', 'inventory']));
  const findings = safeArray(findArray(root, ['findings', 'security_findings', 'issues']));
  const vulnerabilities = safeArray(findArray(root, ['vulnerabilities', 'vulns', 'cves']));
  const risks = safeArray(findArray(root, ['risks', 'risk_list']));
  const controls = safeArray(findArray(root, ['controls', 'control_list']));
  const incidents = safeArray(findArray(root, ['incidents', 'security_incidents', 'events']));

  const summary = safeObject(getFirstExisting(root, ['summary', 'dashboard', 'overview']));
  const totalAssets = safeNumber(getNestedValue(summary, 'total_assets')) ?? assets.length;
  const criticalFindings = safeNumber(getNestedValue(summary, 'critical_findings')) ?? findings.filter((item) => /critical/i.test(String(item.severity))).length;
  const highFindings = safeNumber(getNestedValue(summary, 'high_findings')) ?? findings.filter((item) => /high/i.test(String(item.severity))).length;
  const openFindings = safeNumber(getNestedValue(summary, 'open_findings')) ?? findings.filter((item) => /open|new/i.test(String(item.status))).length;
  const resolvedFindings = safeNumber(getNestedValue(summary, 'resolved_findings')) ?? findings.filter((item) => /resolved|closed/i.test(String(item.status))).length;
  const riskScore = safeNumber(getNestedValue(summary, 'risk_score')) ?? null;

  return {
    summary: { totalAssets, criticalFindings, highFindings, openFindings, resolvedFindings, riskScore },
    assets,
    findings,
    vulnerabilities,
    risks,
    controls,
    incidents,
  };
}
