export type TimeUnitsNames = (typeof timeUnitsNamesAsc)[number];

const ms = 1;
const s = ms * 1000;
const m = s * 60;
const h = m * 60;
const d = h * 24;
const w = d * 7;
const mo = d * 30;
const y = d * 365;

export const timeUnits = {
  ms: { index: 0, value: ms, name: 'ms' },
  s: { index: 1, value: s, name: 's' },
  m: { index: 2, value: m, name: 'm' },
  h: { index: 3, value: h, name: 'h' },
  d: { index: 4, value: d, name: 'd' },
  w: { index: 5, value: w, name: 'w' },
  mo: { index: 6, value: mo, name: 'mo' },
  y: { index: 7, value: y, name: 'y' }
} as const;

export const timeUnitsNamesAsc = [
  'ms',
  's',
  'm',
  'h',
  'd',
  'w',
  'mo',
  'y',
] as const;


export const minUnit = timeUnits[timeUnitsNamesAsc[0]]

export const maxUnit = timeUnits[timeUnitsNamesAsc[timeUnitsNamesAsc.length - 1]]
