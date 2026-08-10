import { useMemo, useState } from 'react';
import JsonValueRenderer from '../../components/renderer/JsonValueRenderer.jsx';
import MetricGrid from '../../components/shared/MetricGrid.jsx';
import SectionTabs from '../../components/shared/SectionTabs.jsx';
import SearchInput from '../../components/shared/SearchInput.jsx';
import Pagination from '../../components/shared/Pagination.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import DetailPanel from '../../components/shared/DetailPanel.jsx';
import { normalizeComplianceData } from './complianceMapper.js';
import StatusBadge from '../../components/shared/StatusBadge.jsx';

const sections = [
  { key: 'overview', label: 'Overview' },
  { key: 'criteria', label: 'Criteria' },
  { key: 'controls', label: 'Controls' },
  { key: 'findings', label: 'Findings' },
  { key: 'risks', label: 'Risks' },
];

const formatLabel = (key) => {
  if (!key) return '';
  return String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (chr) => chr.toUpperCase());
};

const getSummaryMetric = (summary, keyCandidates) => {
  for (const key of keyCandidates) {
    if (summary[key] !== undefined && summary[key] !== null) {
      return summary[key];
    }
  }
  return null;
};

const renderSummaryValue = (summary, keyCandidates) => {
  const value = getSummaryMetric(summary, keyCandidates);
  return value === null || value === undefined ? '—' : String(value);
};

const defaultColumns = ['code', 'area', 'requirement', 'legal_reference', 'requirement_type', 'applicability', 'mapped_controls', 'mapping_status', 'pass_eligible'];

export default function ComplianceTemplate({ data, classification }) {
  const normalized = normalizeComplianceData(data);
  const [activeSection, setActiveSection] = useState('overview');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const pageSize = 12;

  const criteriaColumns = useMemo(() => {
    const keys = new Set(defaultColumns);
    normalized.criteria.forEach((item) => Object.keys(item || {}).forEach((key) => keys.add(key)));
    return Array.from(keys).slice(0, 10);
  }, [normalized.criteria]);

  const filteredCriteria = useMemo(() => {
    if (!search.trim()) {
      return normalized.criteria;
    }
    const lowered = search.toLowerCase();
    return normalized.criteria.filter((item) =>
      Object.values(item || {}).some((value) => String(value ?? '').toLowerCase().includes(lowered))
    );
  }, [normalized.criteria, search]);

  const pageCount = Math.max(1, Math.ceil(filteredCriteria.length / pageSize));
  const currentCriteria = filteredCriteria.slice((page - 1) * pageSize, page * pageSize);

  const metrics = [
    { title: 'Total criteria', value: renderSummaryValue(normalized.summary, ['total_criteria', 'totalCriteria']) },
    { title: 'Valid', value: renderSummaryValue(normalized.summary, ['valid']) },
    { title: 'Partially valid', value: renderSummaryValue(normalized.summary, ['partially_valid', 'partiallyValid']) },
    { title: 'Weak', value: renderSummaryValue(normalized.summary, ['weak']) },
    { title: 'Gap', value: renderSummaryValue(normalized.summary, ['gap']) },
    { title: 'Not applicable', value: renderSummaryValue(normalized.summary, ['not_applicable', 'notApplicable']) },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <MetricGrid metrics={metrics} />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Summary</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Compliance snapshot</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
              <p className="text-sm text-slate-400">Criteria collection</p>
              <p className="mt-3 text-2xl font-semibold text-white">{normalized.criteria.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
              <p className="text-sm text-slate-400">Control items</p>
              <p className="mt-3 text-2xl font-semibold text-white">{normalized.controls.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Policy overview</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Governance data</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
              <p className="text-sm text-slate-400">Policies</p>
              <p className="mt-3 text-2xl font-semibold text-white">{normalized.policies.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
              <p className="text-sm text-slate-400">Findings</p>
              <p className="mt-3 text-2xl font-semibold text-white">{normalized.findings.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCriteria = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Criteria management</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Criteria table</h2>
          </div>
          <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search criteria, requirement, status..." />
        </div>
        <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
          <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-100">
            <thead className="bg-slate-900/90">
              <tr>
                {criteriaColumns.map((column) => (
                  <th key={column} className="px-4 py-3 font-semibold text-slate-200">{formatLabel(column)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {currentCriteria.length ? currentCriteria.map((item, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'}>
                  {criteriaColumns.map((column) => (
                    <td key={column} className="px-4 py-3 align-top text-slate-100">
                      {column.toLowerCase().includes('status') ? <StatusBadge value={item[column]} /> : <JsonValueRenderer value={item[column]} />}
                    </td>
                  ))}
                </tr>
              )) : (
                <tr>
                  <td colSpan={criteriaColumns.length} className="px-4 py-8 text-center text-slate-400">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Pagination
            currentPage={page}
            pageCount={pageCount}
            onPrevious={() => setPage((value) => Math.max(1, value - 1))}
            onNext={() => setPage((value) => Math.min(pageCount, value + 1))}
          />
        </div>
      </div>
      {selectedItem ? (
        <DetailPanel title="Criterion details" onClose={() => setSelectedItem(null)}>
          {Object.entries(selectedItem).map(([key, value]) => (
            <div key={key} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{formatLabel(key)}</div>
              <div className="mt-2 text-sm text-slate-100"><JsonValueRenderer value={value} /></div>
            </div>
          ))}
        </DetailPanel>
      ) : null}
    </div>
  );

  const renderEmpty = () => <EmptyState title="No records available" description="This compliance dataset does not contain enough structured records to display." />;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Compliance dashboard</p>
            <h1 className="text-3xl font-semibold text-white">GRC overview</h1>
            <p className="mt-2 text-sm text-slate-400">Detected domain: {classification.domain}</p>
          </div>
          <SectionTabs sections={sections} activeSection={activeSection} onSelect={setActiveSection} />
        </div>
      </div>

      <div className="space-y-6">
        {activeSection === 'overview' && renderOverview()}
        {activeSection === 'criteria' && (normalized.criteria.length ? renderCriteria() : renderEmpty())}
        {activeSection === 'controls' && (normalized.controls.length ? <EmptyState title="Controls section" description="Controls data is available but not yet rendered in full detail." /> : renderEmpty())}
        {activeSection === 'findings' && (normalized.findings.length ? <EmptyState title="Findings section" description="Findings data is available but not yet rendered in full detail." /> : renderEmpty())}
        {activeSection === 'risks' && (normalized.risks.length ? <EmptyState title="Risks section" description="Risk data is available but not yet rendered in full detail." /> : renderEmpty())}
      </div>
    </div>
  );
}
