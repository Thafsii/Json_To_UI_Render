import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const PALETTE = ['#22d3ee', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#f472b6', '#38bdf8', '#94a3b8'];

const tooltipStyle = {
  backgroundColor: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: '12px',
  color: '#e2e8f0',
  fontSize: '12px',
};

/**
 * Renders a category/status distribution as a bar or donut chart.
 * Returns null when there is no real data — charts must never render fabricated values.
 */
export default function DistributionChart({ title, description, data, type = 'bar', height = 240 }) {
  if (!Array.isArray(data) || data.length < 2) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
      <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">{title}</p>
      {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
      <div className="mt-4" style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          {type === 'pie' ? (
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" innerRadius="45%" paddingAngle={2}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#cbd5f5' }} />
            </PieChart>
          ) : (
            <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} angle={data.length > 4 ? -20 : 0} textAnchor={data.length > 4 ? 'end' : 'middle'} height={data.length > 4 ? 50 : 30} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(34, 211, 238, 0.08)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
