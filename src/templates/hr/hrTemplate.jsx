import { useMemo, useState } from 'react';
import JsonValueRenderer from '../../components/renderer/JsonValueRenderer.jsx';
import MetricGrid from '../../components/shared/MetricGrid.jsx';
import SectionTabs from '../../components/shared/SectionTabs.jsx';
import SearchInput from '../../components/shared/SearchInput.jsx';
import Pagination from '../../components/shared/Pagination.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import DetailPanel from '../../components/shared/DetailPanel.jsx';
import { normalizeHRData } from './hrMapper.js';
import StatusBadge from '../../components/shared/StatusBadge.jsx';

const sections = [
  { key: 'overview', label: 'Overview' },
  { key: 'employees', label: 'Employees' },
  { key: 'departments', label: 'Departments' },
  { key: 'open_positions', label: 'Open roles' },
  { key: 'hires', label: 'Recent hires' },
];

const formatLabel = (value) =>
  String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function HRTemplate({ data, classification }) {
  const normalized = normalizeHRData(data);
  const [activeSection, setActiveSection] = useState('overview');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const pageSize = 12;

  const employeeColumns = useMemo(() => {
    const set = new Set(['name', 'role', 'department', 'location', 'status', 'hire_date', 'tenure']);
    normalized.employees.forEach((item) => Object.keys(item || {}).forEach((key) => set.add(key)));
    return Array.from(set).slice(0, 10);
  }, [normalized.employees]);

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return normalized.employees;
    const lowered = search.toLowerCase();
    return normalized.employees.filter((item) =>
      Object.values(item || {}).some((value) => String(value ?? '').toLowerCase().includes(lowered))
    );
  }, [normalized.employees, search]);

  const pageCount = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const pageEmployees = filteredEmployees.slice((page - 1) * pageSize, page * pageSize);

  const metrics = [
    { title: 'Total employees', value: normalized.summary.totalEmployees ?? '—' },
    { title: 'Active employees', value: normalized.summary.activeEmployees ?? '—' },
    { title: 'Open roles', value: normalized.summary.openRoles ?? '—' },
    { title: 'Recent hires', value: normalized.summary.recentHires ?? '—' },
    { title: 'Avg. tenure', value: normalized.summary.averageTenure ?? '—' },
    { title: 'Headcount change', value: normalized.summary.headcountChange ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">HR dashboard</p>
            <h1 className="text-3xl font-semibold text-white">People operations</h1>
            <p className="mt-2 text-sm text-slate-400">Detected domain: {classification.detectedDomain}</p>
          </div>
          <SectionTabs sections={sections} activeSection={activeSection} onSelect={setActiveSection} />
        </div>
      </div>

      <div className="space-y-6">
        {activeSection === 'overview' && (
          <div className="space-y-6">
            <MetricGrid metrics={metrics} />
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Workforce snapshot</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Employee population</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                    <p className="text-sm text-slate-400">Departments</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{normalized.departments.length}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                    <p className="text-sm text-slate-400">Open positions</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{normalized.openPositions.length}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Recruiting overview</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Hiring pipeline</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                    <p className="text-sm text-slate-400">New hires</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{normalized.hires.length}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                    <p className="text-sm text-slate-400">Payroll items</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{normalized.payroll.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'employees' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Employee directory</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">People table</h2>
                <p className="mt-2 text-sm text-slate-400">{filteredEmployees.length} employees found.</p>
              </div>
              <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search employees, role, department..." />
            </div>

            {pageEmployees.length ? (
              <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
                <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-100">
                  <thead className="bg-slate-900/90">
                    <tr>
                      {employeeColumns.map((column) => (
                        <th key={column} className="px-4 py-3 font-semibold text-slate-200">{formatLabel(column)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {pageEmployees.map((employee, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'} onClick={() => setSelectedEmployee(employee)} style={{ cursor: 'pointer' }}>
                        {employeeColumns.map((column) => (
                          <td key={column} className="px-4 py-3 align-top text-slate-100">
                            {column.toLowerCase().includes('status') ? <StatusBadge value={employee[column]} /> : <JsonValueRenderer value={employee[column]} />}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No employees match" description="Try changing your search or upload a dataset with staff records." />
            )}

            <div className="mt-4">
              <Pagination
                currentPage={page}
                pageCount={pageCount}
                onPrevious={() => setPage((value) => Math.max(1, value - 1))}
                onNext={() => setPage((value) => Math.min(pageCount, value + 1))}
              />
            </div>
          </div>
        )}

        {activeSection === 'departments' && (
          normalized.departments.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {normalized.departments.map((department, index) => (
                <div key={index} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                  <h3 className="text-xl font-semibold text-white">{department.name ?? department.department ?? `Department ${index + 1}`}</h3>
                  <p className="mt-2 text-sm text-slate-400">{department.manager ? `Manager: ${department.manager}` : 'Department details available.'}</p>
                  <div className="mt-4 text-sm text-slate-100"><JsonValueRenderer value={department} /></div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No departments found" description="This HR dataset does not provide department or team information." />
          )
        )}

        {activeSection === 'open_positions' && (
          normalized.openPositions.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {normalized.openPositions.map((position, index) => (
                <div key={index} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                  <h3 className="text-xl font-semibold text-white">{position.title ?? position.role ?? `Role ${index + 1}`}</h3>
                  <p className="mt-2 text-sm text-slate-400">{position.department ? `${position.department} team` : 'Open role details available.'}</p>
                  <div className="mt-4 text-sm text-slate-100"><JsonValueRenderer value={position} /></div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No open roles" description="This dataset does not contain open position information." />
          )
        )}

        {activeSection === 'hires' && (
          normalized.hires.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {normalized.hires.map((hire, index) => (
                <div key={index} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                  <h3 className="text-xl font-semibold text-white">{hire.name ?? hire.employee ?? `Hire ${index + 1}`}</h3>
                  <p className="mt-2 text-sm text-slate-400">{hire.role ? `${hire.role}` : 'New hire details available.'}</p>
                  <div className="mt-4 text-sm text-slate-100"><JsonValueRenderer value={hire} /></div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No recent hires" description="This dataset does not include new hire records." />
          )
        )}
      </div>

      {selectedEmployee ? (
        <DetailPanel title="Employee details" onClose={() => setSelectedEmployee(null)}>
          {Object.entries(selectedEmployee).map(([key, value]) => (
            <div key={key} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{formatLabel(key)}</div>
              <div className="mt-2 text-sm text-slate-100"><JsonValueRenderer value={value} /></div>
            </div>
          ))}
        </DetailPanel>
      ) : null}
    </div>
  );
}
