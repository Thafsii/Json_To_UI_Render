export default function Pagination({ currentPage, pageCount, onPrevious, onNext }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
      <span>Page {currentPage} of {pageCount}</span>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage <= 1}
          className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs text-slate-200 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={currentPage >= pageCount}
          className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs text-slate-200 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
