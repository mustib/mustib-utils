import { describe, expect, it } from 'vitest';

import { getTypeof } from '.';

describe('getTypeof', () => {
  it('should return "string" for string values', () => {
    expect(getTypeof('hello')).toBe('string');
  });

  it('should return "boolean" for boolean values', () => {
    expect(getTypeof(true)).toBe('boolean');
  });

  it('should return "undefined" for undefined values', () => {
    expect(getTypeof(undefined)).toBe('undefined');
  });

  it('should return "function" for function values', () => {
    expect(getTypeof(() => {})).toBe('function');
  });

  it('should return "symbol" for symbol values', () => {
    expect(getTypeof(Symbol(''))).toBe('symbol');
  });

  it('should return "number" for number values', () => {
    expect(getTypeof(42)).toBe('number');
  });

  it('should return "NaN" for NaN values', () => {
    expect(getTypeof(NaN)).toBe('NaN');
  });

  it('should return "array" for array values', () => {
    expect(getTypeof([])).toBe('array');
  });

  it('should return "null" for null values', () => {
    expect(getTypeof(null)).toBe('null');
  });

  it('should return "invalid_date" for invalid Date objects', () => {
    expect(getTypeof(new Date('invalid-date'))).toBe('invalid_date');
  });

  it('should return "date" for valid Date objects', () => {
    expect(getTypeof(new Date())).toBe('date');
  });

  it('should return "buffer" for Uint8Array instances', () => {
    expect(getTypeof(new Uint8Array())).toBe('buffer');
  });

  it('should return "object" for regular objects', () => {
    expect(getTypeof({})).toBe('object');
  });
});
