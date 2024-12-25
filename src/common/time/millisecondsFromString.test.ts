import { assert, describe, expect, it } from 'vitest';

import { AppError } from '../AppError';

import { timeUnits, timeUnitsOrder, type TimeUnits } from './constants';

import { millisecondsFromString } from './millisecondsFromString';

describe('millisecondsFromString', () => {
  it('should return 0 when the input unit value is 0', () => {
    timeUnitsOrder.forEach((unit) =>
      expect(millisecondsFromString(`0${unit}`)).toBe(0),
    );
  });

  it('should return the unit value when the input unit value is 1', () => {
    timeUnitsOrder.forEach((unit) =>
      expect(millisecondsFromString(`1${unit}`)).toBe(timeUnits[unit]),
    );
  });

  it('should return the sum of the unit values', () => {
    const timeString = timeUnitsOrder
      .map((unit) => `1${unit}`)
      .join(':') as TimeUnits;
    const sum = timeUnitsOrder.reduce(
      (result, unit) => result + timeUnits[unit],
      0,
    );
    expect(millisecondsFromString(timeString)).toBe(sum);
  });

  it('should throw Unsupported error type when the time part is invalid', () => {
    assert.throws(
      () => millisecondsFromString(':' as any),
      AppError,
      'unsupported time part',
    );
  });

  it('should throw Unsupported error type when the time unit is invalid', () => {
    assert.throws(
      () => millisecondsFromString('1x' as any),
      AppError,
      'unsupported time unit',
    );
  });

  it('should throw Unsupported error type when the time part is invalid', () => {
    assert.throws(
      () => millisecondsFromString('ms' as any),
      AppError,
      'unsupported time part',
    );
  });

  it('should return 0 when the time unit is not a string or empty string', () => {
    expect(millisecondsFromString('' as any)).toBe(0);
    expect(millisecondsFromString(NaN as any)).toBe(0);
  });
});
