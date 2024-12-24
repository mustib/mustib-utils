import { describe, expect, it } from 'vitest';

import { capitalize } from '.';

describe('capitalize', () => {
  it('should capitalize only the first letter of a string', () => {
    const word = 'hello world';
    const result = 'Hello world';
    expect(capitalize(word, { onlyFirstWord: true })).toBe(result);
  });

  it('should capitalize each word in a string by default', () => {
    const word = 'hello world';
    const result = 'Hello World';
    expect(capitalize(word)).toBe(result);
  });

  it('should capitalize using a custom splitter', () => {
    const word = 'hello-world';
    const result = 'Hello-World';
    expect(capitalize(word, { splitter: '-' })).toBe(result);
  });

  it('should capitalize using a custom joiner', () => {
    const word = 'hello world';
    const result = 'Hello-World';
    expect(capitalize(word, { joiner: '-' })).toBe(result);
  });

  it('should use custom splitter as default joiner', () => {
    const word = 'hello-world';
    const result = 'Hello-World';
    expect(capitalize(word, { splitter: '-' })).toBe(result);
  });

  it('should use custom splitter and custom joiner', () => {
    const word = 'hello-world';
    const result = 'Hello_World';
    expect(capitalize(word, { splitter: '-', joiner: '_' })).toBe(result);
  });

  it('should ignore splitter and joiner when capitalizing only the first word', () => {
    const word = 'hello-world';
    const result = 'Hello-world';
    expect(
      capitalize(word, { splitter: '-', joiner: ' ', onlyFirstWord: true }),
    ).toBe(result);
  });
});
