import { assert, describe, expect, it } from 'vitest';

import { AppError } from '../../AppError';

import { timeUnits, timeUnitsOrder } from '../constants';

import { stringFromMilliseconds } from '.';

const oneDay = timeUnits.d;
const oneMinute = timeUnits.m;

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

  it('should use minUnit if provided', () => {
    expect(stringFromMilliseconds(1000, { minUnit: 's' })).toBe('1s');
  });

  it('should use minUnit and maxUnit together if provided', () => {
    expect(
      stringFromMilliseconds(oneDay + oneMinute / 2, {
        minUnit: 'm',
        maxUnit: 'h',
      }),
    ).toBe('24h:0.5m');
  });

  it('should use maxDecimalCount if provided and default to 1', () => {
    expect(
      stringFromMilliseconds(2750, {
        maxDecimalCount: 0,
        minUnit: 's',
      }),
    ).toBe('2s');

    expect(
      stringFromMilliseconds(2750, {
        maxDecimalCount: 1,
        minUnit: 's',
      }),
    ).toBe('2.7s');

    expect(
      stringFromMilliseconds(2750, {
        maxDecimalCount: 2,
        minUnit: 's',
      }),
    ).toBe('2.75s');
  });

  it('should use decimalBehavior if provided', () => {
    expect(
      stringFromMilliseconds(1400, { decimalBehavior: 'round', minUnit: 's' }),
    ).toBe('1s');

    expect(
      stringFromMilliseconds(1500, { decimalBehavior: 'round', minUnit: 's' }),
    ).toBe('2s');

    expect(
      stringFromMilliseconds(1500, { decimalBehavior: 'ceil', minUnit: 's' }),
    ).toBe('2s');

    expect(
      stringFromMilliseconds(1500, { decimalBehavior: 'floor', minUnit: 's' }),
    ).toBe('1s');

    expect(
      stringFromMilliseconds(1500, { minUnit: 's' }),
      'should use exact decimal value if decimalBehavior is not provided',
    ).toBe('1.5s');
  });

  it('should return 0 minUnit if the input is 0 and minUnit is provided', () => {
    timeUnitsOrder.forEach((unit) => {
      expect(stringFromMilliseconds(0, { minUnit: unit })).toBe(`0${unit}`);
    });
  });

  it('should use unitsAlias if provided', () => {
    expect(
      stringFromMilliseconds(1000, { unitsAlias: { s: 'second' } }),
      'should use string as singular',
    ).toBe('1second');

    expect(
      stringFromMilliseconds(2000, { unitsAlias: { s: 'second' } }),
      'should use string as plural',
    ).toBe('2second');

    expect(
      stringFromMilliseconds(1000, {
        unitsAlias: { s: { singular: 'second' } },
      }),
      'should use object singular value',
    ).toBe('1second');

    expect(
      stringFromMilliseconds(2000, {
        unitsAlias: { s: { plural: 'seconds' } },
      }),
      'should use object plural value',
    ).toBe('2seconds');

    expect(
      stringFromMilliseconds(1000, {
        unitsAlias: { s: { singular: undefined } },
      }),
      'should default to unit name if object singular value is not provided',
    ).toBe('1s');

    expect(
      stringFromMilliseconds(2000, {
        unitsAlias: { s: { plural: undefined } },
      }),
      'should default to unit name if object plural value is not provided',
    ).toBe('2s');
  });

  it('should use separator if provided', () => {
    expect(
      stringFromMilliseconds(2500, {
        separator: ' & ',
      }),
    ).toBe('2s & 500ms');
  });
});
