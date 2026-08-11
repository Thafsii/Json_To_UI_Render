import { useMemo, useState } from 'react';
import JsonValueRenderer from '../../components/renderer/JsonValueRenderer.jsx';
import MetricGrid from '../../components/shared/MetricGrid.jsx';
import SectionTabs from '../../components/shared/SectionTabs.jsx';
import SearchInput from '../../components/shared/SearchInput.jsx';
import Pagination from '../../components/shared/Pagination.jsx';
import EmptyState from '../../components/shared/EmptyState.jsx';
import DetailPanel from '../../components/shared/DetailPanel.jsx';
import StatusBadge from '../../components/shared/StatusBadge.jsx';
import { normalizeProjectManagementData } from './projectManagementMapper.js';

const sections = [
  { key: 'overview', label: 'Overview' },
  { key: 'projects', label: 'Projects' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'milestones', label: 'Milestones' },
  { key: 'team', label: 'Team' },
];

const formatLabel = (value) =>
  String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function ProjectManagementTemplate({ data, classification }) {
  const normalized = normalizeProjectManagementData(data);
  const [activeSection, setActiveSection] = useState('overview');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState(null);
  const pageSize = 12;

  const taskColumns = useMemo(() => {
    const set = new Set(['id', 'title', 'status', 'assignee', 'due_date', 'priority', 'project']);
    normalized.tasks.forEach((item) => Object.keys(item || {}).forEach((key) => set.add(key)));
    return Array.from(set).slice(0, 10);
  }, [normalized.tasks]);

  const filteredTasks = useMemo(() => {
    if (!search.trim()) return normalized.tasks;
    const lowered = search.toLowerCase();
    return normalized.tasks.filter((item) =>
      Object.values(item || {}).some((value) => String(value ?? '').toLowerCase().includes(lowered))
    );
  }, [normalized.tasks, search]);

  const pageCount = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const pageTasks = filteredTasks.slice((page - 1) * pageSize, page * pageSize);

  const metrics = [
    { title: 'Projects', value: normalized.summary.totalProjects ?? '—' },
    { title: 'Open tasks', value: normalized.summary.openTasks ?? '—' },
    { title: 'Completed milestones', value: normalized.summary.completedMilestones ?? '—' },
    { title: 'Team size', value: normalized.summary.teamSize ?? '—' },
    { title: 'Active sprints', value: normalized.summary.activeSprints ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Project management</p>
            <h1 className="text-3xl font-semibold text-white">Delivery dashboard</h1>
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
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Project overview</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Program summary</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                    <p className="text-sm text-slate-400">Milestones</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{normalized.milestones.length}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                    <p className="text-sm text-slate-400">Team members</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{normalized.team.length}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Execution timeline</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Schedule health</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                    <p className="text-sm text-slate-400">Timeline entries</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{normalized.timelines.length}</p>
                  </div>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4">
                    <p className="text-sm text-slate-400">Tasks</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{normalized.tasks.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'projects' && (
          normalized.projects.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {normalized.projects.map((project, index) => (
                <div key={index} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                  <h3 className="text-xl font-semibold text-white">{project.name ?? project.title ?? `Project ${index + 1}`}</h3>
                  <p className="mt-2 text-sm text-slate-400">{project.status ? `Status: ${project.status}` : 'Project details available.'}</p>
                  <div className="mt-4 text-sm text-slate-100"><JsonValueRenderer value={project} /></div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No projects found" description="This dataset does not expose project records." />
          )
        )}

        {activeSection === 'tasks' && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Task board</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Task list</h2>
                <p className="mt-2 text-sm text-slate-400">{filteredTasks.length} tasks matched.</p>
              </div>
              <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search tasks, assignee, status..." />
            </div>
            {pageTasks.length ? (
              <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
                <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-100">
                  <thead className="bg-slate-900/90">
                    <tr>
                      {taskColumns.map((column) => (
                        <th key={column} className="px-4 py-3 font-semibold text-slate-200">{formatLabel(column)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {pageTasks.map((task, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'} onClick={() => setSelectedTask(task)} style={{ cursor: 'pointer' }}>
                        {taskColumns.map((column) => (
                          <td key={column} className="px-4 py-3 align-top text-slate-100">
                            {column.toLowerCase().includes('status') ? <StatusBadge value={task[column]} /> : <JsonValueRenderer value={task[column]} />}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No tasks found" description="Try a different search or upload a dataset with task records." />
            )}
            <div className="mt-4">
              <Pagination currentPage={page} pageCount={pageCount} onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(pageCount, value + 1))} />
            </div>
          </div>
        )}

        {activeSection === 'milestones' && (
          normalized.milestones.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {normalized.milestones.map((milestone, index) => (
                <div key={index} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                  <h3 className="text-xl font-semibold text-white">{milestone.name ?? milestone.title ?? `Milestone ${index + 1}`}</h3>
                  <p className="mt-2 text-sm text-slate-400">{milestone.status ? `Status: ${milestone.status}` : 'Milestone details available.'}</p>
                  <div className="mt-4 text-sm text-slate-100"><JsonValueRenderer value={milestone} /></div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No milestones" description="This dataset does not contain milestone information." />
          )
        )}

        {activeSection === 'team' && (
          normalized.team.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {normalized.team.map((member, index) => (
                <div key={index} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                  <h3 className="text-xl font-semibold text-white">{member.name ?? member.fullName ?? `Team member ${index + 1}`}</h3>
                  <p className="mt-2 text-sm text-slate-400">{member.role ? `${member.role}` : 'Team member details available.'}</p>
                  <div className="mt-4 text-sm text-slate-100"><JsonValueRenderer value={member} /></div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No team data" description="This dataset does not expose project team members." />
          )
        )}
      </div>

      {selectedTask ? (
        <DetailPanel title="Task details" onClose={() => setSelectedTask(null)}>
          {Object.entries(selectedTask).map(([key, value]) => (
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
