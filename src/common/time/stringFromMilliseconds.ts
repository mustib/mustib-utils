import { AppError } from '../AppError';

import {
  timeUnitsOrder,
  timeUnits,
  type TimeUnits,
  type Unit,
  type TimeUnit,
} from './constants';

export function stringFromMilliseconds(
  milliseconds: number,
  options?: {
    maxUnit: Unit;
  },
): TimeUnits {
  if (typeof milliseconds !== 'number' || Number.isNaN(milliseconds))
    return '0ms';

  const timeParts: TimeUnit[] = [];
  const maxUnitIndex =
    options?.maxUnit !== undefined
      ? timeUnitsOrder.indexOf(options?.maxUnit)
      : timeUnitsOrder.length - 1;

  if (maxUnitIndex === -1) {
    return AppError.throw(
      'Unsupported',
      `unsupported maxUnit (${options?.maxUnit}) it must be one of (${timeUnitsOrder.join(', ')})`,
    ) as never;
  }

  const units = timeUnitsOrder.slice(0, maxUnitIndex + 1);
  let remainingMilliseconds = milliseconds < 0 ? -milliseconds : milliseconds;

  for (
    let index = units.length - 1;
    remainingMilliseconds > 0 && index >= 0;
    index--
  ) {
    const unit = units[index];
    const unitValue = timeUnits[unit];

    if (unitValue > remainingMilliseconds) continue;

    const value = Math.floor(remainingMilliseconds / unitValue);
    remainingMilliseconds %= timeUnits[unit];
    timeParts.push(`${value}${unit}`);
  }

  return (timeParts.length > 0 ? timeParts.join(':') : '0ms') as TimeUnits;
}
