import { describe, expect, it, vi } from "vitest";
import { CustomEventEmitter } from ".";

describe('CustomEventEmitter.afterAll', () => {
  it('should call afterAll callback after all listeners are executed (sync)', () => {
    const afterAll = vi.fn();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const prepare = vi.fn(() => 'prepare-value');
    const emitter = new CustomEventEmitter({
      eventName: {
        runningBehavior: 'sync',
        afterAll,
        prepare,
      },
    });
    emitter.addListener('eventName', listener1);
    emitter.addListener('eventName', listener2);
    emitter.dispatch('eventName', 'test-value');
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(afterAll).toHaveBeenCalledTimes(1);
    expect(afterAll).toHaveBeenCalledWith({ dispatchValue: 'test-value', listenerValue: 'prepare-value', listenerCount: 2 });
    expect(prepare).toHaveBeenCalledWith('test-value');
  });

  it('should call afterAll callback after all listeners are executed (async)', async () => {
    const afterAll = vi.fn();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const prepare = vi.fn(() => 'prepare-value');
    const emitter = new CustomEventEmitter({
      eventName: {
        runningBehavior: 'async',
        afterAll,
        prepare,
      },
    });
    emitter.addListener('eventName', listener1);
    emitter.addListener('eventName', listener2);
    emitter.dispatch('eventName', 'async-value');
    await new Promise((r) => { setTimeout(r, 0) });
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(afterAll).toHaveBeenCalledTimes(1);
    expect(afterAll).toHaveBeenCalledWith({ dispatchValue: 'async-value', listenerValue: 'prepare-value', listenerCount: 2 });
    expect(prepare).toHaveBeenCalledWith('async-value');
  });

  it('should call afterAll callback after all listeners are executed (async-sequential)', async () => {
    const afterAll = vi.fn();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const prepare = vi.fn(() => 'prepare-value');
    const emitter = new CustomEventEmitter({
      eventName: {
        runningBehavior: 'async-sequential',
        afterAll,
        prepare,
      },
    });
    emitter.addListener('eventName', listener1);
    emitter.addListener('eventName', listener2);
    await new Promise((r) => {
      emitter.dispatch('eventName', 'seq-value');
      setTimeout(r, 0);
    });
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(afterAll).toHaveBeenCalledTimes(1);
    expect(afterAll).toHaveBeenCalledWith({ dispatchValue: 'seq-value', listenerValue: 'prepare-value', listenerCount: 2 });
    expect(prepare).toHaveBeenCalledWith('seq-value');
  });

  it('should call afterAll even if no listeners are present (sync)', () => {
    const afterAll = vi.fn();
    const prepare = vi.fn(() => 'prepare-value');
    const emitter = new CustomEventEmitter({
      eventName: {
        runningBehavior: 'sync',
        afterAll,
        prepare,
      },
    });
    emitter.dispatch('eventName', 'no-listener-sync');
    expect(afterAll).toHaveBeenCalledTimes(1);
    expect(afterAll).toHaveBeenCalledWith({ dispatchValue: 'no-listener-sync', listenerValue: 'prepare-value', listenerCount: 0 });
    expect(prepare).toHaveBeenCalledWith('no-listener-sync');
  });

  it('should call afterAll even if no listeners are present (async)', async () => {
    const afterAll = vi.fn();
    const prepare = vi.fn(() => 'prepare-value');
    const emitter = new CustomEventEmitter({
      eventName: {
        runningBehavior: 'async',
        afterAll,
        prepare,
      },
    });
    emitter.dispatch('eventName', 'no-listener-async');
    await new Promise((r) => { setTimeout(r, 0) });
    expect(afterAll).toHaveBeenCalledTimes(1);
    expect(afterAll).toHaveBeenCalledWith({ dispatchValue: 'no-listener-async', listenerValue: 'prepare-value', listenerCount: 0 });
    expect(prepare).toHaveBeenCalledWith('no-listener-async');
  });

  it('should call afterAll even if no listeners are present (async-sequential)', async () => {
    const afterAll = vi.fn();
    const prepare = vi.fn(() => 'prepare-value');
    const emitter = new CustomEventEmitter({
      eventName: {
        runningBehavior: 'async-sequential',
        afterAll,
        prepare,
      },
    });
    emitter.dispatch('eventName', 'no-listener-sequential');
    await new Promise((r) => { setTimeout(r, 0) });
    expect(afterAll).toHaveBeenCalledTimes(1);
    expect(afterAll).toHaveBeenCalledWith({ dispatchValue: 'no-listener-sequential', listenerValue: 'prepare-value', listenerCount: 0 });
    expect(prepare).toHaveBeenCalledWith('no-listener-sequential');
  });

  it('should run listeners in sync order', async () => {
    const calls: number[] = []

    new CustomEventEmitter<{ normal: any }>({
      normal: { runningBehavior: 'sync' }
    }).addListener('normal', () => {
      calls.push(1)
    }).addListener('normal', async () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          calls.push(2)
          resolve()
        }, 0)
      })
    }).addListener('normal', () => {
      calls.push(3)
    }).dispatch('normal', undefined)
    calls.push(4)

    await new Promise((r) => {
      setTimeout(r, 0)
    })

    expect(calls).toStrictEqual([1, 3, 4, 2])
  });

  it('should run listeners in async order if specified', async () => {
    const calls: number[] = []

    new CustomEventEmitter<{ async: any }>({
      async: {
        runningBehavior: 'async'
      }
    }).addListener('async', () => {
      calls.push(1)
    }).dispatch('async', undefined)

    calls.push(2)

    await new Promise((r) => {
      setTimeout(r, 0)
    })

    expect(calls).toStrictEqual([2, 1])
  });

  it('should run listeners in async-sequential order if specified', async () => {
    const calls: number[] = []
    const abort = new AbortController()

    const event = new CustomEventEmitter<{ sequential: any }>({
      sequential: {
        runningBehavior: 'async-sequential'
      }
    }).addListener('sequential', () => {
      calls.push(1)
    }).addListener('sequential', async () => {
      await new Promise(r => {
        setTimeout(() => {
          calls.push(2)
          r(null)
        })
      })
    }).addListener('sequential', () => {
      calls.push(3)
      abort.abort('finished')
    })

    await new Promise((r) => {
      abort.signal.addEventListener('abort', r)
      event.dispatch('sequential', undefined)
    })

    expect(calls).toStrictEqual([1, 2, 3])
  })
})