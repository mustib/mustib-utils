import type { Func } from "../types";


/**
 * Creates a debounced version of the provided function that delays its execution until after
 * a specified number of milliseconds have elapsed since the last time it was invoked.
 *
 * @param func - The function to debounce.
 * @param ms - The number of milliseconds to delay; defaults to 100ms.
 * @returns A debounced version of the input function.
 */
export function debounce<T extends Func = Func>(func: T, ms = 100) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return <T>function debounced(...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), ms);
  }
}