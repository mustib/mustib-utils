import { LIBRARY_ERROR_SCOPE } from '../../../constants';
import { AppError } from '../../AppError';

import { timeUnits, type TimeUnitsNames } from '../constants';

type Options = Partial<{
  /** Separator to split time units by @default ':' */
  separator: string;

  /**
   * Specifies the time unit aliases that are used in the provided string
   * it is an object where keys are aliases and values are time units
   */
  unitsAlias: Record<string, TimeUnitsNames>;
}>;

export const millisecondsFromStringErrorScope = [Symbol.for('@mustib/utils/millisecondsFromString'), LIBRARY_ERROR_SCOPE];

function isValidUnit(unitName: string): unitName is TimeUnitsNames {
  return Object.hasOwn(timeUnits, unitName);
}

const regex = /^(?<value>\d*\.?\d+)(?<unit>[a-z]+)$/;

export function millisecondsFromString(
  string: string,
  options?: Options,
): number {
  if (typeof string !== 'string' || string === '') return 0;

  const { separator = ':', unitsAlias } = options || {};

  return string.split(separator).reduce((prev, part) => {
    const regexResult = regex.exec(part);

    if (regexResult === null || regexResult.groups === undefined) {
      return AppError.throw(
        'Unsupported',
        `unsupported time part (${part})`,
        { pushOptions: { scope: millisecondsFromStringErrorScope } }
      ) as never;
    }

    const { unit = '' } = regexResult.groups;
    const unitName = unitsAlias?.[unit] ?? unit;

    if (!isValidUnit(unitName)) {
      return AppError.throw(
        'Unsupported',
        `unsupported time unit (${unitName}) in (${part})`,
        { pushOptions: { scope: millisecondsFromStringErrorScope } }
      ) as never;
    }

    const value = Number(regexResult.groups.value);

    if (Number.isNaN(value)) {
      return AppError.throw(
        'Unsupported',
        `unsupported time value (${value}) in (${part})`,
        { pushOptions: { scope: millisecondsFromStringErrorScope } }
      ) as never;
    }

    return prev + timeUnits[unitName].value * value;
  }, 0);
}
