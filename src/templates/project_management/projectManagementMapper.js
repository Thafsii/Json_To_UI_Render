import { safeArray, safeObject, safeNumber, getFirstExisting, getNestedValue } from '../shared/dataUtils.js';

const findArray = (root, keys) => {
  for (const key of keys) {
    if (Array.isArray(root[key])) {
      return root[key];
    }
  }
  const entry = Object.entries(root).find(([, value]) => Array.isArray(value));
  return entry ? entry[1] : [];
};

export function normalizeProjectManagementData(data) {
  const root = safeObject(data);
  const projects = safeArray(findArray(root, ['projects', 'project_list', 'initiatives']));
  const tasks = safeArray(findArray(root, ['tasks', 'task_list', 'work_items']));
  const milestones = safeArray(findArray(root, ['milestones', 'milestone_list']));
  const team = safeArray(findArray(root, ['team', 'team_members', 'members', 'resources']));
  const timelines = safeArray(findArray(root, ['timelines', 'sprints', 'phases']));

  const summary = safeObject(getFirstExisting(root, ['summary', 'overview', 'dashboard']));
  const totalProjects = safeNumber(getNestedValue(summary, 'total_projects')) ?? projects.length;
  const openTasks = safeNumber(getNestedValue(summary, 'open_tasks')) ?? tasks.filter((item) => /open|todo|pending/i.test(String(item.status))).length;
  const completedMilestones = safeNumber(getNestedValue(summary, 'completed_milestones')) ?? milestones.filter((item) => /complete|done/i.test(String(item.status))).length;
  const teamSize = safeNumber(getNestedValue(summary, 'team_size')) ?? team.length;
  const activeSprints = safeNumber(getNestedValue(summary, 'active_sprints')) ?? timelines.filter((item) => /active|in progress/i.test(String(item.status))).length;

  return { summary: { totalProjects, openTasks, completedMilestones, teamSize, activeSprints }, projects, tasks, milestones, team, timelines };
}
