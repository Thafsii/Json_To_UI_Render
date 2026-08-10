export default function MetricGrid({ metrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.title} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
          <div className="text-sm uppercase tracking-[0.24em] text-slate-400">{metric.title}</div>
          <div className="mt-3 text-3xl font-semibold text-white">{metric.value ?? '—'}</div>
          {metric.subtitle ? <div className="mt-2 text-sm text-slate-400">{metric.subtitle}</div> : null}
        </div>
      ))}
    </div>
  );
}
