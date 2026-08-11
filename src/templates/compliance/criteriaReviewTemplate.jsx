import { useMemo, useState } from 'react';

const STATUS_STYLES = {
  VALID: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
  PARTIALLY_VALID: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
  WEAK: 'bg-rose-500/15 text-rose-200 border-rose-500/30',
  GAP: 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/30',
  NOT_APPLICABLE: 'bg-slate-600/15 text-slate-200 border-slate-600/30',
};

const findSummary = (data) => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const candidates = [data, data.summary, ...Object.values(data).filter((value) => value && typeof value === 'object' && !Array.isArray(value))];
  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object') {
      const keys = Object.keys(candidate).map((key) => key.toLowerCase());
      if (keys.includes('total_criteria') || keys.includes('valid') || keys.includes('gap')) {
        return candidate;
      }
    }
  }

  return null;
};

const findCriteriaArray = (data) => {
  if (!data || typeof data !== 'object') {
    return [];
  }

  const arrays = Object.entries(data)
    .filter(([, value]) => Array.isArray(value) && value.length > 0 && value.every((item) => item && typeof item === 'object'))
    .map(([key, value]) => ({ key, value }));

  const preference = arrays.find((entry) => entry.key.toLowerCase().includes('criteria'));
  if (preference) {
    return { name: preference.key, items: preference.value };
  }

  return arrays[0] || { name: 'records', items: [] };
};

const formatLabel = (key) => key.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (char) => char.toUpperCase());

export default function ComplianceCriteriaTemplate({ data, structure, classification }) {
  const summary = findSummary(data);
  const criteriaInfo = findCriteriaArray(data);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const columns = useMemo(() => {
    const set = new Set();
    criteriaInfo.items.forEach((item) => {
      Object.keys(item || {}).forEach((key) => set.add(key));
    });
    return Array.from(set).slice(0, 12);
  }, [criteriaInfo.items]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) {
      return criteriaInfo.items;
    }
    const lowered = search.toLowerCase();
    return criteriaInfo.items.filter((item) =>
      columns.some((column) => String(item[column] ?? '').toLowerCase().includes(lowered))
    );
  }, [criteriaInfo.items, columns, search]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pageItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const renderBadge = (value) => {
    if (!value) {
      return <span className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs text-slate-200">Unknown</span>;
    }
    const normalized = String(value).toUpperCase().replace(/\s+/g, '_');
    const style = STATUS_STYLES[normalized] || 'bg-slate-700/15 text-slate-200 border-slate-700/30';
    return <span className={`rounded-full border px-3 py-1 text-xs ${style}`}>{String(value)}</span>;
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Compliance dashboard</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Compliance overview</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">Domain classification: {classification.detectedDomain} • Confidence: {Math.round(classification.confidence * 100)}%</p>
          {summary ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {Object.entries(summary)
                .filter(([key]) => ['total_criteria', 'statutory', 'implementation_derived', 'not_applicable', 'valid', 'partially_valid', 'weak', 'gap'].includes(key))
                .map(([key, value]) => (
                  <div key={key} className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-400">{formatLabel(key)}</div>
                    <div className="mt-2 text-3xl font-semibold text-white">{value ?? '—'}</div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-400">No summary object could be found in the uploaded JSON.</p>
          )}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Criteria set</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{formatLabel(criteriaInfo.name)}</h3>
              <p className="mt-2 text-sm text-slate-400">{criteriaInfo.items.length} records found.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search criteria"
                className="rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
            <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-100">
              <thead className="bg-slate-900/90">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="px-4 py-3 font-semibold text-slate-200">{formatLabel(column)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {pageItems.map((item, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'}>
                    {columns.map((column) => (
                      <td key={column} className="px-4 py-3 align-top text-slate-100">
                        {column.toLowerCase().includes('status') || column.toLowerCase().includes('valid') ? renderBadge(item[column]) : String(item[column] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
            <span>Showing {pageItems.length} of {filteredItems.length} records</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs text-slate-200 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs text-slate-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
