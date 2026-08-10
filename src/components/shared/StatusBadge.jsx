const STATUS_STYLES = {
  default: 'bg-slate-800 text-slate-200 border border-slate-700',
  success: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-200 border border-amber-500/30',
  danger: 'bg-rose-500/15 text-rose-200 border border-rose-500/30',
  info: 'bg-cyan-500/15 text-cyan-200 border border-cyan-500/30',
};

const severityMap = {
  VALID: STATUS_STYLES.success,
  PARTIALLY_VALID: STATUS_STYLES.warning,
  WEAK: STATUS_STYLES.danger,
  GAP: STATUS_STYLES.danger,
  NOT_APPLICABLE: STATUS_STYLES.default,
  CRITICAL: STATUS_STYLES.danger,
  HIGH: STATUS_STYLES.warning,
  MEDIUM: STATUS_STYLES.info,
  LOW: STATUS_STYLES.default,
  INFO: STATUS_STYLES.info,
  HEALTHY: STATUS_STYLES.success,
  DEGRADED: STATUS_STYLES.warning,
  DOWN: STATUS_STYLES.danger,
  TODO: STATUS_STYLES.info,
  IN_PROGRESS: STATUS_STYLES.warning,
  BLOCKED: STATUS_STYLES.danger,
  DONE: STATUS_STYLES.success,
};

const normalize = (value) => String(value || '').toUpperCase().replace(/\s+/g, '_');

export default function StatusBadge({ value }) {
  const normalized = normalize(value);
  const classes = severityMap[normalized] || STATUS_STYLES.default;

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classes}`}>
      {String(value || 'Unknown')}
    </span>
  );
}
