import EmptyState from './EmptyState.jsx';

export default function AiInsightPanel({ analysis, remoteInsight, remoteAiAvailable, onRequestRemoteInsight, isRequestingRemoteInsight, remoteError }) {
  if (!analysis) {
    return (
      <EmptyState
        title="No analysis yet"
        description="Run “Analyze Data” from the JSON Editor panel to generate deterministic insights for this dataset."
      />
    );
  }

  return (
    <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Deterministic insight</p>
        <p className="mt-2 text-sm text-slate-300">{analysis.summary}</p>
      </div>
      {remoteInsight ? (
        <div className="border-t border-slate-800 pt-4">
          <p className="text-sm uppercase tracking-[0.24em] text-fuchsia-400">Remote AI narrative</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">{remoteInsight}</p>
        </div>
      ) : remoteAiAvailable ? (
        <div className="border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onRequestRemoteInsight}
            disabled={isRequestingRemoteInsight}
            className="rounded-full border border-fuchsia-500/60 bg-fuchsia-500/10 px-4 py-2 text-sm text-fuchsia-200 transition hover:border-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRequestingRemoteInsight ? 'Asking remote AI…' : 'Ask remote AI for a narrative'}
          </button>
          {remoteError ? <p className="mt-2 text-xs text-rose-300">{remoteError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
