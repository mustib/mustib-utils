import { AppError } from '../../AppError';

import { timeUnitsNamesAsc, timeUnits, maxUnit as _maxUnit, minUnit as _minUnit, type TimeUnitsNames } from '../constants';

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
   * It is a string that can be one of the following: `round`, `floor`, `ceil`.
   * 
   * **NOTE:** When used `maxDecimalCount` option is useless
   * @default undefined
   */
  decimalBehavior: 'round' | 'floor' | 'ceil';

  /**
   * Specifies the maximum number of decimal places to be included in the string representation when the remaining milliseconds of the time unit are less than minUnit value and there are remaining milliseconds at the end.
   * 
   * **NOTE:** This option is useless when `decimalBehavior` exists or `minUnit` is greater than `ms`.
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
    maxUnit = _maxUnit.name,
    minUnit = _minUnit.name,
    unitsAlias,
    separator = ':',
  } = options ?? {};

  const { minUnitIndex, maxUnitIndex } = getMinAndMaxUnitIndexes({ minUnit, maxUnit });
  const partsData = generatePartsData()
  const unitsRangeDesc = timeUnitsNamesAsc.slice(minUnitIndex, maxUnitIndex + 1).reverse();
  let remainingMilliseconds = milliseconds < 0 ? -milliseconds : milliseconds;

  for (const unit of unitsRangeDesc) {
    const unitData = timeUnits[unit]
    if (remainingMilliseconds < unitData.value) continue;
    partsData[unit].value = Math.floor(remainingMilliseconds / unitData.value);
    remainingMilliseconds %= unitData.value
  }

  if (remainingMilliseconds > 0) {
    // raw decimal before operating on it
    const rawDecimal = remainingMilliseconds / timeUnits[minUnit].value;

    switch (decimalBehavior) {
      case 'floor':
        partsData[minUnit].value = Math[decimalBehavior](partsData[minUnit].value + rawDecimal);
        break;
      case 'round':
      case 'ceil': {
        const valueWithRoundedDecimal = Math[decimalBehavior](partsData[minUnit].value + rawDecimal)
        const unitData = timeUnits[minUnit]
        const nextUnit = timeUnits[timeUnitsNamesAsc[unitData.index + 1]]
        const isOverflow = valueWithRoundedDecimal * unitData.value >= nextUnit.value
        const isLastUnit = minUnitIndex === maxUnitIndex

        if (isOverflow && !isLastUnit) {
          partsData[nextUnit.name].value++
          partsData[minUnit].value = 0
        } else {
          partsData[minUnit].value = valueWithRoundedDecimal
        }
      }
        break;
      default:
        decimalBehavior satisfies undefined; {
          // 10 for base 10 decimal to detect how many decimal places are needed
          const decimalBase = 10 ** Math.abs(maxDecimalCount);
          // decimal with the correct number of decimal places
          const decimal = Math.floor(rawDecimal * decimalBase) / decimalBase;
          // add decimal to minUnit
          partsData[minUnit].value += +decimal;
        }
        break;
    }
    remainingMilliseconds = 0;
  }

  const formattedParts = (unitsRangeDesc.reduce((result, unit) => {
    const partValue = partsData[unit].value
    if (partValue === 0) return result

    result.push(generatePartString({ partValue, unitAlias: unitsAlias?.[unit], unitName: unit }))
    return result
  }, [] as string[]))

  return formattedParts.length > 0 ? formattedParts.join(separator) : generatePartString({ unitName: minUnit, partValue: partsData[minUnit].value, unitAlias: unitsAlias?.[minUnit] })
}

function generatePartString({ partValue, unitName, unitAlias }: { partValue: number; unitName: TimeUnitsNames, unitAlias: Required<Options>['unitsAlias'][TimeUnitsNames] | undefined }) {
  let unitNameSingular: string = unitName;
  let unitNamePlural: string = unitName;

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

  return (`${partValue}${partValue > 1 ? unitNamePlural : unitNameSingular}`)
}

function generatePartsData() {
  const partsData: {
    [unit in TimeUnitsNames]: {
      value: number;
    }
  } = {
    y: { value: 0 },
    mo: { value: 0 },
    w: { value: 0 },
    d: { value: 0 },
    h: { value: 0 },
    m: { value: 0 },
    s: { value: 0 },
    ms: { value: 0 },
  };

  return partsData
}

function getMinAndMaxUnitIndexes({ minUnit, maxUnit }: { minUnit: TimeUnitsNames; maxUnit: TimeUnitsNames }) {
  if (!(maxUnit in timeUnits)) {
    return AppError.throw(
      'Unsupported',
      `unsupported maxUnit (${maxUnit}) it must be one of (${timeUnitsNamesAsc.join(', ')})`,
    );
  }

  if (!(minUnit in timeUnits)) {
    return AppError.throw(
      'Unsupported',
      `unsupported minUnit (${minUnit}) it must be one of (${timeUnitsNamesAsc.join(', ')})`,
    );
  }

  const minUnitIndex = timeUnits[minUnit].index;
  const maxUnitIndex = timeUnits[maxUnit].index;

  if (minUnitIndex > maxUnitIndex) {
    return AppError.throw(
      'Invalid',
      `minUnit (${minUnit}) cannot be greater than maxUnit (${maxUnit})`,
    );
  }

  return { minUnitIndex, maxUnitIndex };
}
