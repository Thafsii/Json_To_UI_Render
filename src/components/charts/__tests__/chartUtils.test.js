import { describe, expect, it } from 'vitest';
import { buildCategoryDistribution, buildTimeSeries, buildBucketedDistribution, buildValueDistribution, buildCountTimeSeries } from '../chartUtils.js';

describe('buildCategoryDistribution', () => {
  it('returns null when there are fewer than two distinct categories', () => {
    expect(buildCategoryDistribution([{ dept: 'Eng' }, { dept: 'Eng' }], 'dept')).toBeNull();
  });

  it('returns null for empty or non-array input', () => {
    expect(buildCategoryDistribution([], 'dept')).toBeNull();
    expect(buildCategoryDistribution(null, 'dept')).toBeNull();
  });

  it('counts occurrences across distinct categories', () => {
    const items = [{ dept: 'Eng' }, { dept: 'Eng' }, { dept: 'Sales' }];
    const result = buildCategoryDistribution(items, 'dept');
    expect(result).toEqual([
      { name: 'Eng', value: 2 },
      { name: 'Sales', value: 1 },
    ]);
  });

  it('never fabricates a category that never appears', () => {
    const items = [{ dept: 'Eng' }, { dept: 'Sales' }];
    const result = buildCategoryDistribution(items, 'dept');
    expect(result.find((entry) => entry.name === 'Marketing')).toBeUndefined();
  });
});

describe('buildBucketedDistribution', () => {
  const buckets = [
    { label: 'High', pattern: /high/i },
    { label: 'Low', pattern: /low/i },
  ];

  it('returns null when nothing matches any bucket', () => {
    expect(buildBucketedDistribution([{ severity: 'unknown' }], ['severity'], buckets)).toBeNull();
  });

  it('returns null when only a single bucket has matches (not enough distinct categories for a chart)', () => {
    const items = [{ severity: 'high' }, { severity: 'high' }];
    const result = buildBucketedDistribution(items, ['severity'], buckets);
    expect(result).toBeNull();
  });

  it('returns multiple buckets when both have matches', () => {
    const items = [{ severity: 'high' }, { severity: 'low' }];
    const result = buildBucketedDistribution(items, ['severity'], buckets);
    expect(result).toHaveLength(2);
  });
});

describe('buildValueDistribution', () => {
  it('sums numeric values per category', () => {
    const items = [
      { category: 'A', revenue: 100 },
      { category: 'A', revenue: 50 },
      { category: 'B', revenue: 30 },
    ];
    const result = buildValueDistribution(items, 'category', 'revenue');
    expect(result).toEqual([
      { name: 'A', value: 150 },
      { name: 'B', value: 30 },
    ]);
  });

  it('returns null with only one category', () => {
    const items = [{ category: 'A', revenue: 100 }];
    expect(buildValueDistribution(items, 'category', 'revenue')).toBeNull();
  });
});

describe('buildTimeSeries', () => {
  it('returns null with fewer than two valid points', () => {
    expect(buildTimeSeries([{ date: '2026-01-01', revenue: 10 }], 'date', 'revenue')).toBeNull();
  });

  it('sorts points chronologically', () => {
    const items = [
      { date: '2026-01-02', revenue: 20 },
      { date: '2026-01-01', revenue: 10 },
    ];
    const result = buildTimeSeries(items, 'date', 'revenue');
    expect(result.map((p) => p.value)).toEqual([10, 20]);
  });

  it('skips records missing a valid date or numeric value', () => {
    const items = [
      { date: '2026-01-01', revenue: 10 },
      { date: 'not-a-date', revenue: 20 },
      { date: '2026-01-02', revenue: 'not-a-number' },
      { date: '2026-01-03', revenue: 30 },
    ];
    const result = buildTimeSeries(items, 'date', 'revenue');
    expect(result).toHaveLength(2);
  });
});

describe('buildCountTimeSeries', () => {
  it('counts records per day', () => {
    const items = [
      { started_at: '2026-01-01T01:00:00Z' },
      { started_at: '2026-01-01T02:00:00Z' },
      { started_at: '2026-01-02T01:00:00Z' },
    ];
    const result = buildCountTimeSeries(items, 'started_at');
    expect(result).toEqual([
      { label: '2026-01-01', value: 2 },
      { label: '2026-01-02', value: 1 },
    ]);
  });

  it('returns null when only one day is present', () => {
    const items = [{ started_at: '2026-01-01T01:00:00Z' }, { started_at: '2026-01-01T02:00:00Z' }];
    expect(buildCountTimeSeries(items, 'started_at')).toBeNull();
  });
});
