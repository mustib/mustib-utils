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
  ms: { index: 0, value: ms, name: 'ms', size: 3 },
  s: { index: 1, value: s, name: 's', size: 2 },
  m: { index: 2, value: m, name: 'm', size: 2 },
  h: { index: 3, value: h, name: 'h', size: 2 },
  d: { index: 4, value: d, name: 'd', size: 2 },
  w: { index: 5, value: w, name: 'w', size: 1 },
  mo: { index: 6, value: mo, name: 'mo', size: 2 },
  y: { index: 7, value: y, name: 'y', size: 2 },
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

export const maxUnit = timeUnits[timeUnitsNamesAsc[timeUnitsNamesAsc.length - 1]!]
