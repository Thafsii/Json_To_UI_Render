import { describe, expect, it } from 'vitest';
import { analyzeJsonStructure } from '../structuralAnalyzer.js';

describe('analyzeJsonStructure', () => {
  it('handles null', () => {
    const result = analyzeJsonStructure(null);
    expect(result.root_type).toBe('null');
    expect(result.object_count).toBe(0);
  });

  it('handles an empty object', () => {
    const result = analyzeJsonStructure({});
    expect(result.root_type).toBe('object');
    expect(result.object_count).toBe(1);
    expect(result.field_count).toBe(0);
  });

  it('handles an empty array', () => {
    const result = analyzeJsonStructure([]);
    expect(result.root_type).toBe('array');
    expect(result.array_count).toBe(1);
  });

  it('counts objects, arrays and primitives, and detects repeated object collections', () => {
    const sample = {
      users: [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ],
      active: true,
      count: 2,
    };
    const result = analyzeJsonStructure(sample);
    expect(result.object_count).toBe(3); // root + 2 users
    expect(result.array_count).toBe(1);
    expect(result.repeated_object_collections).toContain('root.users');
    expect(result.primitive_types.boolean).toBe(1);
    expect(result.primitive_types.number).toBe(3); // count + 2 ids
    expect(result.primitive_types.string).toBe(2); // 2 names
  });

  it('flags large arrays (>= 20 items)', () => {
    const sample = { items: Array.from({ length: 25 }, (_, i) => i) };
    const result = analyzeJsonStructure(sample);
    expect(result.large_arrays).toContain('root.items');
  });

  it('tracks max depth for deeply nested structures', () => {
    const sample = { a: { b: { c: { d: 1 } } } };
    const result = analyzeJsonStructure(sample);
    expect(result.max_depth).toBeGreaterThanOrEqual(4);
  });
});
