import { describe, expect, it } from 'vitest';
import { validateJsonValue, validateRawJsonText, exceedsMaxDepth, MAX_JSON_TEXT_BYTES } from '../schema.js';

describe('validateRawJsonText', () => {
  it('rejects empty text', () => {
    expect(validateRawJsonText('')).toHaveLength(1);
    expect(validateRawJsonText('   ')).toHaveLength(1);
  });

  it('rejects null/undefined', () => {
    expect(validateRawJsonText(null)).toHaveLength(1);
    expect(validateRawJsonText(undefined)).toHaveLength(1);
  });

  it('accepts small valid-looking text', () => {
    expect(validateRawJsonText('{"a":1}')).toHaveLength(0);
  });

  it('rejects text over the max size with a helpful message', () => {
    const huge = 'a'.repeat(MAX_JSON_TEXT_BYTES + 10);
    const errors = validateRawJsonText(huge);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/too large/i);
  });
});

describe('exceedsMaxDepth', () => {
  it('returns false for shallow structures', () => {
    expect(exceedsMaxDepth({ a: { b: 1 } }, 5)).toBe(false);
  });

  it('returns true for structures deeper than the limit', () => {
    let node = { value: 1 };
    for (let i = 0; i < 10; i += 1) {
      node = { child: node };
    }
    expect(exceedsMaxDepth(node, 5)).toBe(true);
  });

  it('returns false for primitives', () => {
    expect(exceedsMaxDepth('hello', 5)).toBe(false);
    expect(exceedsMaxDepth(42, 5)).toBe(false);
    expect(exceedsMaxDepth(null, 5)).toBe(false);
  });
});

describe('validateJsonValue', () => {
  it('accepts null, arrays, objects, strings, numbers, booleans', () => {
    expect(validateJsonValue(null)).toHaveLength(0);
    expect(validateJsonValue([])).toHaveLength(0);
    expect(validateJsonValue({})).toHaveLength(0);
    expect(validateJsonValue('text')).toHaveLength(0);
    expect(validateJsonValue(42)).toHaveLength(0);
    expect(validateJsonValue(true)).toHaveLength(0);
  });

  it('rejects a pathologically deep object with a friendly message', () => {
    let node = { value: 1 };
    for (let i = 0; i < 100; i += 1) {
      node = { child: node };
    }
    const errors = validateJsonValue(node);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/too deep/i);
  });
});
