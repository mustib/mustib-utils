import { LIBRARY_ERROR_SCOPE } from "../../constants"
import { AppError } from "../AppError"

type Options = {
  /**
   * Maximum number of attempts.
   * 
   * @default timeout === undefined ? 3 : Infinity
   */
  retries?: number

  /**
   * Milliseconds between attempts.
   * 
   * @default 0
   */
  interval?: number

  /**
   * Maximum total duration in milliseconds before giving up.
   * 
   * @default undefined
   */
  timeout?: number
}

type RetryFunction<T> = () => T;

export const retryErrorScope = [Symbol('@mustib/utils/retry'), LIBRARY_ERROR_SCOPE];

/**
 * Repeatedly invokes a function until it returns anything other than `undefined`, the maximum retry count is reached,
 * or the total timeout duration elapses.
 * 
 * Supports two overloads:
 * - `retry(fn)`
 * - `retry(options, fn)`
 *
 * @param options - Either an options object configuring the retry behavior or the function to retry.
 * @param fn - The function to retry (only required when the first argument is an options object).
 *
 * @returns A promise that resolves with:
 * - the first non-`undefined` value returned by the callback within retry constraints,
 * - or `undefined` if the maximum retry count is reached or time out.
 *
 * @example
 * ```ts
 * await retry(() => Math.random() > 0.5 || undefined);
 * 
 * await retry({ retries: 5, interval: 200, timeout: 1000 }, async () => {
 *   const response = await fetch("/some-endpoint");
 *   return response.ok ? response.json() : undefined; // only retry if the response is not ok or until timeout or retries are exhausted
 * });
 * ```
 */
export function retry<T extends RetryFunction<any>>(options: Options, fn: T): Promise<ReturnType<T> | undefined>
export function retry<T extends RetryFunction<any>>(fn: T): Promise<ReturnType<T> | undefined>
export function retry<T extends RetryFunction<any>>(optionsOrFn: Options | T, fn?: T): Promise<ReturnType<T> | undefined> {
  const isFn = typeof optionsOrFn === 'function'
  const options = isFn ? {} : optionsOrFn
  const callback = isFn ? optionsOrFn as T : fn as T

  const {
    interval = 0,
    timeout,
    retries = timeout === undefined ? 3 : Infinity,
  } = options;

  AppError.aggregate<'Invalid'>(async (appError) => {
    if (retries <= 0) {
      appError.push('Invalid', 'retries must be greater than 0', { scope: retryErrorScope })
    }
    if (interval < 0) {
      appError.push('Invalid', 'interval must be greater than or equal 0', { scope: retryErrorScope })
    }
    if (timeout !== undefined && timeout <= 0) {
      appError.push('Invalid', 'timeout must be greater than 0', { scope: retryErrorScope })
    }
    if (timeout !== undefined && timeout < interval) {
      appError.push('Invalid', 'timeout must be greater than interval', { scope: retryErrorScope })
    }
    if (retries === Infinity && timeout === undefined) {
      appError.push('Invalid', 'timeout must be defined if retries is Infinity', { scope: retryErrorScope })
    }
  },)

  let attempts = 0
  let intervalId: ReturnType<typeof setTimeout>
  let resolved = false

  return new Promise((resolve) => {
    const timeoutId = timeout !== undefined ? setTimeout(() => {
      if (resolved) return
      resolved = true
      clearTimeout(intervalId)
      resolve(undefined)
    }, timeout) : undefined

    const attempt = async () => {
      if (resolved) return

      const result = await callback()
      // resolve immediately if the callback returns a non-undefined value
      if (result !== undefined) {
        if (resolved) return
        resolved = true
        clearTimeout(timeoutId)
        resolve(result)
        return
      }

      attempts++

      if (attempts < retries) {
        intervalId = setTimeout(attempt, interval)
      } else {
        if (resolved) return
        resolved = true
        clearTimeout(timeoutId)
        resolve(undefined)
      }
    }

    attempt()
  })
};
