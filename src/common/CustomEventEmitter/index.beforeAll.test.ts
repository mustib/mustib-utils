import { describe, expect, it, vi } from "vitest";
import { CustomEventEmitter } from ".";

describe('CustomEventEmitter.beforeAll', () => {
  it('should call beforeAll callback even if no listeners are present (sync)', () => {
    const beforeAll = vi.fn();
    const prepare = vi.fn(() => 'prepare-value');
    const emitter = new CustomEventEmitter({
      eventName: {
        runningBehavior: 'sync',
        beforeAll,
        prepare,
      },
    });
    emitter.dispatch('eventName', 'test-value');
    expect(beforeAll).toHaveBeenCalledTimes(1);
    expect(beforeAll).toHaveBeenCalledWith({ dispatchValue: 'test-value', listenerValue: 'prepare-value', listenerCount: 0 });
    expect(prepare).toHaveBeenCalledBefore(beforeAll)
    expect(prepare).toHaveBeenCalledWith('test-value');
  })

  it('should call beforeAll callback even if no listeners are present (async)', () => {
    const beforeAll = vi.fn();
    const prepare = vi.fn(() => 'prepare-value');
    const emitter = new CustomEventEmitter({
      eventName: {
        runningBehavior: 'async',
        beforeAll,
        prepare,
      },
    });
    emitter.dispatch('eventName', 'test-value');
    expect(beforeAll).toHaveBeenCalledTimes(1);
    expect(beforeAll).toHaveBeenCalledWith({ dispatchValue: 'test-value', listenerValue: 'prepare-value', listenerCount: 0 });
    expect(prepare).toHaveBeenCalledBefore(beforeAll)
    expect(prepare).toHaveBeenCalledWith('test-value');
  })

  it('should call beforeAll callback even if no listeners are present (async-sequential)', () => {
    const beforeAll = vi.fn();
    const prepare = vi.fn(() => 'prepare-value');
    const emitter = new CustomEventEmitter({
      eventName: {
        runningBehavior: 'async-sequential',
        beforeAll,
        prepare,
      },
    });
    emitter.dispatch('eventName', 'test-value');
    expect(beforeAll).toHaveBeenCalledTimes(1);
    expect(beforeAll).toHaveBeenCalledWith({ dispatchValue: 'test-value', listenerValue: 'prepare-value', listenerCount: 0 });
    expect(prepare).toHaveBeenCalledBefore(beforeAll)
    expect(prepare).toHaveBeenCalledWith('test-value');
  })

  it('should call beforeAll callback before all listeners are executed (sync)', () => {
    const beforeAll = vi.fn();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const prepare = vi.fn(() => 'prepare-value');
    const emitter = new CustomEventEmitter({
      eventName: {
        runningBehavior: 'sync',
        beforeAll,
        prepare,
      },
    });
    emitter.addListener('eventName', listener1);
    emitter.addListener('eventName', listener2);
    emitter.dispatch('eventName', 'test-value');
    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(beforeAll).toHaveBeenCalledBefore(listener1)
    expect(beforeAll).toHaveBeenCalledBefore(listener2)
    expect(beforeAll).toHaveBeenCalledTimes(1);
    expect(beforeAll).toHaveBeenCalledWith({ dispatchValue: 'test-value', listenerValue: 'prepare-value', listenerCount: 2 });
    expect(prepare).toHaveBeenCalledBefore(beforeAll)
    expect(prepare).toHaveBeenCalledWith('test-value');
  })

  it('should call beforeAll callback before all listeners are executed (async)', async () => {
    const beforeAll = vi.fn();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const prepare = vi.fn(() => 'prepare-value');
    const emitter = new CustomEventEmitter({
      eventName: {
        runningBehavior: 'async',
        beforeAll,
        prepare,
      },
    });
    emitter.addListener('eventName', listener1);
    emitter.addListener('eventName', listener2);
    emitter.dispatch('eventName', 'test-value');

    await new Promise(r => { setTimeout(r, 0) })

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(beforeAll).toHaveBeenCalledBefore(listener1)
    expect(beforeAll).toHaveBeenCalledBefore(listener2)
    expect(beforeAll).toHaveBeenCalledTimes(1);
    expect(beforeAll).toHaveBeenCalledWith({ dispatchValue: 'test-value', listenerValue: 'prepare-value', listenerCount: 2 });
    expect(prepare).toHaveBeenCalledBefore(beforeAll)
    expect(prepare).toHaveBeenCalledWith('test-value');
  })

  it('should call beforeAll callback before all listeners are executed (async-sequential)', async () => {
    const beforeAll = vi.fn();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const prepare = vi.fn(() => 'prepare-value');
    const emitter = new CustomEventEmitter({
      eventName: {
        runningBehavior: 'async-sequential',
        beforeAll,
        prepare,
      },
    });
    emitter.addListener('eventName', listener1);
    emitter.addListener('eventName', listener2);
    emitter.dispatch('eventName', 'test-value');

    await new Promise(r => { setTimeout(r, 0) })

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);
    expect(beforeAll).toHaveBeenCalledBefore(listener1)
    expect(beforeAll).toHaveBeenCalledBefore(listener2)
    expect(beforeAll).toHaveBeenCalledTimes(1);
    expect(beforeAll).toHaveBeenCalledWith({ dispatchValue: 'test-value', listenerValue: 'prepare-value', listenerCount: 2 });
    expect(prepare).toHaveBeenCalledBefore(beforeAll)
    expect(prepare).toHaveBeenCalledWith('test-value');
  })
})