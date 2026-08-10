export default function DetailPanel({ title, children, onClose }) {
  return (
    <div className="rounded-3xl border border-cyan-500/60 bg-slate-950/90 p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">{title}</p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-100"
          >
            Close
          </button>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
