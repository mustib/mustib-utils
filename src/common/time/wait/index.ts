/**
 * Returns a promise that resolves after a specified number of milliseconds.
 *
 * @param milliseconds - The number of milliseconds to wait before resolving the promise. Defaults to 0.
 * @returns A promise that resolves after the specified delay.
 */
export function wait(milliseconds = 0) {
  return new Promise(r => { setTimeout(r, milliseconds) })
}