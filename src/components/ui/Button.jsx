export default function Button({ label, action, onAction }) {
  return (
    <button
      type="button"
      onClick={() => onAction && onAction(action)}
      className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
    >
      {label}
    </button>
  );
}
