import { assert, describe, expect, it } from 'vitest';

import { AppError } from '../../AppError';

import { timeUnits, timeUnitsNamesAsc } from '../constants';

import { millisecondsFromString } from '.';

describe('millisecondsFromString', () => {
  it('should return 0 when the input unit value is 0', () => {
    timeUnitsNamesAsc.forEach((unit) =>
      expect(millisecondsFromString(`0${unit}`)).toBe(0),
    );
  });

  it('should return the unit value when the input unit value is 1', () => {
    timeUnitsNamesAsc.forEach((unit) =>
      expect(millisecondsFromString(`1${unit}`)).toBe(timeUnits[unit].value),
    );
  });

  it('should return the sum of the unit values', () => {
    const timeString = timeUnitsNamesAsc.map((unit) => `1${unit}`).join(':');
    const sum = timeUnitsNamesAsc.reduce(
      (result, unit) => result + timeUnits[unit].value,
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

  it('should use unitsAlias if provided', () => {
    expect(
      millisecondsFromString('1second:2seconds', {
        unitsAlias: { second: 's', seconds: 's' },
      }),
    ).toBe(3000);
  });

  it('should use floating point values', () => {
    expect(millisecondsFromString('1.5s')).toBe(1500);
  });
});
