import { useMemo, useState } from 'react';

const MAX_ITEMS_PREVIEW = 20;
const COLLAPSE_DEPTH = 2;

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const formatLabel = (key) => {
  if (!key) return '';
  const result = key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/ +/g, ' ')
    .trim();
  return result
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const isIsoDate = (value) => {
  if (typeof value !== 'string') return false;
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
  return iso.test(value) && !Number.isNaN(Date.parse(value));
};

const isUrl = (value) => {
  if (typeof value !== 'string') return false;
  return /^https?:\/\//.test(value);
};

const isEmail = (value) => {
  if (typeof value !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const formatDateTime = (value) => {
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short',
    }).format(date);
  } catch {
    return value;
  }
};

const getDisplayValue = (value) => {
  if (value === null) {
    return '— Not provided';
  }

  if (typeof value === 'boolean') {
    return value ? '✓ Enabled' : '✕ Disabled';
  }

  if (typeof value === 'number') {
    return value.toLocaleString();
  }

  if (typeof value === 'string') {
    if (isIsoDate(value)) {
      return formatDateTime(value);
    }
    if (isUrl(value) || isEmail(value)) {
      return value;
    }
    return value;
  }

  return String(value);
};

const labelForPrimitive = (key) => (key ? formatLabel(key) : null);

const isSimpleValue = (value) => value === null || ['string', 'number', 'boolean'].includes(typeof value);

const isSimpleObject = (value) => {
  if (!isPlainObject(value)) return false;
  return Object.values(value).every((child) => isSimpleValue(child));
};

const primaryLabel = (object) => {
  if (!isPlainObject(object)) return null;
  const keys = Object.keys(object);
  const labelCandidates = keys.filter((key) => isSimpleValue(object[key]));
  return labelCandidates.length ? formatLabel(labelCandidates[0]) : keys[0] ? formatLabel(keys[0]) : 'Item';
};

function PrimitiveRenderer({ value, label }) {
  const type = value === null ? 'null' : typeof value;
  const display = getDisplayValue(value);

  const renderedValue = (() => {
    if (value === null) {
      return <span className="text-slate-200">— Not provided</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <span className={`rounded-full px-2 py-1 text-xs ${value ? 'bg-emerald-500/15 text-emerald-200' : 'bg-rose-500/15 text-rose-200'}`}>
          {display}
        </span>
      );
    }

    if (typeof value === 'string') {
      if (isIsoDate(value)) {
        return <span className="text-slate-200">{display}</span>;
      }
      if (isUrl(value)) {
        return (
          <a href={value} target="_blank" rel="noreferrer" className="text-cyan-300 hover:text-cyan-100 underline">
            {value}
          </a>
        );
      }
      if (isEmail(value)) {
        return (
          <a href={`mailto:${value}`} className="text-cyan-300 hover:text-cyan-100 underline">
            {value}
          </a>
        );
      }
    }

    return <span className="text-slate-200">{display}</span>;
  })();

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
      {label ? <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">{labelForPrimitive(label)}</div> : null}
      <div className="flex flex-wrap items-center gap-3 text-sm">{renderedValue}</div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">{type}</div>
    </div>
  );
}

function ObjectRenderer({ value, label, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < COLLAPSE_DEPTH);
  const entries = Object.entries(value);
  const headerLabel = label ? formatLabel(label) : 'Object';

  const toggle = () => setExpanded((prev) => !prev);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          {label ? <div className="text-sm font-semibold text-white">{headerLabel}</div> : null}
          <div className="text-xs text-slate-400">{entries.length} field{entries.length === 1 ? '' : 's'}</div>
        </div>
        {depth >= 1 ? (
          <button
            type="button"
            onClick={toggle}
            className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-cyan-500"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        ) : null}
      </div>

      {!expanded && depth >= 1 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-slate-400">Collapsed object</div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-slate-400">Empty object</div>
      ) : (
        <div className="space-y-4">
          {entries.map(([key, child], index) => (
            <div key={index} className="space-y-2">
              <div className="text-sm font-medium text-slate-200">{formatLabel(key)}</div>
              <div className="ml-4">
                <JsonRenderer value={child} label={key} depth={depth + 1} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ArrayRenderer({ value, label, depth = 0 }) {
  const [visibleCount, setVisibleCount] = useState(MAX_ITEMS_PREVIEW);
  const itemTypes = value.map((item) => (item === null ? 'null' : Array.isArray(item) ? 'array' : typeof item));
  const allPrimitives = itemTypes.every((type) => ['string', 'number', 'boolean', 'null'].includes(type));
  const allObjects = itemTypes.every((type) => type === 'object');
  const simpleObjects = allObjects && value.every((item) => isSimpleObject(item));
  const containerLabel = label ? formatLabel(label) : 'Array';
  const isLarge = value.length > MAX_ITEMS_PREVIEW;
  const shownValues = value.slice(0, visibleCount);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          {label ? <div className="text-sm font-semibold text-white">{containerLabel}</div> : null}
          <div className="text-xs text-slate-400">{value.length} item{value.length === 1 ? '' : 's'}</div>
        </div>
        {isLarge ? (
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => Math.min(value.length, prev + MAX_ITEMS_PREVIEW))}
            className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-cyan-500"
          >
            Show {Math.min(MAX_ITEMS_PREVIEW, value.length - visibleCount)} more
          </button>
        ) : null}
      </div>

      {value.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-slate-400">Empty array (0 items)</div>
      ) : allPrimitives ? (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <span key={index} className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-sm text-slate-200">
              {getDisplayValue(item)}
            </span>
          ))}
        </div>
      ) : simpleObjects ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-950/80">
          <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-100">
            <thead className="bg-slate-900/90">
              <tr>
                {Array.from(
                  value.reduce((acc, item) => {
                    Object.keys(item || {}).forEach((key) => acc.add(key));
                    return acc;
                  }, new Set())
                ).map((column) => (
                  <th key={column} className="px-3 py-2 font-semibold text-slate-200">
                    {formatLabel(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {shownValues.map((item, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'}>
                  {Array.from(
                    value.reduce((acc, row) => {
                      Object.keys(row || {}).forEach((key) => acc.add(key));
                      return acc;
                    }, new Set())
                  ).map((column) => {
                    const cellValue = item[column];
                    const cellText = cellValue === null ? 'NULL' : typeof cellValue === 'object' ? 'Complex' : String(cellValue);
                    return (
                      <td key={column} className="px-3 py-2 align-top text-slate-100">
                        {cellText}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {shownValues.map((item, index) => (
            <div key={index} className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{primaryLabel(item)} #{index + 1}</div>
                  <div className="text-xs text-slate-400">{item && Object.keys(item).length} field{item && Object.keys(item).length === 1 ? '' : 's'}</div>
                </div>
              </div>
              <div className="space-y-3">
                <JsonRenderer value={item} depth={depth + 1} />
              </div>
            </div>
          ))}
        </div>
      )}

      {isLarge && visibleCount < value.length ? (
        <div className="mt-4 text-right">
          <button
            type="button"
            onClick={() => setVisibleCount(value.length)}
            className="rounded-full border border-cyan-500/70 bg-slate-950/80 px-4 py-2 text-sm text-cyan-200 transition hover:border-cyan-400"
          >
            Show all {value.length}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function JsonRenderer({ value, label, depth = 0 }) {
  if (value === null) {
    return <PrimitiveRenderer value={null} label={label} />;
  }

  if (Array.isArray(value)) {
    return <ArrayRenderer value={value} label={label} depth={depth} />;
  }

  if (typeof value === 'object') {
    return <ObjectRenderer value={value} label={label} depth={depth} />;
  }

  return <PrimitiveRenderer value={value} label={label} />;
}
