
/**
 *  an extension of the native typeof which determines the real type of the values that typeof lacks
 *
 * @param {any} value - The value to determine the type of.
 * @return {string} The type of the value. Possible return values are:
 * - 'buffer' if the value is an instance of Uint8Array
 * - 'string' if the value is a string
 * - 'boolean' if the value is a boolean
 * - 'undefined' if the value is undefined
 * - 'function' if the value is a function
 * - 'number' if the value is a number (excluding NaN)
 * - 'array' if the value is an array
 * - 'null' if the value is null
 * - 'invalid_date' if the value is an invalid Date object
 * - 'date' if the value is a valid Date object
 * - 'object' if the value is any other object
 * - 'unknown' if the value is of an unknown type
 */
export function getTypeof(value: any) {
  const type = typeof value;

  if (
    type === 'string' ||
    type === 'boolean' ||
    type === 'undefined' ||
    type === 'function'
  ) {
    return type;
  }

  if (type === 'number') {
    if (Number.isNaN(value)) return 'NaN';
    return 'number';
  }

  if (type === 'object') {
    if (Array.isArray(value)) return 'array';
    if (value === null) return 'null';
    if (value instanceof Date) {
      if (value.toString() === 'Invalid Date') return 'invalid_date';
      return 'date';
    }
    if (value instanceof Uint8Array || value instanceof ArrayBuffer)
      return 'buffer';

    return 'object';
  }

  return 'unknown';
}
