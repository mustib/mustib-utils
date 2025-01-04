import { AppError } from '../../AppError';

import { timeUnits, type TimeUnits } from '../constants';
import type { Options } from './Options';

export function millisecondsFromString(
  string: TimeUnits,
  options?: Options,
): number {
  if (typeof string !== 'string' || (string as string) === '') return 0;

  const { separator = ':' } = options || {};
  const parts = string.split(separator);
  const milliseconds = parts.reduce((prev, part) => {
    const regex = /^(?<value>\d+)(?<unit>[a-z]+)$/.exec(part);
    if (regex === null || regex.groups === undefined) {
      return AppError.throw(
        'Unsupported',
        `unsupported time part (${part})`,
      ) as never;
    }

    const unit = regex.groups.unit as keyof typeof timeUnits | undefined;
    if (unit === undefined || !Object.hasOwn(timeUnits, unit)) {
      return AppError.throw(
        'Unsupported',
        `unsupported time unit (${unit}) in (${part})`,
      ) as never;
    }

    const value = Number(regex.groups.value);
    if (Number.isNaN(value)) {
      return AppError.throw(
        'Unsupported',
        `unsupported time value (${value}) in (${part})`,
      ) as never;
    }

    return prev + timeUnits[unit] * value;
  }, 0);

  return milliseconds;
}
