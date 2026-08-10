import JsonRenderer from '../../components/renderer/Renderer.jsx';

const metricItems = [
  { label: 'Root Type', key: 'root_type' },
  { label: 'Objects', key: 'object_count' },
  { label: 'Arrays', key: 'array_count' },
  { label: 'Max Depth', key: 'max_depth' },
  { label: 'Fields', key: 'field_count' },
];

function MetricCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
      <div className="text-sm uppercase tracking-[0.24em] text-slate-400">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value ?? '—'}</div>
    </div>
  );
}

export default function GenericTemplate({ data, structure }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metricItems.map((item) => (
          <MetricCard key={item.key} label={item.label} value={structure?.[item.key] ?? '—'} />
        ))}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Generic explorer</p>
            <h2 className="text-2xl font-semibold text-white">Explore your JSON data</h2>
          </div>
          <p className="text-sm text-slate-400">Rendered with the deterministic recursive JSON viewer.</p>
        </div>

        <JsonRenderer value={data} />
      </div>
    </div>
  );
}
