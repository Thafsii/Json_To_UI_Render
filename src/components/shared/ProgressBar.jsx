export default function ProgressBar({ value }) {
  const percent = typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;

  if (percent === null) {
    return <span className="text-slate-400">—</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-cyan-400" style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs text-slate-300">{percent}%</span>
    </div>
  );
}
