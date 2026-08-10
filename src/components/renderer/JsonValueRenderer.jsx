import { useMemo, useState } from 'react';

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
const isPrimitive = (value) => value === null || ['string', 'number', 'boolean'].includes(typeof value);

const formatNumber = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  return value.toLocaleString();
};

const formatCurrency = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
};

const formatLabel = (key) => {
  if (!key) return '';
  return String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (chr) => chr.toUpperCase());
};

const badgeClass = 'rounded-full px-2.5 py-1 text-[11px] font-medium';

const SummaryBadge = ({ text }) => (
  <span className={`${badgeClass} bg-slate-800 text-slate-200 border border-slate-700`}>{text}</span>
);

const renderPrimitive = (value, context) => {
  if (value === null) {
    return <span className="text-slate-400">—</span>;
  }

  if (typeof value === 'boolean') {
    return (
      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${value ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-200 border border-rose-500/30'}`}>
        {value ? 'True' : 'False'}
      </span>
    );
  }

  if (typeof value === 'number') {
    if (context === 'currency') {
      return <span className="text-slate-100">{formatCurrency(value)}</span>;
    }
    return <span className="text-slate-100">{formatNumber(value)}</span>;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return <span className="text-slate-100">{trimmed === '' ? '—' : trimmed}</span>;
  }

  return <span className="text-slate-400">—</span>;
};

const getObjectSummary = (object) => {
  if (!isPlainObject(object)) {
    return null;
  }

  const entries = Object.entries(object);
  const status = entries.find(([key]) => /status|state|availability/i.test(key));
  const available = entries.find(([key]) => /(available|quantity|qty)/i.test(key));
  const reserved = entries.find(([key]) => /(reserved|hold)/i.test(key));
  const sold = entries.find(([key]) => /(sold|shipped|delivered)/i.test(key));
  const primary = entries.filter(([key]) => isPrimitive(object[key]) && !/status|state|availability|available|quantity|qty|reserved|sold/i.test(key));

  const lines = [];
  if (available) {
    lines.push(`${available[1]} available`);
  }
  if (status) {
    lines.push(status[1]);
  } else if (primary.length) {
    const [key, value] = primary[0];
    lines.push(`${formatLabel(key)}: ${String(value)}`);
  }

  return lines.join(' • ');
};

const ObjectDetailTable = ({ object }) => {
  const entries = Object.entries(object);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4 text-sm text-slate-100">
      <div className="mb-3 text-sm font-semibold text-white">Details</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{formatLabel(key)}</div>
            <div className="mt-2 text-sm text-slate-100">
              {isPrimitive(value) ? renderPrimitive(value) : Array.isArray(value) ? <ArraySummary value={value} /> : <span>{getObjectSummary(value) || 'Object'}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ArraySummary = ({ value }) => {
  if (!Array.isArray(value)) {
    return null;
  }

  if (value.length === 0) {
    return <span className="text-slate-400">—</span>;
  }

  const primitives = value.every(isPrimitive);
  if (primitives) {
    return (
      <div className="flex flex-wrap gap-2">
        {value.slice(0, 6).map((item, index) => (
          <SummaryBadge key={index} text={String(item)} />
        ))}
        {value.length > 6 ? <SummaryBadge text={`+${value.length - 6} more`} /> : null}
      </div>
    );
  }

  return <span className="text-slate-100">{value.length} items</span>;
};

export default function JsonValueRenderer({ value, context }) {
  const [expanded, setExpanded] = useState(false);

  const summary = useMemo(() => {
    if (value === null) {
      return '—';
    }

    if (isPrimitive(value)) {
      return null;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return 'Empty list';
      }
      if (value.every(isPrimitive)) {
        return `${value.slice(0, 4).map((item) => String(item)).join(', ')}${value.length > 4 ? `, +${value.length - 4} more` : ''}`;
      }
      return `${value.length} item${value.length === 1 ? '' : 's'}`;
    }

    return getObjectSummary(value) || 'Object';
  }, [value]);

  if (isPrimitive(value)) {
    return <>{renderPrimitive(value, context)}</>;
  }

  if (Array.isArray(value)) {
    return <ArraySummary value={value} />;
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full rounded-3xl border border-slate-800 bg-slate-950/90 p-3 text-left text-sm text-slate-100 transition hover:border-cyan-500"
      >
        <div className="flex items-center justify-between gap-3">
          <span>{summary}</span>
          <span className="text-xs text-slate-400">{expanded ? 'Hide details' : 'View details'}</span>
        </div>
      </button>
      {expanded ? <ObjectDetailTable object={value} /> : null}
    </div>
  );
}
