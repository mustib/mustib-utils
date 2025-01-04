import { assert, describe, expect, it } from 'vitest';

import { AppError } from '../../AppError';

import { timeUnits, timeUnitsOrder } from '../constants';

import { stringFromMilliseconds } from '.';

describe('stringFromMilliseconds', () => {
  it('should return 0ms when the input unit value is not a number or NaN', () => {
    expect(stringFromMilliseconds(NaN)).toBe('0ms');
    expect(stringFromMilliseconds('string' as any)).toBe('0ms');
    expect(stringFromMilliseconds(undefined as any)).toBe('0ms');
  });

  it('should throw unsupported error when maxUnit is invalid', () => {
    assert.throws(
      () => stringFromMilliseconds(0, { maxUnit: 'invalid' as any }),
      AppError,
      'unsupported maxUnit',
    );
  });

  timeUnitsOrder.forEach((unit) => {
    it(`should return 1${unit} when the input unit value is ${timeUnits[unit]}`, () => {
      expect(stringFromMilliseconds(timeUnits[unit])).toBe(`1${unit}`);
    });
  });

  it('should return the sum of the unit values', () => {
    const result = `1${timeUnitsOrder.toReversed().join(':1')}`;
    const unitsSum = timeUnitsOrder.reduce(
      (sum, unit) => sum + timeUnits[unit],
      0,
    );
    expect(stringFromMilliseconds(unitsSum)).toBe(result);
  });

  it('should use maxUnit if provided', () => {
    expect(stringFromMilliseconds(1000, { maxUnit: 'ms' })).toBe('1000ms');
  });
});
