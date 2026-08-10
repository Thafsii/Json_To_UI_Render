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

export function normalizeMonitoringData(data) {
  const root = safeObject(data);
  const metrics = safeArray(findArray(root, ['metrics', 'metric_series', 'timeseries']));
  const alerts = safeArray(findArray(root, ['alerts', 'incidents', 'events']));
  const dashboards = safeArray(findArray(root, ['dashboards', 'views', 'panels']));
  const hosts = safeArray(findArray(root, ['hosts', 'servers', 'instances']));
  const logs = safeArray(findArray(root, ['logs', 'log_entries', 'events']));

  const summary = safeObject(getFirstExisting(root, ['summary', 'overview', 'dashboard']));
  const totalHosts = safeNumber(getNestedValue(summary, 'total_hosts')) ?? hosts.length;
  const activeAlerts = safeNumber(getNestedValue(summary, 'active_alerts')) ?? alerts.filter((item) => /active|firing|open/i.test(String(item.status))).length;
  const totalMetrics = safeNumber(getNestedValue(summary, 'metric_count')) ?? metrics.length;
  const averageLatency = safeNumber(getNestedValue(summary, 'average_latency'));
  const errorRate = safeNumber(getNestedValue(summary, 'error_rate'));

  return { summary: { totalHosts, activeAlerts, totalMetrics, averageLatency, errorRate }, metrics, alerts, dashboards, hosts, logs };
}
