import { describe, expect, it } from 'vitest';

import { parseJson } from '.';

describe('parseJson', () => {
  it('should return undefined when the string cannot be parsed as JSON', () => {
    expect(parseJson('not a json')).toBeUndefined();
  });

  it('should return the parsed value when the string can be parsed as JSON', () => {
    expect(parseJson('{"name":"John Doe","age":30}')).toEqual({
      name: 'John Doe',
      age: 30,
    });
  });
});
