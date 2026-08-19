const bulletize = (items) => (items && items.length ? items.map((item) => `- ${item}`).join('\n') : '- No items detected.');

const formatPercent = (value) => (typeof value === 'number' ? `${Math.round(value)}%` : '—');

const buildComplianceSection = (domainData) => {
  if (!domainData) {
    return null;
  }

  const { overview, metrics, controls, risks, evidence, remediation } = domainData;
  const lines = ['# Compliance Summary'];

  lines.push('## Executive Summary');
  lines.push(
    `${overview?.framework ? `Framework: ${overview.framework}. ` : ''}${overview?.organization ? `Organization: ${overview.organization}. ` : ''}${
      overview?.status ? `Status: ${overview.status}.` : ''
    }`.trim() || 'No assessment overview metadata was found in this dataset.'
  );

  lines.push('## Compliance Score');
  lines.push(metrics?.overallScore != null ? `Overall score: ${metrics.overallScore}` : 'No overall score was found in this dataset.');

  lines.push('## Control Status');
  if (controls?.items?.length) {
    lines.push(`- Total controls: ${controls.items.length}`);
    lines.push(`- Implemented: ${controls.statusCounts.implemented ?? 0}`);
    lines.push(`- Partially implemented: ${controls.statusCounts.partial ?? 0}`);
    lines.push(`- Not implemented: ${controls.statusCounts.not_implemented ?? 0}`);
  } else {
    lines.push('No control records were found in this dataset.');
  }

  lines.push('## Risks');
  if (risks?.items?.length) {
    lines.push(bulletize(risks.items.slice(0, 10).map((risk) => `${risk.title || risk.id || 'Risk'} — severity: ${risk.severity || 'unknown'}, status: ${risk.status || 'unknown'}`)));
  } else {
    lines.push('No risk records were found in this dataset.');
  }

  lines.push('## Evidence');
  if (evidence?.summary) {
    lines.push(
      `Total: ${evidence.summary.total ?? 0}, Valid: ${evidence.summary.valid ?? 0}, Expired: ${evidence.summary.expired ?? 0}, Missing: ${evidence.summary.missing ?? 0}, Partial: ${evidence.summary.partial ?? 0}`
    );
  } else {
    lines.push('No evidence summary was found in this dataset.');
  }

  lines.push('## Critical Gaps');
  const criticalGaps = (controls?.items || []).filter((control) => /gap|weak|not_implemented/i.test(String(control.status || '')));
  lines.push(bulletize(criticalGaps.slice(0, 10).map((control) => control.name || control.id || 'Control gap')));

  lines.push('## Remediation');
  if (remediation?.items?.length) {
    lines.push(bulletize(remediation.items.slice(0, 10).map((item) => `${item.issue || item.title || 'Remediation item'} — priority: ${item.priority || 'unknown'}, status: ${item.status || 'unknown'}`)));
  } else {
    lines.push('No remediation records were found in this dataset.');
  }

  lines.push('## Recommendations');
  const recommendations = [];
  if (metrics?.criticalGaps) recommendations.push(`Address ${metrics.criticalGaps} critical control gap(s) as a priority.`);
  if (risks?.items?.some((risk) => /high|critical/i.test(String(risk.severity || '')))) recommendations.push('Review and remediate high/critical severity risks.');
  if (evidence?.summary?.expired) recommendations.push('Refresh expired compliance evidence.');
  lines.push(bulletize(recommendations));

  return lines.join('\n\n');
};

const buildSecuritySection = (domainData) => {
  if (!domainData) {
    return null;
  }

  const { summary, assets, vulnerabilities, incidents, findings } = domainData;
  const lines = ['# Security Summary'];

  lines.push('## Security Overview');
  lines.push(
    `Assets: ${summary?.totalAssets ?? assets?.length ?? 0}, Findings: ${findings?.length ?? 0}, Vulnerabilities: ${vulnerabilities?.length ?? 0}, Incidents: ${incidents?.length ?? 0}.`
  );

  lines.push('## Risk Summary');
  lines.push(
    `Critical findings: ${summary?.criticalFindings ?? 0}, High findings: ${summary?.highFindings ?? 0}, Open findings: ${summary?.openFindings ?? 0}, Resolved findings: ${summary?.resolvedFindings ?? 0}.`
  );

  lines.push('## Critical Findings');
  const criticalFindings = (findings || []).filter((item) => /critical/i.test(String(item.severity || '')));
  lines.push(bulletize(criticalFindings.slice(0, 10).map((item) => item.title || item.id || 'Finding')));

  lines.push('## Affected Assets');
  lines.push(bulletize((assets || []).slice(0, 10).map((asset) => asset.name || asset.id || 'Asset')));

  lines.push('## Vulnerabilities');
  lines.push(bulletize((vulnerabilities || []).slice(0, 10).map((vuln) => vuln.cve || vuln.id || vuln.name || 'Vulnerability')));

  lines.push('## Incidents');
  lines.push(bulletize((incidents || []).slice(0, 10).map((incident) => incident.title || incident.id || 'Incident')));

  lines.push('## Recommendations');
  const recommendations = [];
  if (summary?.criticalFindings) recommendations.push('Prioritize remediation of critical severity findings.');
  if ((incidents || []).length) recommendations.push('Review open security incidents for containment status.');
  if ((vulnerabilities || []).length) recommendations.push('Track vulnerability remediation against patch SLAs.');
  lines.push(bulletize(recommendations));

  return lines.join('\n\n');
};

const buildEcommerceSection = (domainData) => {
  if (!domainData) {
    return null;
  }

  const { dashboard, products, orders, customers, inventory } = domainData;
  const lines = ['# E-commerce Summary'];

  lines.push('## Sales Overview');
  lines.push(
    `Revenue: ${dashboard?.totalRevenue ?? '—'}, Orders: ${dashboard?.totalOrders ?? orders?.length ?? 0}, Average order value: ${dashboard?.averageOrderValue ?? '—'}.`
  );

  lines.push('## Products');
  lines.push(`Catalog size: ${products?.length ?? 0} product(s).`);

  lines.push('## Orders');
  lines.push(`${orders?.length ?? 0} order(s) recorded.`);

  lines.push('## Customers');
  lines.push(`Customer count: ${customers?.count ?? '—'}. Top customers tracked: ${customers?.topCustomers?.length ?? 0}.`);

  lines.push('## Inventory');
  lines.push(
    `In stock: ${inventory?.inStock ?? '—'}, Low stock: ${inventory?.lowStock ?? '—'}, Out of stock: ${inventory?.outOfStock ?? '—'}.`
  );

  lines.push('## Key Findings');
  const findings = [];
  if (inventory?.outOfStock) findings.push(`${inventory.outOfStock} product(s) are out of stock.`);
  if (inventory?.lowStock) findings.push(`${inventory.lowStock} product(s) are low on stock.`);
  lines.push(bulletize(findings));

  return lines.join('\n\n');
};

const DOMAIN_SECTION_BUILDERS = {
  compliance: buildComplianceSection,
  security: buildSecuritySection,
  ecommerce: buildEcommerceSection,
};

export function generateReadme({ json, classification, analysis, structure, domainData }) {
  const lines = [];
  const domain = classification ? classification.detectedDomain : 'generic';

  lines.push('# Overview');
  lines.push(analysis?.summary || 'This JSON dataset is described through automatically generated analysis.');
  lines.push('# Domain');
  lines.push(domain || 'generic');

  if (classification) {
    lines.push(`- Confidence: ${formatPercent((classification.confidence || 0) * 100)}`);
    lines.push(`- Domain source: ${classification.domainSource || 'unknown'}`);
  }

  lines.push('# Data Structure');
  if (structure) {
    lines.push(`- Root type: ${structure.root_type}`);
    lines.push(`- Max depth: ${structure.max_depth}`);
    lines.push(`- Top-level repeated collections: ${structure.repeated_object_collections.length}`);
    lines.push(`- Large arrays: ${structure.large_arrays.join(', ') || 'none'}`);
  } else {
    lines.push('- Structure analysis is not available.');
  }

  lines.push('# Key Entities');
  lines.push(bulletize((analysis?.entities || []).map((entity) => `${entity.name} (${entity.count})`)));
  lines.push('# Fields');
  lines.push(bulletize(analysis?.important_fields || []));
  lines.push('# Relationships');
  lines.push(bulletize((analysis?.relationships || []).map((relation) => `${relation.entity}: ${relation.id_fields.join(', ')}`)));
  lines.push('# Important Findings');
  lines.push(analysis?.observations?.length ? bulletize(analysis.observations) : '- No notable findings were automatically detected.');
  lines.push('# Statistics');

  if (structure) {
    lines.push(`- Object count: ${structure.object_count}`);
    lines.push(`- Array count: ${structure.array_count}`);
    lines.push(`- Primitive types: ${Object.entries(structure.primitive_types).map(([type, count]) => `${type}: ${count}`).join(', ')}`);
  } else {
    lines.push('- No statistics available.');
  }

  lines.push('# Use Cases');
  lines.push(analysis?.observations?.length ? bulletize(analysis.observations) : '- Use this dataset for analysis or inspection.');
  lines.push('# JSON Structure');

  if (structure) {
    lines.push(`- Common keys: ${structure.common_keys.slice(0, 12).join(', ') || 'none'}`);
    if (structure.arrays.length) {
      lines.push(`- Detected arrays: ${structure.arrays.map((item) => `${item.path} (${item.length} items)`).join('; ')}`);
    }
  }

  const domainSectionBuilder = DOMAIN_SECTION_BUILDERS[domain];
  const domainSection = domainSectionBuilder ? domainSectionBuilder(domainData) : null;
  if (domainSection) {
    lines.push(domainSection);
  }

  return lines.join('\n\n');
}
