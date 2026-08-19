import { useMemo, useState } from 'react';
import JsonValueRenderer from '../../components/renderer/JsonValueRenderer.jsx';
import MetricGrid from '../../components/shared/MetricGrid.jsx';
import SectionTabs from '../../components/shared/SectionTabs.jsx';
import SearchInput from '../../components/shared/SearchInput.jsx';
import Pagination from '../../components/shared/Pagination.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import DetailPanel from '../../components/shared/DetailPanel.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';
import AiInsightPanel from '../../components/shared/AiInsightPanel.jsx';
import ReportPanel from '../../components/shared/ReportPanel.jsx';
import DistributionChart from '../../components/charts/DistributionChart.jsx';
import { buildBucketedDistribution } from '../../components/charts/chartUtils.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { normalizeSecurityData } from './securityMapper.js';

const sections = [
  { key: 'overview', label: 'Overview' },
  { key: 'findings', label: 'Findings' },
  { key: 'assets', label: 'Assets' },
  { key: 'vulnerabilities', label: 'Vulnerabilities' },
  { key: 'incidents', label: 'Incidents' },
  { key: 'controls', label: 'Controls' },
  { key: 'risks', label: 'Risks' },
];

const SEVERITY_BUCKETS = [
  { label: 'Critical', pattern: /critical/i },
  { label: 'High', pattern: /high/i },
  { label: 'Medium', pattern: /medium/i },
  { label: 'Low', pattern: /low/i },
];

const STATUS_BUCKETS = [
  { label: 'Open', pattern: /open|new/i },
  { label: 'In Progress', pattern: /in[_\s-]?progress|investigating/i },
  { label: 'Resolved', pattern: /resolved|closed|remediated/i },
];

const formatLabel = (key) => String(key || '')
  .replace(/[_-]+/g, ' ')
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/\b\w/g, (chr) => chr.toUpperCase());

const CardGrid = ({ items, titleFields, subtitleFields, emptyTitle, emptyDescription, onSelect }) => {
  if (!items.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => {
        const title = titleFields.map((field) => item?.[field]).find(Boolean) || `Record ${index + 1}`;
        const subtitle = subtitleFields.map((field) => item?.[field]).find(Boolean);
        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(item)}
            className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 text-left transition hover:border-cyan-500"
          >
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm text-slate-400">{subtitle ? String(subtitle) : 'View details'}</p>
          </button>
        );
      })}
    </div>
  );
};

export default function SecurityTemplate({ data, classification, analysis, remoteInsight, remoteAiAvailable, onRequestRemoteInsight, isRequestingRemoteInsight, remoteError, readme, onGenerateReadme, onDownloadReadme }) {
  const normalized = useMemo(() => normalizeSecurityData(data), [data]);
  const [activeSection, setActiveSection] = useState('overview');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const pageSize = 20;
  const debouncedSearch = useDebouncedValue(search);

  const filteredFindings = useMemo(() => {
    if (!debouncedSearch.trim()) return normalized.findings;
    const query = debouncedSearch.toLowerCase();
    return normalized.findings.filter((item) =>
      [item.id, item.title, item.asset, item.severity, item.status].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))
    );
  }, [normalized.findings, debouncedSearch]);

  const pageCount = Math.max(1, Math.ceil(filteredFindings.length / pageSize));
  const visibleFindings = filteredFindings.slice((page - 1) * pageSize, page * pageSize);

  const severityChartData = useMemo(() => buildBucketedDistribution(normalized.findings, ['severity'], SEVERITY_BUCKETS), [normalized.findings]);
  const statusChartData = useMemo(() => buildBucketedDistribution(normalized.findings, ['status'], STATUS_BUCKETS), [normalized.findings]);
  const riskChartData = useMemo(() => buildBucketedDistribution(normalized.risks, ['severity', 'risk_level', 'rating'], SEVERITY_BUCKETS), [normalized.risks]);

  const summaryMetrics = [
    { title: 'Assets', value: normalized.summary.totalAssets ?? '—' },
    { title: 'Critical findings', value: normalized.summary.criticalFindings ?? '—' },
    { title: 'High findings', value: normalized.summary.highFindings ?? '—' },
    { title: 'Open findings', value: normalized.summary.openFindings ?? '—' },
    { title: 'Resolved findings', value: normalized.summary.resolvedFindings ?? '—' },
    { title: 'Risk score', value: normalized.summary.riskScore ?? '—' },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <MetricGrid metrics={summaryMetrics} />
      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionChart title="Findings by severity" data={severityChartData} />
        <DistributionChart title="Findings by status" data={statusChartData} type="pie" />
      </div>
      {riskChartData ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <DistributionChart title="Risk distribution" data={riskChartData} />
        </div>
      ) : null}
      <AiInsightPanel
        analysis={analysis}
        remoteInsight={remoteInsight}
        remoteAiAvailable={remoteAiAvailable}
        onRequestRemoteInsight={onRequestRemoteInsight}
        isRequestingRemoteInsight={isRequestingRemoteInsight}
        remoteError={remoteError}
      />
      <ReportPanel readme={readme} onGenerateReadme={onGenerateReadme} onDownloadReadme={onDownloadReadme} canGenerate={Boolean(analysis)} />
    </div>
  );

  const renderFindings = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Security findings</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Findings table</h2>
            <p className="mt-2 text-sm text-slate-400">{filteredFindings.length} matching findings.</p>
          </div>
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search findings, asset, severity..." />
        </div>
        {visibleFindings.length ? (
          <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
            <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-100">
              <thead className="bg-slate-900/90">
                <tr>
                  {['id', 'title', 'asset', 'severity', 'status', 'detected_at', 'owner'].map((column) => (
                    <th key={column} className="px-4 py-3 font-semibold text-slate-200">{formatLabel(column)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {visibleFindings.map((finding, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'} onClick={() => setSelected(finding)} style={{ cursor: 'pointer' }}>
                    <td className="px-4 py-3 align-top text-slate-100">{finding.id ?? '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100">{finding.title ?? '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100">{finding.asset ?? '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100"><StatusBadge value={finding.severity} /></td>
                    <td className="px-4 py-3 align-top text-slate-100"><StatusBadge value={finding.status} /></td>
                    <td className="px-4 py-3 align-top text-slate-100">{finding.detected_at ?? finding.date ?? '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100">{finding.owner ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No findings found" description="Try a different search or load a dataset with security findings." />
        )}

        <div className="mt-4">
          <Pagination
            currentPage={page}
            pageCount={pageCount}
            onPrevious={() => setPage((value) => Math.max(1, value - 1))}
            onNext={() => setPage((value) => Math.min(pageCount, value + 1))}
          />
        </div>
      </div>
      {selected ? (
        <DetailPanel title="Finding details" onClose={() => setSelected(null)}>
          {Object.entries(selected).map(([key, value]) => (
            <div key={key} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{formatLabel(key)}</div>
              <div className="mt-2 text-sm text-slate-100"><JsonValueRenderer value={value} /></div>
            </div>
          ))}
        </DetailPanel>
      ) : null}
    </div>
  );

  const renderRecordSection = (items, titleFields, subtitleFields, emptyTitle, emptyDescription) => (
    <div className="space-y-6">
      <CardGrid
        items={items}
        titleFields={titleFields}
        subtitleFields={subtitleFields}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        onSelect={setSelectedRecord}
      />
      {selectedRecord ? (
        <DetailPanel title="Record details" onClose={() => setSelectedRecord(null)}>
          {Object.entries(selectedRecord).map(([key, value]) => (
            <div key={key} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{formatLabel(key)}</div>
              <div className="mt-2 text-sm text-slate-100"><JsonValueRenderer value={value} /></div>
            </div>
          ))}
        </DetailPanel>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Security operations</p>
            <h1 className="text-3xl font-semibold text-white">Security dashboard</h1>
            <p className="mt-2 text-sm text-slate-400">Detected domain: {classification.detectedDomain}</p>
          </div>
          <SectionTabs sections={sections} activeSection={activeSection} onSelect={setActiveSection} />
        </div>
      </div>

      <div className="space-y-6">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'findings' && renderFindings()}
        {activeSection === 'assets' &&
          renderRecordSection(
            normalized.assets,
            ['name', 'hostname', 'id'],
            ['type', 'owner', 'criticality'],
            'No asset data found.',
            'This dataset does not provide an asset inventory.'
          )}
        {activeSection === 'vulnerabilities' &&
          renderRecordSection(
            normalized.vulnerabilities,
            ['cve', 'name', 'id'],
            ['severity', 'affected_asset', 'status'],
            'No vulnerability data found.',
            'This dataset does not provide vulnerability information.'
          )}
        {activeSection === 'incidents' &&
          renderRecordSection(
            normalized.incidents,
            ['title', 'name', 'id'],
            ['severity', 'status', 'detected_at'],
            'No incident data found.',
            'This dataset does not provide incident information.'
          )}
        {activeSection === 'controls' &&
          renderRecordSection(
            normalized.controls,
            ['name', 'control_id', 'id'],
            ['status', 'category', 'owner'],
            'No control data found.',
            'This dataset does not provide security control information.'
          )}
        {activeSection === 'risks' &&
          renderRecordSection(
            normalized.risks,
            ['title', 'name', 'id'],
            ['severity', 'status', 'owner'],
            'No risk data found.',
            'This dataset does not provide risk information.'
          )}
      </div>
    </div>
  );
}
