
import { AppError } from "@common/AppError";
import { LIBRARY_ERROR_SCOPE } from "@constants";

type ErrorTypes = 'Invalid' | 'Abort'

export const deferredValueErrorScope = [Symbol('@mustib/utils/DeferredValue'), LIBRARY_ERROR_SCOPE];

/**
 * A utility class that represents a value that will be available at some point in the future.
 * It encapsulates a Promise and provides methods to resolve, reject, and reset the Promise.
 *
 * @template T The type of the value that the DeferredValue will hold.
 */
export class DeferredValue<T> {
  /**
   * The Promise that this DeferredValue encapsulates.
   */
  private _promise!: Promise<T>;

  /**
   * The function to resolve the Promise.
   * @private
   */
  private _resolve!: (v: T) => void;

  /**
   * The function to reject the Promise.
   * @private
   */
  private _reject!: (reason: Error) => void;

  /**
   * The current status of the DeferredValue.
   * - `pending`: The DeferredValue is waiting to be resolved or rejected.
   * - `resolved`: The DeferredValue has been resolved.
   * - `rejected`: The DeferredValue has been rejected.
   *
   * @private
   */

  private _status: 'pending' | 'resolved' | 'rejected' = 'pending';

  private _resolvedValue: T | undefined;

  get current(): Promise<T> {
    return this._promise;
  }

  /**
   * Gets the resolved value of the DeferredValue.
   * @returns {T} The resolved value.
   * @throws {AppError<ErrorTypes>} If the DeferredValue is not yet resolved.
   */
  get resolvedValue(): T {
    if (!this.isResolved) {
      AppError.throw<ErrorTypes>('Invalid', 'cannot get resolvedValue, DeferredValue is not resolved yet', {
        pushOptions: {
          scope: deferredValueErrorScope
        }
      })
    }

    return this._resolvedValue!;
  }

  /**
   * Gets whether the DeferredValue is pending.
   * @returns {boolean} True if the DeferredValue is pending, false otherwise.
   */
  get isPending(): boolean {
    return this._status === 'pending';
  }

  /**
   * Gets whether the DeferredValue is resolved.
   * @returns {boolean} True if the DeferredValue is resolved, false otherwise.
   */
  get isResolved(): boolean {
    return this._status === 'resolved';
  }

  /**
   * Gets whether the DeferredValue is rejected.
   * @returns {boolean} True if the DeferredValue is rejected, false otherwise.
   */
  get isRejected(): boolean {
    return this._status === 'rejected';
  }

  /**
   * Gets whether the DeferredValue is fulfilled (resolved or rejected).
   * @returns {boolean} True if the DeferredValue is fulfilled, false otherwise.
   */
  get isFulfilled(): boolean {
    return this.isResolved || this.isRejected;
  }

  /**
   * Creates a new DeferredValue.
   */
  constructor() {
    this._reset();
  }

  /**
   * Resolves the DeferredValue with the given value.
   * @param {T} v The value to resolve the DeferredValue with.
   * @returns {void}
   */
  resolve(v: T): void {
    if (this.isFulfilled) {
      AppError.throw<ErrorTypes>('Invalid', 'cannot resolve, DeferredValue is already fulfilled — call reset() first', {
        stackTraceConstructor: this.resolve,
        pushOptions: {
          scope: deferredValueErrorScope
        }
      })
    }

    this._resolvedValue = v;
    this._status = 'resolved';
    this._resolve(v);
  }

  /**
   * Rejects the DeferredValue with the given reason.
   * @param {Error} reason The reason to reject the DeferredValue with.
   * @returns {void}
   */
  reject(reason: Error): void {
    if (this.isFulfilled) {
      AppError.throw<ErrorTypes>('Invalid', 'cannot reject, DeferredValue is already fulfilled — call reset() first', {
        stackTraceConstructor: this.reject,
        pushOptions: {
          scope: deferredValueErrorScope
        }
      })
    }

    this._status = 'rejected';
    this._resolvedValue = undefined;
    this._reject(reason);
  }

  /**
   * Aborts the DeferredValue, rejecting it with an AppError if it is still pending.
   * @returns {void}
   */
  abort(): void {
    if (this.isPending) {
      this.reject(new AppError<ErrorTypes>(
        { stackTraceConstructor: this.abort })
        .push('Abort',
          'DeferredValue was aborted', {
          scope: deferredValueErrorScope
        }))
    }

    this._reset()
  }

  /**
   * Resets the DeferredValue to its initial state.
   * @returns {void}
   */
  reset(): void {
    if (this.isPending) {
      AppError.throw<ErrorTypes>('Invalid', 'cannot reset, DeferredValue is already pending — call abort() instead', {
        stackTraceConstructor: this.reset,
        pushOptions: {
          scope: deferredValueErrorScope
        }
      })
    };

    this._reset();
  }

  /**
   * Resets the DeferredValue to its initial state.
   * @private
   */
  private _reset(): void {
    this._status = 'pending';
    this._resolvedValue = undefined;
    this._promise = new Promise<T>((res, rej) => {
      this._resolve = res;
      this._reject = rej;
    });
  }
}
