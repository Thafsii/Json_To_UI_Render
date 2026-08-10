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

export function normalizeHRData(data) {
  const root = safeObject(data);
  const employees = safeArray(findArray(root, ['employees', 'staff', 'team_members', 'people']));
  const departments = safeArray(findArray(root, ['departments', 'org_units', 'teams']));
  const openPositions = safeArray(findArray(root, ['open_positions', 'positions', 'job_openings', 'jobs']));
  const hires = safeArray(findArray(root, ['hires', 'new_hires', 'onboarding']));
  const payroll = safeArray(findArray(root, ['payroll', 'compensation', 'salaries']));

  const summary = safeObject(getFirstExisting(root, ['summary', 'overview', 'hr_summary', 'dashboard']));
  const totalEmployees = safeNumber(getNestedValue(summary, 'total_employees')) ?? employees.length;
  const activeEmployees = safeNumber(getNestedValue(summary, 'active_employees')) ?? employees.length;
  const openRoles = safeNumber(getNestedValue(summary, 'open_roles')) ?? openPositions.length;
  const recentHires = safeNumber(getNestedValue(summary, 'recent_hires')) ?? hires.length;
  const averageTenure = safeNumber(getNestedValue(summary, 'average_tenure'));
  const headcountChange = safeNumber(getNestedValue(summary, 'headcount_change'));

  return {
    summary: { totalEmployees, activeEmployees, openRoles, recentHires, averageTenure, headcountChange },
    employees,
    departments,
    openPositions,
    hires,
    payroll,
  };
}
