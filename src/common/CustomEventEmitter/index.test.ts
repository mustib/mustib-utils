import { describe, expect, it, vi } from 'vitest';

import { AppError } from '../AppError';

import { CustomEventEmitter } from './index';

const lockSymbol = Symbol('event unlock');

describe('CustomEventEmitter', () => {
  it('should allow adding a listener to an event', () => {
    const emitter = new CustomEventEmitter({ eventName: {} });
    const listener = vi.fn();
    emitter.addListener('eventName', listener);
    expect(
      // @ts-expect-error accessing private property
      emitter.events.eventName?.listeners.normal.has(listener),
    ).toBe(true);
  });

  it('should allow prepending a listener to an event', () => {
    const emitter = new CustomEventEmitter({ eventName: {} });
    const prependListener = vi.fn();
    emitter.prependListener('eventName', prependListener);
    expect(
      // @ts-expect-error accessing private property
      emitter.events.eventName?.listeners.prepend.has(prependListener),
    ).toBe(true);
  });

  it('should add and prepend listeners from constructor', () => {
    const listener = vi.fn();
    const prependListener = vi.fn();
    const emitter = new CustomEventEmitter({
      eventName: { listener, prepend: prependListener },
    });
    expect(
      // @ts-expect-error accessing private property
      emitter.events.eventName?.listeners.normal.has(listener),
    ).toBe(true);
    expect(
      // @ts-expect-error accessing private property
      emitter.events.eventName?.listeners.prepend.has(prependListener),
    ).toBe(true);
  });

  it('should add and prepend listeners from constructor with options', () => {
    const listener = vi.fn();
    const prependListener = vi.fn();
    const emitter = new CustomEventEmitter({
      eventName: {
        listener: { listener, options: { once: true } },
        prepend: { listener: prependListener, options: { once: true } },
      },
    });
    expect(
      // @ts-expect-error accessing private property
      emitter.events.eventName?.listeners.normal.has(listener),
      'should add a listener with options',
    ).toBe(true);
    expect(
      // @ts-expect-error accessing private property
      emitter.events.eventName?.listeners.prepend.has(prependListener),
      'should prepend a listener with options',
    ).toBe(true);
  });

  it('should allow removing a listener from an event', () => {
    const emitter = new CustomEventEmitter({ eventName: {} });
    const listener = vi.fn();
    emitter.addListener('eventName', listener);
    emitter.removeListener('eventName', listener);
    expect(
      // @ts-expect-error accessing private property
      emitter.events.eventName?.listeners.all.has(listener),
    ).toBe(false);
  });

  it('should allow adding a one-time listener to an event', async () => {
    const emitter = new CustomEventEmitter({ eventName: {} });
    const listener = vi.fn();
    emitter.addListener('eventName', listener, { once: true });
    const hasListener = () =>
      // @ts-expect-error test only
      emitter.events.eventName?.listeners.all.has(listener);

    expect(
      hasListener(),
      'should have the same listener reference and not be a copy',
    ).toBe(true);
    emitter.dispatch('eventName', undefined);
    expect(hasListener(), 'should remove listener after dispatch').toBe(false);
  });

  it('should prepend listeners', () => {
    const emitter = new CustomEventEmitter({ eventName: {} });
    let value: 'prepend' | 'normal' | '' = '';
    const normalListener = () => {
      expect(value, 'should be executed second').toBe('prepend');
      value = 'normal';
    };
    const prependListener = () => {
      expect(value, 'should be executed first').toBe('');
      value = 'prepend';
    };
    emitter.addListener('eventName', normalListener);
    emitter.prependListener('eventName', prependListener);
    emitter.dispatch('eventName', undefined);
    expect(value).toBe('normal');
  });

  it('should dispatch an event', () => {
    const emitter = new CustomEventEmitter({ eventName: {} });
    const listener = vi.fn();
    emitter.addListener('eventName', listener);
    emitter.dispatch('eventName', 'value');
    expect(listener).toHaveBeenCalledWith('value');
  });

  it('should allow destructing the event emitter', async () => {
    const emitter = new CustomEventEmitter<{
      eventName: { destructible: true };
    }>({
      eventName: { destructible: true, lockSymbol },
    });
    // @ts-expect-error accessing private property
    expect(emitter.events.eventName.destructible).toBe(true);
    emitter.destruct('eventName', lockSymbol);

    expect(
      // @ts-expect-error accessing private property
      emitter.events.eventName.destructed,
      'should not destruct immediately',
    ).toBe(false);

    const hasDestructed = await new Promise((r) => {
      setTimeout(() => {
        // @ts-expect-error accessing private property
        r(emitter.events.eventName.destructed);
      });
    });

    expect(hasDestructed, 'should destruct after timeout').toBe(true);

    expect(
      // @ts-expect-error accessing private property
      emitter.events.eventName.listeners,
      'listeners should be empty',
    ).toEqual({ all: new Map(), prepend: new Set(), normal: new Set() });
  });

  it('should throw Invalid error if destructing an event that does not exist', () => {
    const emitter = new CustomEventEmitter({});
    expect(() =>
      // @ts-expect-error lockSymbol should not be used because event does not exist
      emitter.destruct('not-existent-event', lockSymbol),
    ).to.throw(AppError, /Invalid[\s\S]*destruct/);
  });

  it('should throw Invalid error if destructing a non destructible event', () => {
    const emitter = new CustomEventEmitter({ eventName: {} });

    expect(() =>
      // @ts-expect-error lockSymbol should not be used because event is not destructible
      emitter.destruct('eventName', lockSymbol),
    ).to.throw(AppError, /Invalid[\s\S]*destruct[\s\S]*not destructible/);
  });

  it('should throw Invalid error if wrong lockSymbol is used for destructing', () => {
    const emitter = new CustomEventEmitter<{
      eventName: { destructible: true };
    }>({
      eventName: { destructible: true, lockSymbol },
    });

    expect(() =>
      emitter.destruct('eventName', Symbol('wrong lockSymbol')),
    ).to.throw(AppError, /Invalid[\s\S]*destruct[\s\S]*wrong lockSymbol/);
  });

  it('should throw Invalid error if lockSymbol is not of type symbol', () => {
    expect(
      () =>
        new CustomEventEmitter({
          // @ts-expect-error lockSymbol should be of type symbol
          eventName: { lockSymbol: 'wrong lockSymbol' },
        }),
    ).to.throw(AppError, /Invalid[\s\S]*lockSymbol/);
  });

  it('should throw Invalid error if event is not dispatchable and there is no lockSymbol', () => {
    expect(
      () =>
        new CustomEventEmitter<{ eventName: { dispatchable: false } }>({
          // @ts-expect-error lockSymbol should be provided because event is not dispatchable
          eventName: { dispatchable: false },
        }),
    ).to.throw(
      AppError,
      /Invalid[\s\S]*dispatchable[\s\S]*must have lockSymbol/,
    );
  });

  it('should throw Invalid error if event is destructible and there is no lockSymbol', () => {
    expect(
      () =>
        new CustomEventEmitter<{ eventName: { destructible: true } }>({
          // @ts-expect-error lockSymbol should be provided because event is destructible
          eventName: { destructible: true },
        }),
    ).to.throw(
      AppError,
      /Invalid[\s\S]*destructible[\s\S]*must have lockSymbol/,
    );
  });

  it('should return whether is has event or not', () => {
    const emitter = new CustomEventEmitter({ eventName: {} });
    // @ts-expect-error accessing private method
    expect(emitter.hasEvent('eventName')).toBe(true);
    // @ts-expect-error accessing private method
    expect(emitter.hasEvent('not-existent-event')).toBe(false);
  });

  it('should throw Invalid error when dispatching an event that does not exist', () => {
    const emitter = new CustomEventEmitter({});
    expect(() => emitter.dispatch('not-existent-event', undefined)).to.throw(
      AppError,
      /Invalid[\s\S]*dispatch/,
    );
  });

  it('should throw Invalid error when dispatching a non dispatchable event with a wrong lockSymbol', () => {
    const emitter = new CustomEventEmitter<{
      eventName: { dispatchable: false };
    }>({ eventName: { dispatchable: false, lockSymbol } });

    expect(() =>
      emitter.dispatch('eventName', null, { lockSymbol: Symbol('wrong') }),
    ).to.throw(AppError, /Invalid[\s\S]*dispatch[\s\S]*wrong lockSymbol/);
  });

  it('should throw Invalid error when removing a listener from an event that does not exist', () => {
    const emitter = new CustomEventEmitter({});
    expect(() =>
      emitter.removeListener('not-existent-event', vi.fn()),
    ).to.throw(AppError, /Invalid[\s\S]*remove/);
  });

  it('should dispatch an event', () => {
    const emitter = new CustomEventEmitter({ eventName: {} });
    const listener = vi.fn();
    emitter.addListener('eventName', listener);
    emitter.dispatch('eventName', 'value');
    expect(listener).toHaveBeenCalledWith('value');
  });

  it('should prepare an event', () => {
    const emitter = new CustomEventEmitter({
      eventName: {
        prepare(value) {
          return `prepared ${value}`;
        },
      },
    });

    const listener = vi.fn();
    emitter.addListener('eventName', listener);
    emitter.dispatch('eventName', 'value');
    expect(listener).toHaveBeenCalledWith('prepared value');
  });

  it('should debug an event', async () => {
    const emitter = new CustomEventEmitter<{
      eventName: { destructible: true; listenerValue: { value: string } };
    }>({
      eventName: { destructible: true, lockSymbol },
    });

    const debugListener = vi.fn();
    emitter.debug(debugListener);
    const listener = vi.fn();

    expect(
      // @ts-expect-error accessing private property
      emitter.debugListeners?.has(debugListener),
      'should add debug listener',
    ).toBe(true);

    emitter.addListener('eventName', listener);

    expect(
      debugListener,
      'should call debug listener when listener is added',
    ).toBeCalledWith('eventName', 'added listener', {
      once: false,
    });

    emitter.dispatch('eventName', { value: 'value' });
    expect(
      debugListener,
      'should call debug listener when event is dispatched',
    ).toBeCalledWith('eventName', 'dispatched', { value: 'value' });

    emitter.removeListener('eventName', listener);
    expect(
      debugListener,
      'should call debug listener when listener is removed',
    ).toBeCalledWith('eventName', 'removed listener', { priority: 'normal' });

    emitter.destruct('eventName', lockSymbol);
    await new Promise((resolve) => {
      setTimeout(resolve);
    });
    expect(
      debugListener,
      'should call debug listener when event is destructed',
    ).toBeCalledWith('eventName', 'destructed', undefined);
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
});
