
/**
 * Clamps a number to be within a specified range.
 *
 * @param {number} minValue - The minimum allowed value for the number.
 * @param {number} currentValue - The current value of the number.
 * @param {number} maxValue - The maximum allowed value for the number.
 * @returns {number} The clamped value, which is within the specified range [minValue, maxValue].
 */
export function mathClamp(minValue: number, currentValue: number, maxValue: number): number {
  return Math.min(Math.max(currentValue, minValue), maxValue);
}
