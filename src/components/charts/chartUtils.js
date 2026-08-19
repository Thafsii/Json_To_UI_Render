const MIN_CATEGORIES = 2;
const MIN_CATEGORY_ITEMS = 2;
const MIN_TIME_SERIES_POINTS = 2;
const MAX_CATEGORIES_SHOWN = 8;

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const normalizeLabel = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  return text ? text : null;
};

/**
 * Counts occurrences of a categorical field across a collection of records.
 * Returns null when there isn't enough distinct, real data to justify a chart —
 * callers must treat null as "do not render", never fabricate placeholder data.
 */
export function buildCategoryDistribution(items, fieldNames, options = {}) {
  if (!Array.isArray(items) || items.length < MIN_CATEGORY_ITEMS) {
    return null;
  }

  const candidates = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
  const counts = new Map();

  items.forEach((item) => {
    if (!isPlainObject(item)) return;
    const field = candidates.find((name) => item[name] !== undefined && item[name] !== null && item[name] !== '');
    if (!field) return;
    const label = normalizeLabel(item[field]);
    if (!label) return;
    counts.set(label, (counts.get(label) || 0) + 1);
  });

  if (counts.size < MIN_CATEGORIES) {
    return null;
  }

  let entries = Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const maxCategories = options.maxCategories || MAX_CATEGORIES_SHOWN;
  if (entries.length > maxCategories) {
    const visible = entries.slice(0, maxCategories - 1);
    const otherTotal = entries.slice(maxCategories - 1).reduce((sum, entry) => sum + entry.value, 0);
    entries = [...visible, { name: 'Other', value: otherTotal }];
  }

  return entries;
}

const parseNumeric = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const cleaned = Number(value.replace(/[,₹$%\s]/g, ''));
    return Number.isFinite(cleaned) ? cleaned : null;
  }
  return null;
};

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Builds a sorted time series from records containing a date-like field and a
 * numeric value field. Returns null when there are fewer than two valid points —
 * a single point or an all-null series is not enough to justify a chart.
 */
export function buildTimeSeries(items, dateFieldNames, valueFieldNames) {
  if (!Array.isArray(items) || items.length < MIN_TIME_SERIES_POINTS) {
    return null;
  }

  const dateCandidates = Array.isArray(dateFieldNames) ? dateFieldNames : [dateFieldNames];
  const valueCandidates = Array.isArray(valueFieldNames) ? valueFieldNames : [valueFieldNames];

  const points = [];
  items.forEach((item) => {
    if (!isPlainObject(item)) return;
    const dateField = dateCandidates.find((name) => item[name] !== undefined);
    const valueField = valueCandidates.find((name) => item[name] !== undefined);
    if (!dateField || !valueField) return;

    const date = parseDate(item[dateField]);
    const value = parseNumeric(item[valueField]);
    if (!date || value === null) return;

    points.push({ date, value, label: date.toISOString().slice(0, 10) });
  });

  if (points.length < MIN_TIME_SERIES_POINTS) {
    return null;
  }

  return points.sort((a, b) => a.date - b.date).map((point) => ({ label: point.label, value: point.value }));
}

/**
 * Aggregates counts for a set of explicit status-like buckets (e.g. severity
 * levels) using regex matching against a field, only returning buckets that
 * actually have matches — never fabricates a zero-value slice for a bucket
 * that never appears verbatim but also isn't excluded if genuinely zero when
 * at least one other bucket has data.
 */
export function buildBucketedDistribution(items, fieldNames, buckets) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const candidates = Array.isArray(fieldNames) ? fieldNames : [fieldNames];
  const counts = buckets.map((bucket) => ({ name: bucket.label, value: 0, pattern: bucket.pattern }));

  items.forEach((item) => {
    if (!isPlainObject(item)) return;
    const field = candidates.find((name) => item[name] !== undefined && item[name] !== null);
    if (!field) return;
    const raw = String(item[field]);
    const bucket = counts.find((entry) => entry.pattern.test(raw));
    if (bucket) {
      bucket.value += 1;
    }
  });

  const withData = counts.filter((entry) => entry.value > 0).map(({ name, value }) => ({ name, value }));
  return withData.length >= MIN_CATEGORIES ? withData : null;
}

/**
 * Sums a numeric field grouped by a categorical field (e.g. revenue by category).
 * Returns null when there aren't at least two distinct categories with real values.
 */
export function buildValueDistribution(items, categoryFieldNames, valueFieldNames, options = {}) {
  if (!Array.isArray(items) || items.length < MIN_CATEGORY_ITEMS) {
    return null;
  }

  const categoryCandidates = Array.isArray(categoryFieldNames) ? categoryFieldNames : [categoryFieldNames];
  const valueCandidates = Array.isArray(valueFieldNames) ? valueFieldNames : [valueFieldNames];
  const totals = new Map();

  items.forEach((item) => {
    if (!isPlainObject(item)) return;
    const categoryField = categoryCandidates.find((name) => item[name] !== undefined && item[name] !== null && item[name] !== '');
    const valueField = valueCandidates.find((name) => item[name] !== undefined);
    if (!categoryField || !valueField) return;

    const label = normalizeLabel(item[categoryField]);
    const value = parseNumeric(item[valueField]);
    if (!label || value === null) return;

    totals.set(label, (totals.get(label) || 0) + value);
  });

  if (totals.size < MIN_CATEGORIES) {
    return null;
  }

  let entries = Array.from(totals.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  const maxCategories = options.maxCategories || MAX_CATEGORIES_SHOWN;
  if (entries.length > maxCategories) {
    const visible = entries.slice(0, maxCategories - 1);
    const otherTotal = entries.slice(maxCategories - 1).reduce((sum, entry) => sum + entry.value, 0);
    entries = [...visible, { name: 'Other', value: Math.round(otherTotal * 100) / 100 }];
  }

  return entries;
}

/**
 * Counts records per calendar day for a date-like field, producing a time series
 * of occurrence counts (e.g. "alerts over time"). Returns null when there are
 * fewer than two distinct days with data.
 */
export function buildCountTimeSeries(items, dateFieldNames) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  const dateCandidates = Array.isArray(dateFieldNames) ? dateFieldNames : [dateFieldNames];
  const counts = new Map();

  items.forEach((item) => {
    if (!isPlainObject(item)) return;
    const dateField = dateCandidates.find((name) => item[name] !== undefined);
    if (!dateField) return;
    const date = parseDate(item[dateField]);
    if (!date) return;
    const label = date.toISOString().slice(0, 10);
    counts.set(label, (counts.get(label) || 0) + 1);
  });

  if (counts.size < MIN_TIME_SERIES_POINTS) {
    return null;
  }

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => (a.label < b.label ? -1 : 1));
}
