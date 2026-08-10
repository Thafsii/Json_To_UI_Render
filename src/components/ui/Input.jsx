export default function Input({ label, placeholder, name }) {
  return (
    <label className="grid gap-1 text-sm text-slate-200">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        placeholder={placeholder}
        className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
      />
    </label>
  );
}
