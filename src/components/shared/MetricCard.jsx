export default function MetricCard({ title, value, subtitle }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
      <div className="text-sm uppercase tracking-[0.24em] text-slate-400">{title}</div>
      <div className="mt-3 text-3xl font-semibold text-white">{value ?? '—'}</div>
      {subtitle ? <div className="mt-2 text-sm text-slate-400">{subtitle}</div> : null}
    </div>
  );
}
