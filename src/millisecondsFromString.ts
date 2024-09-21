import { AppError } from './AppError.js';

type Options = { separator?: string };
type TimeUnit = `${number}${keyof typeof timeUnits}`;
export type TimeUnits = TimeUnit | `${TimeUnit}:${TimeUnit}`;

const ms = 1;
const s = ms * 1000;
const m = s * 60;
const h = m * 60;
const d = h * 24;
const w = d * 7;
const mo = d * 30;
const y = d * 365;

const timeUnits = { ms, s, m, h, d, w, mo, y };

export function millisecondsFromString(
  string: TimeUnits,
  options?: Options,
): number {
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
