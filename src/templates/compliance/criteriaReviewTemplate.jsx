import { useMemo, useState } from 'react';
import JsonValueRenderer from '../../components/renderer/JsonValueRenderer.jsx';
import MetricGrid from '../../components/shared/MetricGrid.jsx';
import SectionTabs from '../../components/shared/SectionTabs.jsx';
import SearchInput from '../../components/shared/SearchInput.jsx';
import Pagination from '../../components/shared/Pagination.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import DetailPanel from '../../components/shared/DetailPanel.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';
import ProgressBar from '../../components/shared/ProgressBar.jsx';
import AiInsightPanel from '../../components/shared/AiInsightPanel.jsx';
import ReportPanel from '../../components/shared/ReportPanel.jsx';
import DistributionChart from '../../components/charts/DistributionChart.jsx';
import { buildBucketedDistribution } from '../../components/charts/chartUtils.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { normalizeComplianceData } from './complianceMapper.js';

const sections = [
  { key: 'overview', label: 'Overview' },
  { key: 'controls', label: 'Controls' },
  { key: 'risks', label: 'Risks' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'remediation', label: 'Remediation' },
];

const formatLabel = (key) =>
  String(key || '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (chr) => chr.toUpperCase());

const CONTROL_STATUS_BUCKETS = [
  { label: 'Implemented', pattern: /implement(ed)?$|valid|complete|compliant|met/i },
  { label: 'Partially Implemented', pattern: /partial/i },
  { label: 'Not Implemented', pattern: /not[_\s-]?implemented|missing|gap|weak/i },
];

export default function ComplianceCriteriaTemplate({ data, classification, analysis, remoteInsight, remoteAiAvailable, onRequestRemoteInsight, isRequestingRemoteInsight, remoteError, readme, onGenerateReadme, onDownloadReadme }) {
  const normalized = useMemo(() => normalizeComplianceData(data), [data]);
  const [activeSection, setActiveSection] = useState('overview');

  const [controlSearch, setControlSearch] = useState('');
  const [controlPage, setControlPage] = useState(1);
  const [selectedControl, setSelectedControl] = useState(null);
  const debouncedControlSearch = useDebouncedValue(controlSearch);

  const [riskSearch, setRiskSearch] = useState('');
  const [riskPage, setRiskPage] = useState(1);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const debouncedRiskSearch = useDebouncedValue(riskSearch);

  const pageSize = 12;

  const filteredControls = useMemo(() => {
    if (!debouncedControlSearch.trim()) return normalized.controls.items;
    const query = debouncedControlSearch.toLowerCase();
    return normalized.controls.items.filter((control) =>
      [control.id, control.name, control.category, control.status, control.risk, control.owner].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))
    );
  }, [normalized.controls.items, debouncedControlSearch]);

  const filteredRisks = useMemo(() => {
    if (!debouncedRiskSearch.trim()) return normalized.risks.items;
    const query = debouncedRiskSearch.toLowerCase();
    return normalized.risks.items.filter((risk) =>
      [risk.id, risk.title, risk.severity, risk.status, risk.owner].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))
    );
  }, [normalized.risks.items, debouncedRiskSearch]);

  const controlPageCount = Math.max(1, Math.ceil(filteredControls.length / pageSize));
  const visibleControls = filteredControls.slice((controlPage - 1) * pageSize, controlPage * pageSize);

  const riskPageCount = Math.max(1, Math.ceil(filteredRisks.length / pageSize));
  const visibleRisks = filteredRisks.slice((riskPage - 1) * pageSize, riskPage * pageSize);

  const controlStatusChartData = useMemo(
    () => buildBucketedDistribution(normalized.controls.items, ['status'], CONTROL_STATUS_BUCKETS),
    [normalized.controls.items]
  );

  const riskSeverityChartData = useMemo(
    () =>
      buildBucketedDistribution(normalized.risks.items, ['severity'], [
        { label: 'Critical', pattern: /critical/i },
        { label: 'High', pattern: /high/i },
        { label: 'Medium', pattern: /medium/i },
        { label: 'Low', pattern: /low/i },
      ]),
    [normalized.risks.items]
  );

  const evidenceStatusChartData = useMemo(
    () =>
      buildBucketedDistribution(normalized.evidence.items, ['status'], [
        { label: 'Valid', pattern: /valid/i },
        { label: 'Expired', pattern: /expired/i },
        { label: 'Missing', pattern: /missing/i },
        { label: 'Partial', pattern: /partial/i },
      ]),
    [normalized.evidence.items]
  );

  const metrics = [
    { title: 'Overall score', value: normalized.metrics.overallScore ?? '—' },
    { title: 'Total controls', value: normalized.metrics.totalControls ?? '—' },
    { title: 'Implemented', value: normalized.metrics.implemented ?? '—' },
    { title: 'Partial', value: normalized.metrics.partial ?? '—' },
    { title: 'Not implemented', value: normalized.metrics.notImplemented ?? '—' },
    { title: 'Critical gaps', value: normalized.metrics.criticalGaps ?? '—' },
    { title: 'High risk gaps', value: normalized.metrics.highRiskGaps ?? '—' },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Compliance overview</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Framework</p>
            <p className="mt-1 text-white">{normalized.overview.framework || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Organization</p>
            <p className="mt-1 text-white">{normalized.overview.organization || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Assessment date</p>
            <p className="mt-1 text-white">{normalized.overview.assessmentDate || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Status</p>
            <p className="mt-1 text-white">{normalized.overview.status ? <StatusBadge value={normalized.overview.status} /> : '—'}</p>
          </div>
        </div>
      </div>

      <MetricGrid metrics={metrics} />

      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionChart title="Control status" data={controlStatusChartData} type="pie" />
        <DistributionChart title="Risk severity" data={riskSeverityChartData} />
      </div>

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

  const renderControls = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Controls</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Control assessment</h2>
            <p className="mt-2 text-sm text-slate-400">{filteredControls.length} controls found.</p>
          </div>
          <SearchInput value={controlSearch} onChange={(value) => { setControlSearch(value); setControlPage(1); }} placeholder="Search control ID, name, category, owner..." />
        </div>

        {visibleControls.length ? (
          <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
            <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-100">
              <thead className="bg-slate-900/90">
                <tr>
                  {['id', 'name', 'category', 'status', 'risk', 'owner'].map((column) => (
                    <th key={column} className="px-4 py-3 font-semibold text-slate-200">{formatLabel(column)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {visibleControls.map((control, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'} onClick={() => setSelectedControl(control)} style={{ cursor: 'pointer' }}>
                    <td className="px-4 py-3 align-top text-slate-100">{control.id ?? '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100">{control.name ?? '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100">{control.category ?? '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100"><StatusBadge value={control.status} /></td>
                    <td className="px-4 py-3 align-top text-slate-100">{control.risk ? <StatusBadge value={control.risk} /> : '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100">{control.owner ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState title="No controls found" description="This dataset does not contain any control records, or none match your search." />
          </div>
        )}

        <div className="mt-4">
          <Pagination currentPage={controlPage} pageCount={controlPageCount} onPrevious={() => setControlPage((value) => Math.max(1, value - 1))} onNext={() => setControlPage((value) => Math.min(controlPageCount, value + 1))} />
        </div>
      </div>

      {selectedControl ? (
        <DetailPanel title="Control details" onClose={() => setSelectedControl(null)}>
          {[
            ['Control', selectedControl.name],
            ['Status', selectedControl.status],
            ['Risk', selectedControl.risk],
            ['Owner', selectedControl.owner],
            ['Evidence', selectedControl.evidence],
            ['Gaps', selectedControl.gaps],
            ['Recommendation', selectedControl.recommendation],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</div>
              <div className="mt-2 text-sm text-slate-100">{value ? <JsonValueRenderer value={value} /> : '—'}</div>
            </div>
          ))}
        </DetailPanel>
      ) : null}
    </div>
  );

  const renderRisks = () => (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Risks</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Risk register</h2>
            <p className="mt-2 text-sm text-slate-400">{filteredRisks.length} risks found.</p>
          </div>
          <SearchInput value={riskSearch} onChange={(value) => { setRiskSearch(value); setRiskPage(1); }} placeholder="Search risk ID, title, owner..." />
        </div>

        {visibleRisks.length ? (
          <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
            <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-100">
              <thead className="bg-slate-900/90">
                <tr>
                  {['id', 'title', 'severity', 'likelihood', 'impact', 'status', 'owner', 'dueDate'].map((column) => (
                    <th key={column} className="px-4 py-3 font-semibold text-slate-200">{formatLabel(column === 'dueDate' ? 'due date' : column)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {visibleRisks.map((risk, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'} onClick={() => setSelectedRisk(risk)} style={{ cursor: 'pointer' }}>
                    <td className="px-4 py-3 align-top text-slate-100">{risk.id ?? '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100">{risk.title ?? '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100"><StatusBadge value={risk.severity} /></td>
                    <td className="px-4 py-3 align-top text-slate-100">{risk.likelihood ?? '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100">{risk.impact ?? '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100"><StatusBadge value={risk.status} /></td>
                    <td className="px-4 py-3 align-top text-slate-100">{risk.owner ?? '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100">{risk.dueDate ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState title="No risks found" description="This dataset does not contain any risk records, or none match your search." />
          </div>
        )}

        <div className="mt-4">
          <Pagination currentPage={riskPage} pageCount={riskPageCount} onPrevious={() => setRiskPage((value) => Math.max(1, value - 1))} onNext={() => setRiskPage((value) => Math.min(riskPageCount, value + 1))} />
        </div>
      </div>

      {selectedRisk ? (
        <DetailPanel title="Risk details" onClose={() => setSelectedRisk(null)}>
          {Object.entries(selectedRisk)
            .filter(([key]) => key !== 'raw')
            .map(([key, value]) => (
              <div key={key} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{formatLabel(key)}</div>
                <div className="mt-2 text-sm text-slate-100">{value ? <JsonValueRenderer value={value} /> : '—'}</div>
              </div>
            ))}
        </DetailPanel>
      ) : null}
    </div>
  );

  const renderEvidence = () => (
    <div className="space-y-6">
      {normalized.evidence.summary ? (
        <MetricGrid
          metrics={[
            { title: 'Total', value: normalized.evidence.summary.total ?? '—' },
            { title: 'Valid', value: normalized.evidence.summary.valid ?? '—' },
            { title: 'Expired', value: normalized.evidence.summary.expired ?? '—' },
            { title: 'Missing', value: normalized.evidence.summary.missing ?? '—' },
            { title: 'Partial', value: normalized.evidence.summary.partial ?? '—' },
          ]}
        />
      ) : (
        <EmptyState title="No evidence summary" description="This dataset does not include an evidence summary." />
      )}

      <DistributionChart title="Evidence status" data={evidenceStatusChartData} type="pie" />

      {normalized.evidence.items.length ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Evidence records</p>
          <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
            <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-100">
              <thead className="bg-slate-900/90">
                <tr>
                  {['id', 'name', 'status', 'relatedControl', 'collectedAt'].map((column) => (
                    <th key={column} className="px-4 py-3 font-semibold text-slate-200">{formatLabel(column === 'relatedControl' ? 'control' : column === 'collectedAt' ? 'collected at' : column)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {normalized.evidence.items.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'}>
                    <td className="px-4 py-3 align-top text-slate-100">{item.id ?? '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100">{item.name ?? '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100"><StatusBadge value={item.status} /></td>
                    <td className="px-4 py-3 align-top text-slate-100">{item.relatedControl ?? '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100">{item.collectedAt ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderRemediation = () => (
    <div className="space-y-6">
      {normalized.remediation.items.length ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Remediation plan</p>
          <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
            <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-100">
              <thead className="bg-slate-900/90">
                <tr>
                  {['issue', 'priority', 'owner', 'status', 'dueDate', 'progress'].map((column) => (
                    <th key={column} className="px-4 py-3 font-semibold text-slate-200">{formatLabel(column === 'dueDate' ? 'due date' : column)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {normalized.remediation.items.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'}>
                    <td className="px-4 py-3 align-top text-slate-100">{item.issue ?? '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100">{item.priority ? <StatusBadge value={item.priority} /> : '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100">{item.owner ?? '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100"><StatusBadge value={item.status} /></td>
                    <td className="px-4 py-3 align-top text-slate-100">{item.dueDate ?? '—'}</td>
                    <td className="px-4 py-3 align-top text-slate-100"><ProgressBar value={item.progress} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState title="No remediation data" description="This dataset does not contain a remediation plan." />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Compliance dashboard</p>
            <h1 className="text-3xl font-semibold text-white">{normalized.overview.framework ? `${normalized.overview.framework} assessment` : 'Compliance overview'}</h1>
            <p className="mt-2 text-sm text-slate-400">Detected domain: {classification.detectedDomain} • Confidence: {Math.round((classification.confidence ?? 0) * 100)}%</p>
          </div>
          <SectionTabs sections={sections} activeSection={activeSection} onSelect={setActiveSection} />
        </div>
      </div>

      {activeSection === 'overview' && renderOverview()}
      {activeSection === 'controls' && renderControls()}
      {activeSection === 'risks' && renderRisks()}
      {activeSection === 'evidence' && renderEvidence()}
      {activeSection === 'remediation' && renderRemediation()}
    </div>
  );
}
