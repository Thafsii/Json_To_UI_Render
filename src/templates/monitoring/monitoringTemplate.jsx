import { useMemo, useState } from 'react';
import JsonValueRenderer from '../../components/renderer/JsonValueRenderer.jsx';
import MetricGrid from '../../components/shared/MetricGrid.jsx';
import SectionTabs from '../../components/shared/SectionTabs.jsx';
import SearchInput from '../../components/shared/SearchInput.jsx';
import Pagination from '../../components/shared/Pagination.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import DetailPanel from '../../components/shared/DetailPanel.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';
import { normalizeMonitoringData } from './monitoringMapper.js';

const sections = [
  { key: 'overview', label: 'Overview' },
  { key: 'metrics', label: 'Metrics' },
  { key: 'alerts', label: 'Alerts' },
  { key: 'hosts', label: 'Hosts' },
  { key: 'logs', label: 'Logs' },
];

const formatLabel = (value) =>
  String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function MonitoringTemplate({ data, classification }) {
  const normalized = normalizeMonitoringData(data);
  const [activeSection, setActiveSection] = useState('overview');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const pageSize = 12;

  const alertColumns = useMemo(() => {
    const set = new Set(['id', 'name', 'status', 'severity', 'source', 'started_at']);
    normalized.alerts.forEach((item) => Object.keys(item || {}).forEach((key) => set.add(key)));
    return Array.from(set).slice(0, 10);
  }, [normalized.alerts]);

  const filteredAlerts = useMemo(() => {
    if (!search.trim()) return normalized.alerts;
    const lowered = search.toLowerCase();
    return normalized.alerts.filter((item) =>
      Object.values(item || {}).some((value) => String(value ?? '').toLowerCase().includes(lowered))
    );
  }, [normalized.alerts, search]);

  const pageCount = Math.max(1, Math.ceil(filteredAlerts.length / pageSize));
  const pageAlerts = filteredAlerts.slice((page - 1) * pageSize, page * pageSize);

  const metrics = [
    { title: 'Hosts', value: normalized.summary.totalHosts ?? '—' },
    { title: 'Active alerts', value: normalized.summary.activeAlerts ?? '—' },
    { title: 'Metric series', value: normalized.summary.totalMetrics ?? '—' },
    { title: 'Avg. latency', value: normalized.summary.averageLatency ?? '—' },
    { title: 'Error rate', value: normalized.summary.errorRate ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Monitoring dashboard</p>
            <h1 className="text-3xl font-semibold text-white">Observability overview</h1>
            <p className="mt-2 text-sm text-slate-400">Detected domain: {classification.domain}</p>
          </div>
          <SectionTabs sections={sections} activeSection={activeSection} onSelect={setActiveSection} />
        </div>
      </div>

      <div className="space-y-6">
        {activeSection === 'overview' && (
          <div className="space-y-6">
            <MetricGrid metrics={metrics} />
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Metric coverage</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Signal summary</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                    <p className="text-sm text-slate-400">Active dashboards</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{normalized.dashboards.length}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                    <p className="text-sm text-slate-400">Log streams</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{normalized.logs.length}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Host summary</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Infrastructure state</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                    <p className="text-sm text-slate-400">Hosts</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{normalized.hosts.length}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                    <p className="text-sm text-slate-400">Events</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{normalized.alerts.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'metrics' && (
          normalized.metrics.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {normalized.metrics.map((metric, index) => (
                <div key={index} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                  <h3 className="text-xl font-semibold text-white">{metric.name ?? metric.metric ?? `Metric ${index + 1}`}</h3>
                  <p className="mt-2 text-sm text-slate-400">{metric.description ?? 'Metric details available.'}</p>
                  <div className="mt-4 text-sm text-slate-100"><JsonValueRenderer value={metric} /></div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No metrics found" description="This dataset does not contain metric series or timeseries data." />
          )
        )}

        {activeSection === 'alerts' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Alert table</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Alert board</h2>
                <p className="mt-2 text-sm text-slate-400">{filteredAlerts.length} alerts matched.</p>
              </div>
              <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search alerts, severity, source..." />
            </div>

            {pageAlerts.length ? (
              <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
                <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-100">
                  <thead className="bg-slate-900/90">
                    <tr>
                      {alertColumns.map((column) => (
                        <th key={column} className="px-4 py-3 font-semibold text-slate-200">{formatLabel(column)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {pageAlerts.map((alert, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'} onClick={() => setSelectedAlert(alert)} style={{ cursor: 'pointer' }}>
                        {alertColumns.map((column) => (
                          <td key={column} className="px-4 py-3 align-top text-slate-100">
                            {column.toLowerCase().includes('status') || column.toLowerCase().includes('severity') ? <StatusBadge value={alert[column]} /> : <JsonValueRenderer value={alert[column]} />}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No alerts found" description="Try a different search or upload a dataset with monitoring alerts." />
            )}

            <div className="mt-4">
              <Pagination currentPage={page} pageCount={pageCount} onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(pageCount, value + 1))} />
            </div>
          </div>
        )}

        {activeSection === 'hosts' && (
          normalized.hosts.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {normalized.hosts.map((host, index) => (
                <div key={index} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                  <h3 className="text-xl font-semibold text-white">{host.name ?? host.hostname ?? `Host ${index + 1}`}</h3>
                  <p className="mt-2 text-sm text-slate-400">{host.status ? `Status: ${host.status}` : 'Host details available.'}</p>
                  <div className="mt-4 text-sm text-slate-100"><JsonValueRenderer value={host} /></div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No hosts found" description="This monitoring dataset does not provide host inventory." />
          )
        )}

        {activeSection === 'logs' && (
          normalized.logs.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {normalized.logs.map((log, index) => (
                <div key={index} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                  <h3 className="text-xl font-semibold text-white">{log.title ?? log.message ?? `Log ${index + 1}`}</h3>
                  <p className="mt-2 text-sm text-slate-400">{log.level ? `Level: ${log.level}` : 'Log item details available.'}</p>
                  <div className="mt-4 text-sm text-slate-100"><JsonValueRenderer value={log} /></div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No log entries" description="This dataset does not contain log data." />
          )
        )}
      </div>

      {selectedAlert ? (
        <DetailPanel title="Alert details" onClose={() => setSelectedAlert(null)}>
          {Object.entries(selectedAlert).map(([key, value]) => (
            <div key={key} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{formatLabel(key)}</div>
              <div className="mt-2 text-sm text-slate-100"><JsonValueRenderer value={value} /></div>
            </div>
          ))}
        </DetailPanel>
      ) : null}
    </div>
  );
}
