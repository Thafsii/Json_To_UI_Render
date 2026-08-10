export default function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg shadow-slate-950/20">
      {title ? <h3 className="mb-3 text-xl font-semibold text-white">{title}</h3> : null}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
