export default function EmptyState({ title, description }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 text-slate-300">
      <div className="text-lg font-semibold text-white">{title}</div>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  );
}
