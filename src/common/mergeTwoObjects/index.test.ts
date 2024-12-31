import { describe, it, expect } from 'vitest';
import { mergeTwoObjects } from './index';

describe('mergeTwoObjects', () => {
  it('should merge two plain objects', () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    const result = mergeTwoObjects(target, source);
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('should deeply merge nested objects', () => {
    const target = { a: { b: 1 }, c: 2 };
    const source = { a: { d: 3 }, e: 4 };
    const result = mergeTwoObjects(target, source);
    expect(result).toEqual({ a: { b: 1, d: 3 }, c: 2, e: 4 });
  });

  it('should return source if target is not an object', () => {
    const target = null;
    const source = { a: 1 };
    const result = mergeTwoObjects(target, source);
    expect(result).toEqual(source);
  });

  it('should return source if source is not an object', () => {
    const target = { a: 1 };
    const source = null;
    const result = mergeTwoObjects(target, source);
    expect(result).toEqual(source);
  });

  it('should mutate the target object if shouldMutateTarget is true', () => {
    const target = { a: 1 };
    const source = { b: 2 };
    mergeTwoObjects(target, source, true);
    expect(target).toEqual({ a: 1, b: 2 });
  });

  it('should not mutate the target object if shouldMutateTarget is false', () => {
    const target = { a: 1 };
    const source = { b: 2 };
    const result = mergeTwoObjects(target, source, false);
    expect(target).toEqual({ a: 1 });
    expect(result).toEqual({ a: 1, b: 2 });
  });
});
