export type Unit = (typeof timeUnitsOrder)[number];

export type TimeUnit = `${number}${Unit}`;

export type TimeUnits = TimeUnit | `${TimeUnit}:${TimeUnit}`;

const ms = 1;
const s = ms * 1000;
const m = s * 60;
const h = m * 60;
const d = h * 24;
const w = d * 7;
const mo = d * 30;
const y = d * 365;

export const timeUnits = { ms, s, m, h, d, w, mo, y };

export const timeUnitsOrder = [
  'ms',
  's',
  'm',
  'h',
  'd',
  'w',
  'mo',
  'y',
] as const;
