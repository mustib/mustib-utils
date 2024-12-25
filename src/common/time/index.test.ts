import { describe, expect, it } from 'vitest';

import { millisecondsFromString } from './millisecondsFromString';

import { stringFromMilliseconds } from './stringFromMilliseconds';

describe('millisecondsFromString and stringFromMilliseconds', () => {
  it('should work the same way and return the same value as the input of the other function', () => {
    expect(stringFromMilliseconds(millisecondsFromString('1h'))).toBe('1h');
    expect(millisecondsFromString(stringFromMilliseconds(1000))).toBe(1000);
  });
});
