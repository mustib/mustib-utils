import { describe, it, expect, vi } from 'vitest';
import { AppError } from '@common/AppError';
import { wait } from '@common/time/wait';
import { DeferredValue } from '.';

describe('DeferredValue', () => {
  it('should be in pending state initially', () => {
    const deferred = new DeferredValue<string>();
    expect(deferred.isPending).toBe(true);
    expect(deferred.isResolved).toBe(false);
    expect(deferred.isRejected).toBe(false);
    expect(deferred.isFulfilled).toBe(false);
  });

  it('should throw when getting resolvedValue while pending', () => {
    const deferred = new DeferredValue<string>();
    expect(() => deferred.resolvedValue).toThrow(AppError);
  });

  it('should resolve with a value', async () => {
    const deferred = new DeferredValue<string>();
    const promise = deferred.current;
    deferred.resolve('test');

    await expect(promise).resolves.toBe('test');
    expect(deferred.isResolved).toBe(true);
    expect(deferred.isPending).toBe(false);
    expect(deferred.isFulfilled).toBe(true);
    expect(deferred.resolvedValue).toBe('test');
  });

  it('should reject with an error', async () => {
    const deferred = new DeferredValue<string>();
    const promise = deferred.current;
    const error = new Error('test error');
    deferred.reject(error);

    await expect(promise).rejects.toThrow(error);
    expect(deferred.isRejected).toBe(true);
    expect(deferred.isPending).toBe(false);
    expect(deferred.isFulfilled).toBe(true);
    expect(() => deferred.resolvedValue).toThrow(AppError);
  });

  it('should throw when trying to resolve a fulfilled deferred value', () => {
    const deferred = new DeferredValue<string>();
    deferred.resolve('test');
    expect(() => deferred.resolve('another test')).toThrow(AppError);
  });

  it('should throw when trying to reject a fulfilled deferred value', () => {
    const deferred = new DeferredValue<string>();
    deferred.resolve('test');
    expect(() => deferred.reject(new Error('error'))).toThrow(AppError);
  });

  it('should throw when trying to reset a pending deferred value', () => {
    const deferred = new DeferredValue<string>();
    expect(() => deferred.reset()).toThrow(AppError);
  });

  it('should reset a fulfilled deferred value', async () => {
    const deferred = new DeferredValue<string>();
    deferred.resolve('test');
    await deferred.current;

    deferred.reset();

    expect(deferred.isPending).toBe(true);
    expect(deferred.isResolved).toBe(false);
    expect(deferred.isRejected).toBe(false);
    expect(deferred.isFulfilled).toBe(false);

    const promise = deferred.current;
    deferred.resolve('new value');
    await expect(promise).resolves.toBe('new value');
  });

  it('should abort a pending deferred value', async () => {
    const deferred = new DeferredValue<string>();
    const promise = deferred.current;

    const abortSpy = vi.spyOn(deferred, 'abort');
    deferred.abort();

    expect(abortSpy).toHaveBeenCalled();
    await expect(promise).rejects.toThrow(AppError);
    await expect(promise).rejects.toThrow('DeferredValue was aborted');

    expect(deferred.isPending).toBe(true);
  });

  it('should reset when aborting a fulfilled deferred value', () => {
    const deferred = new DeferredValue<string>();
    deferred.resolve('test');
    const abortSpy = vi.spyOn(deferred, 'abort');
    deferred.abort();

    expect(abortSpy).toHaveBeenCalled();
    // After aborting a resolved promise, the promise is reset
    expect(deferred.isPending).toBe(true);
    expect(deferred.isResolved).toBe(false);
  });

  it('should be fulfilled when resolved or rejected', () => {
    const deferred1 = new DeferredValue<string>();
    deferred1.resolve('test');
    expect(deferred1.isFulfilled).toBe(true);

    const deferred2 = new DeferredValue<string>();
    deferred2.reject(new Error('test'));
    deferred2.current.catch(() => { }); // handle rejection
    expect(deferred2.isFulfilled).toBe(true);
  });

  it('should handle being awaited', async () => {
    const deferred = new DeferredValue<string>();
    const fn = async () => {
      await wait(10);
      deferred.resolve('awaited');
    };
    fn();
    const result = await deferred.current;
    expect(result).toBe('awaited');
  });
});
