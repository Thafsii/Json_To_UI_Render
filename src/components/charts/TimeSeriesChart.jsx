import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const tooltipStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: '12px',
  color: '#e2e8f0',
  fontSize: '12px',
};

/**
 * Renders a time-series line chart from {label, value} points.
 * Returns null when there are fewer than two real points to plot.
 */
export default function TimeSeriesChart({ title, description, data, height = 240 }) {
  if (!Array.isArray(data) || data.length < 2) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
      <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      <div className="mt-4" style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3, fill: '#22d3ee' }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
