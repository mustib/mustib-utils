import { AppError } from '../AppError';

const EVENT_TYPES_PRIORITIES = ['prepend', 'normal'] as const;

type EventErrorTypes = 'Duplicated' | 'Invalid';

type AddListenerOptions = {
  once?: boolean;
};

export type EventData<
  ListenerValue = any,
  DispatchValue = ListenerValue,
  Dispatchable = true,
  Destructible = false,
> = {
  listenerValue: ListenerValue;
  dispatchValue: DispatchValue;
  dispatchable: Dispatchable;
  destructible: Destructible;
};

type DefaultEventData = Partial<EventData<any, any, boolean, boolean>>;

export type EventDispatchParams<
  Name extends string | number | symbol,
  Event extends DefaultEventData,
> = Event['dispatchable'] extends false
  ? [Name, Event['dispatchValue'], { lockSymbol: symbol }]
  : [Name, Event['dispatchValue']];

/**
 * Determines how the event listeners are executed.
 * 'sync' - listeners are executed synchronously.
 * 'async' - listeners are executed asynchronously, but not sequentially.
 * 'async-sequential' - listeners are executed asynchronously and sequentially where the next listener will not be executed until the previous one has finished.
 * @default 'sync'
 */
type EventRunningBehavior = 'sync' | 'async' | 'async-sequential';

type AfterAllCallback<Event extends DefaultEventData> = (data: {
  dispatchValue: Event['dispatchValue'];
  listenerValue: Event['listenerValue'];
  listenerCount: number;
}) => void | Promise<void>;

type BeforeAllCallback<Event extends DefaultEventData> = (data: {
  dispatchValue: Event['dispatchValue'];
  listenerValue: Event['listenerValue'];
  listenerCount: number;
}) => void | Promise<void>;

type ConstructorEventData<Event extends DefaultEventData> = {
  runningBehavior?: EventRunningBehavior;

  afterAll?: AfterAllCallback<Event>;
  beforeAll?: BeforeAllCallback<Event>;
} & {
  [key in 'listener' | 'prepend']?:
  | ((value: Event['listenerValue']) => void)
  | {
    listener: (value: Event['listenerValue']) => void;
    options: AddListenerOptions;
  };
} & (Event['dispatchable'] extends false
  ? { dispatchable: false }
  : { dispatchable?: true }) &
  (Event['destructible'] extends true
    ? { destructible: true }
    : { destructible?: false }) &
  (Event['dispatchValue'] extends Event['listenerValue']
    ? {
      prepare?: (
        value: Required<Event>['dispatchValue'],
      ) => Required<Event>['listenerValue'];
    }
    : {
      prepare?: (
        value: Required<Event>['dispatchValue'],
      ) => Required<Event>['listenerValue'];
    }) &
  (Event['destructible'] extends true
    ? { lockSymbol: symbol }
    : Event['dispatchable'] extends false
    ? { lockSymbol: symbol }
    : { lockSymbol?: undefined });

export type EventDebugListener = <
  Type extends
  | 'destructed'
  | 'added listener'
  | 'prepended listener'
  | 'removed listener'
  | 'dispatched',
>(
  eventName: string,
  operationType: Type,
  details: Type extends 'added listener' | 'prepended listener'
    ? Required<AddListenerOptions>
    : Type extends 'removed listener'
    ? { priority: (typeof EVENT_TYPES_PRIORITIES)[number] }
    : Type extends 'dispatched'
    ? unknown
    : undefined,
) => void;


type ListenerHandler<Value = any> = (
  value: Value,
) => void | Promise<void>;

type ListenerData = {
  isOnce: boolean;
  listener: ListenerHandler;
  priority: (typeof EVENT_TYPES_PRIORITIES)[number];
}

export class CustomEventEmitter<
  EventMaps extends Record<string, DefaultEventData>,
> {
  protected debugListeners?: Set<EventDebugListener>;

  protected events = {} as {
    [name: string | number | symbol]: {
      lockSymbol?: symbol;
      destructible: boolean;
      dispatchable: boolean;
      destructed: boolean;
      runningBehavior: EventRunningBehavior;
      afterAllCallback: AfterAllCallback<any> | undefined;
      beforeAllCallback: BeforeAllCallback<any> | undefined

      prepare?<Event extends DefaultEventData>(
        value: Event['dispatchValue'],
      ): Event['listenerValue'];

      listeners: {
        [type in (typeof EVENT_TYPES_PRIORITIES)[number]]: Set<
          ListenerHandler
        >;
      } & {
        all: Map<
          ListenerHandler,
          ListenerData
        >;
      };
    };
  };

  constructor(events: {
    [name in keyof EventMaps]-?: ConstructorEventData<EventMaps[name]>;
  }) {
    const appError = new AppError();

    Object.keys(events).forEach((name) => {
      const {
        destructible = false,
        dispatchable = true,
        listener,
        lockSymbol,
        afterAll,
        beforeAll,
        prepare,
        prepend,
        runningBehavior = 'sync',
      } = events[name];

      let hasError = false;

      if (lockSymbol !== undefined && typeof lockSymbol !== 'symbol') {
        appError.push('Invalid', `lockSymbol must be of type (symbol)`);
        hasError = true;
      }

      if (!dispatchable && !lockSymbol) {
        appError.push(
          'Invalid',
          `non dispatchable event (${name as string}) must have lockSymbol`,
        );
        hasError = true;
      }

      if (destructible && !lockSymbol) {
        appError.push(
          'Invalid',
          `destructible event (${name as string}) must have lockSymbol`,
        );
        hasError = true;
      }

      if (!hasError) {
        this.events[name] = {
          prepare,
          listeners: { all: new Map(), normal: new Set(), prepend: new Set() },
          destructed: false,
          destructible,
          dispatchable,
          lockSymbol,
          afterAllCallback: afterAll,
          beforeAllCallback: beforeAll,
          runningBehavior,
        };
        if (listener)
          if (typeof listener === 'function') this.addListener(name, listener);
          else this.addListener(name, listener.listener, listener.options);
        if (prepend)
          if (typeof prepend === 'function')
            this.prependListener(name, prepend);
          else this.prependListener(name, prepend.listener, prepend.options);
      }
    });

    appError.end();
  }

  protected hasEvent(name: keyof EventMaps) {
    return Reflect.has(this.events, name);
  }

  destruct<Name extends keyof EventMaps>(
    name: Name,
    lockSymbol: EventMaps[Name]['destructible'] extends true ? symbol : never,
  ) {
    if (!this.hasEvent(name))
      this.throwInvalidEventNameAction(name, 'destruct');

    const event = this.events[name];

    if (event.destructed) return this;

    if (!event.destructible)
      this.throwInvalidEventNameAction(
        name,
        'destruct',
        ', because it is not destructible',
      );

    if (event.lockSymbol !== lockSymbol)
      this.throwInvalidEventNameAction(
        name,
        'destruct',
        ', because wrong lockSymbol provided',
      );

    setTimeout(() => {
      event.listeners.all.clear();
      event.listeners.normal.clear();
      event.listeners.prepend.clear();
      event.destructed = true;
      event.prepare = undefined;
      if (this.debugListeners)
        this.debugListeners.forEach((listener) =>
          listener(name.toString(), 'destructed', undefined),
        );
    });

    return this;
  }

  debug(listener: EventDebugListener) {
    if (!this.debugListeners) this.debugListeners = new Set([listener]);
    else this.debugListeners.add(listener);
  }

  protected insertListenerPriority({
    name,
    listener,
    listenerOptions,
    priority,
  }: {
    name: keyof EventMaps;
    listener: ListenerHandler;
    listenerOptions?: AddListenerOptions;
    priority: (typeof EVENT_TYPES_PRIORITIES)[number];
  }) {
    if (!this.hasEvent(name))
      this.throwInvalidEventNameAction(
        name,
        priority === 'normal' ? 'add' : 'prepend',
      );

    const event = this.events[name];

    if (event.destructed) return;

    const listenerData: ListenerData = {
      isOnce: !!listenerOptions?.once,
      listener,
      priority,
    };

    event.listeners[priority].add(listener);
    event.listeners.all.set(listener, listenerData);

    if (this.debugListeners) {
      this.debugListeners.forEach((debugListener) =>
        debugListener(
          name.toString(),
          `${priority === 'prepend' ? 'prepended' : 'added'} listener`,
          {
            once: listenerData.isOnce,
          },
        ),
      );
    }
  }

  prependListener<Name extends keyof EventMaps>(
    name: Name,
    listener: ListenerHandler<EventMaps[Name]['listenerValue']>,
    listenerOptions?: AddListenerOptions,
  ) {
    this.insertListenerPriority({
      name,
      listener,
      listenerOptions,
      priority: 'prepend',
    });
    return this;
  }

  addListener<Name extends keyof EventMaps>(
    name: Name,
    listener: ListenerHandler<EventMaps[Name]['listenerValue']>,
    listenerOptions?: AddListenerOptions,
  ) {
    this.insertListenerPriority({
      name,
      listener,
      listenerOptions,
      priority: 'normal',
    });

    return this;
  }

  private *getListenersGenerator(name: string | number | symbol) {
    const event = this.events[name];
    for (const priority of EVENT_TYPES_PRIORITIES) {
      for (const listener of event.listeners[priority]) {
        const listenerData = event.listeners.all.get(listener);
        if (!listenerData) continue;
        yield listenerData;
      }
    }
  }

  dispatch<Name extends keyof EventMaps>(
    ...args: EventDispatchParams<Name, EventMaps[Name]>
  ) {
    const [name, value, options] = args;

    if (!this.hasEvent(name))
      this.throwInvalidEventNameAction(name, 'dispatch');

    const event = this.events[name];

    if (event.destructed) return this;

    if (!event.dispatchable && options?.lockSymbol !== event.lockSymbol)
      this.throwInvalidEventNameAction(
        name,
        'dispatch',
        ', wrong lockSymbol provided',
      );

    const listenerValue = event.prepare ? event.prepare(value) : value;

    if (this.debugListeners)
      this.debugListeners.forEach((debugListener) =>
        debugListener(name.toString(), 'dispatched', listenerValue),
      );

    const listenersData = this.getListenersGenerator(name);

    const callListener = (listenerData: ListenerData) => {
      listenerData.listener(listenerValue);
      if (listenerData.isOnce) {
        this.removeListener(name, listenerData.listener);
      }
    };

    const callListenerAsync = async (listenerData: ListenerData) => {
      await listenerData.listener(listenerValue);
      if (listenerData.isOnce) {
        this.removeListener(name, listenerData.listener);
      }
    };

    switch (event.runningBehavior) {
      case 'sync': {
        let i = 0;
        event.beforeAllCallback?.({
          dispatchValue: value,
          listenerValue,
          listenerCount: event.listeners.all.size
        })
        for (const listenerData of listenersData) {
          callListener(listenerData);
          i++;
        }
        event.afterAllCallback?.({
          dispatchValue: value,
          listenerCount: i,
          listenerValue,
        });
        break;
      }

      case 'async': {
        queueMicrotask(() => {
          let i = 0
          event.beforeAllCallback?.({
            dispatchValue: value,
            listenerValue,
            listenerCount: event.listeners.all.size
          })
          for (const listenerData of listenersData) {
            callListener(listenerData);
            i++;
          }
          event.afterAllCallback?.({
            dispatchValue: value,
            listenerCount: i,
            listenerValue,
          });
        });
        break;
      }

      case 'async-sequential': {
        queueMicrotask(async () => {
          let i = 0;
          await event.beforeAllCallback?.({
            dispatchValue: value,
            listenerValue,
            listenerCount: event.listeners.all.size
          })
          for (const listenerData of listenersData) {
            await callListenerAsync(listenerData);
            i++;
          }
          event.afterAllCallback?.({
            dispatchValue: value,
            listenerCount: i,
            listenerValue,
          });
        });
        break;
      }

      default: {
        event.runningBehavior satisfies never;
        break;
      }
    }

    return this;
  }

  removeListener<Name extends keyof EventMaps>(
    name: Name,
    listener: (value: EventMaps[Name]['listenerValue']) => void,
  ) {
    if (!this.hasEvent(name))
      this.throwInvalidEventNameAction(
        name,
        'remove',
        ', because it does not exist',
      );

    const allListeners = this.events[name].listeners.all;

    if (this.debugListeners) {
      const listenerData = allListeners.get(listener);
      const status = allListeners.delete(listener);
      if (listenerData && status)
        this.debugListeners.forEach((debugListener) =>
          debugListener(name.toString(), 'removed listener', {
            priority: listenerData.priority,
          }),
        );
    } else allListeners.delete(listener);

    return this;
  }

  protected throwInvalidEventNameAction(
    name: keyof EventMaps,
    action: 'add' | 'prepend' | 'remove' | 'dispatch' | 'destruct',
    reason = '',
  ) {
    AppError.throw<EventErrorTypes>(
      'Invalid',
      `(${name as string}) is not a valid listener name to ${action}${reason}`,
      {
        stackTraceConstructor: this.throwInvalidEventNameAction,
      },
    );
  }
}
