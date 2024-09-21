/**
 * Parses a string as JSON and returns the parsed value. If the string cannot be parsed as JSON,
 * it returns undefined.
 *
 * @param {string} value - The string to parse as JSON.
 * @return {T | undefined} - The parsed JSON value or undefined (since undefined is not a valid JSON).
 */
export function parseJson<T>(value: string) {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    return undefined;
  }
}