export default function Table({ columns, rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
      <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-200">
        <thead className="bg-slate-950/90">
          <tr>
            {columns.map((column, index) => (
              <th key={index} className="px-4 py-3 font-semibold text-slate-100">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
