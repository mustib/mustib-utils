import { AppError } from '../../AppError';

import { timeUnitsOrder, timeUnits, type TimeUnitsNames } from '../constants';

type Options = Partial<{
  /**
   * Specifies the largest time unit to be included in the string representation, starting from y to ms.
   * @default 'y'
   */
  maxUnit: TimeUnitsNames;

  /**
   * Specifies the smallest time unit to be included in the string representation, starting from ms to y.
   * @default 'ms'
   */
  minUnit: TimeUnitsNames;

  /**
   * Specifies the behavior that will be applied to the decimal part of the time unit.
   */
  decimalBehavior: 'round' | 'floor' | 'ceil';

  /**
   * Specifies the maximum number of decimal places to be included in the string representation when the remaining milliseconds of the time unit are less than minUnit value and there are remaining milliseconds at the end.
   * @default 1
   */
  maxDecimalCount: number;

  /**
   * Specifies the time unit aliases to be used in the string representation.
   * it is an object where the key is the time unit and the value is the alias or an object with the singular and plural values.
   */
  unitsAlias: Partial<
    Record<
      TimeUnitsNames,
      string | Partial<Record<'singular' | 'plural', string>>
    >
  >;

  /**
   * Specifies the delimiter to be used between the time units in the string representation.
   * @default ':'
   */
  separator: string;
}>;

export function stringFromMilliseconds(
  milliseconds: number,
  options?: Options,
) {
  if (typeof milliseconds !== 'number' || Number.isNaN(milliseconds))
    return '0ms';

  const {
    decimalBehavior,
    maxDecimalCount = 1,
    maxUnit = 'y',
    minUnit = 'ms',
    unitsAlias,
    separator = ':',
  } = options ?? {};

  const timeParts: string[] = [];
  const maxUnitIndex = timeUnitsOrder.indexOf(maxUnit);

  if (maxUnitIndex === -1) {
    return AppError.throw(
      'Unsupported',
      `unsupported maxUnit (${maxUnit}) it must be one of (${timeUnitsOrder.join(', ')})`,
    );
  }

  const minUnitIndex = timeUnitsOrder.indexOf(minUnit);

  if (minUnitIndex === -1) {
    return AppError.throw(
      'Unsupported',
      `unsupported minUnit (${minUnit}) it must be one of (${timeUnitsOrder.join(', ')})`,
    );
  }

  if (minUnitIndex > maxUnitIndex) {
    return AppError.throw(
      'Invalid',
      `minUnit (${minUnit}) cannot be greater than maxUnit (${maxUnit})`,
    );
  }

  const units = timeUnitsOrder.slice(minUnitIndex, maxUnitIndex + 1);
  let remainingMilliseconds = milliseconds < 0 ? -milliseconds : milliseconds;

  for (
    let index = units.length - 1;
    remainingMilliseconds > 0 && index >= 0;
    index--
  ) {
    const unit = units[index];
    const unitValue = timeUnits[unit];
    let unitNameSingular: string = unit;
    let unitNamePlural: string = unit;
    const unitAlias = unitsAlias?.[unit];

    switch (typeof unitAlias) {
      case 'string':
        unitNameSingular = unitAlias;
        unitNamePlural = unitAlias;
        break;
      case 'object':
        if (typeof unitAlias.plural === 'string')
          unitNamePlural = unitAlias.plural;
        if (typeof unitAlias.singular === 'string')
          unitNameSingular = unitAlias.singular;
        break;
      default:
        unitAlias satisfies undefined;
        break;
    }

    const isTheLastUnit = index === 0;

    if (unitValue > remainingMilliseconds && !isTheLastUnit) continue;

    let value = Math.floor(remainingMilliseconds / unitValue);
    remainingMilliseconds %= unitValue;

    const hasRemainingTime = remainingMilliseconds > 0;

    if (isTheLastUnit && hasRemainingTime && minUnitIndex > 0) {
      const rawDecimal = remainingMilliseconds / unitValue;

      // 10 for base 10
      const decimalBase = 10 ** Math.abs(maxDecimalCount);
      const decimal = Math.floor(rawDecimal * decimalBase) / decimalBase;

      value += +decimal;
      remainingMilliseconds = 0;

      switch (decimalBehavior) {
        case 'ceil':
        case 'floor':
        case 'round':
          value = Math[decimalBehavior](value);
          break;
        default:
          decimalBehavior satisfies undefined;
          break;
      }
    }
    if (value > 0)
      timeParts.push(
        `${value}${value > 1 ? unitNamePlural : unitNameSingular}`,
      );
  }

  return timeParts.length > 0 ? timeParts.join(separator) : `0${getDefaultMinUnit({ minUnit, unitsAlias })}`;
}

/**
 * This function solves a where unitAlias is not applied if the milliseconds is 0
 */
function getDefaultMinUnit({ minUnit, unitsAlias }: { minUnit: TimeUnitsNames; unitsAlias: Options['unitsAlias'] }): string {
  let defaultMinUnit: string = minUnit;
  if (unitsAlias) {
    const minUnitAlias = unitsAlias[minUnit];
    if (typeof minUnitAlias === 'string') defaultMinUnit = minUnitAlias;
    else if (typeof minUnitAlias?.singular === 'string') defaultMinUnit = minUnitAlias.singular;
  }

  return defaultMinUnit;
}