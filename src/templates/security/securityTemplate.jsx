import { useState } from 'react';
import JsonValueRenderer from '../../components/renderer/JsonValueRenderer.jsx';
import MetricGrid from '../../components/shared/MetricGrid.jsx';
import SectionTabs from '../../components/shared/SectionTabs.jsx';
import SearchInput from '../../components/shared/SearchInput.jsx';
import Pagination from '../../components/shared/Pagination.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import DetailPanel from '../../components/shared/DetailPanel.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';
import { normalizeSecurityData } from './securityMapper.js';

const sections = [
  { key: 'overview', label: 'Overview' },
  { key: 'findings', label: 'Findings' },
  { key: 'assets', label: 'Assets' },
  { key: 'vulnerabilities', label: 'Vulnerabilities' },
  { key: 'incidents', label: 'Incidents' },
  { key: 'controls', label: 'Controls' },
];

const formatLabel = (key) => String(key || '')
  .replace(/[_-]+/g, ' ')
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/\b\w/g, (chr) => chr.toUpperCase());

export default function SecurityTemplate({ data, classification }) {
  const normalized = normalizeSecurityData(data);
  const [activeSection, setActiveSection] = useState('overview');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const pageSize = 20;

  const filteredFindings = normalized.findings.filter((item) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return [item.id, item.title, item.asset, item.severity, item.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const pageCount = Math.max(1, Math.ceil(filteredFindings.length / pageSize));
  const visibleFindings = filteredFindings.slice((page - 1) * pageSize, page * pageSize);

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
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Threat overview</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Security posture</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
              <p className="text-sm text-slate-400">Vulnerabilities</p>
              <p className="mt-3 text-2xl font-semibold text-white">{normalized.vulnerabilities.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
              <p className="text-sm text-slate-400">Incidents</p>
              <p className="mt-3 text-2xl font-semibold text-white">{normalized.incidents.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Asset health</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Asset inventory</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
              <p className="text-sm text-slate-400">Asset count</p>
              <p className="mt-3 text-2xl font-semibold text-white">{normalized.assets.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
              <p className="text-sm text-slate-400">Controls</p>
              <p className="mt-3 text-2xl font-semibold text-white">{normalized.controls.length}</p>
            </div>
          </div>
        </div>
      </div>
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

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Security operations</p>
            <h1 className="text-3xl font-semibold text-white">Security dashboard</h1>
            <p className="mt-2 text-sm text-slate-400">Detected domain: {classification.domain}</p>
          </div>
          <SectionTabs sections={sections} activeSection={activeSection} onSelect={setActiveSection} />
        </div>
      </div>

      <div className="space-y-6">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'findings' && renderFindings()}
        {activeSection === 'assets' && (normalized.assets.length ? <EmptyState title="Assets available" description="Asset list rendering will be added here." /> : <EmptyState title="No assets" description="This dataset does not provide asset inventory." />)}
        {activeSection === 'vulnerabilities' && (normalized.vulnerabilities.length ? <EmptyState title="Vulnerabilities available" description="Vulnerabilities rendering will be added here." /> : <EmptyState title="No vulnerabilities" description="This dataset does not provide vulnerability information." />)}
        {activeSection === 'incidents' && (normalized.incidents.length ? <EmptyState title="Incidents available" description="Incident rendering will be added here." /> : <EmptyState title="No incidents" description="This dataset does not provide incident information." />)}
        {activeSection === 'controls' && (normalized.controls.length ? <EmptyState title="Controls available" description="Control rendering will be added here." /> : <EmptyState title="No controls" description="This dataset does not provide control information." />)}
      </div>
    </div>
  );
}
