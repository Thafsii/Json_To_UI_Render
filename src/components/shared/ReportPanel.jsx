export default function ReportPanel({ readme, onGenerateReadme, onDownloadReadme, canGenerate }) {
  return (
    <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
      <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Report</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onGenerateReadme}
          disabled={!canGenerate}
          className="rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Generate README
        </button>
        <button
          type="button"
          onClick={onDownloadReadme}
          disabled={!readme}
          className="rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Download README.md
        </button>
      </div>
      {readme ? (
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/90 p-4 text-xs text-slate-300">{readme}</pre>
      ) : (
        <p className="text-sm text-slate-400">Generate a README to get a shareable, human-readable report for this dataset.</p>
      )}
    </div>
  );
}
