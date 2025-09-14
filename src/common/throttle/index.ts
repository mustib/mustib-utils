import type { Func } from "../types";


/**
 * Creates a throttled version of the given function that, when invoked repeatedly,
 * will only call the original function at most once every `ms` milliseconds.
 *
 * @param func - The function to throttle.
 * @param ms - The number of milliseconds to throttle invocations to. Defaults to 100ms.
 * @returns A throttled version of the input function.
 */
export function throttle<T extends Func = Func>(func: T, ms = 100) {
  let isThrottled = false;
  return <T>function throttled(...args: any[]) {
    if (isThrottled) return;
    isThrottled = true;
    func(...args);
    setTimeout(() => { isThrottled = false }, ms);
  }
}
