import { AppError } from './AppError';

const EVENT_LISTENER_TYPES_PRIORITIES = ['prepend', 'normal'] as const;

type EventErrorTypes = 'Duplicated' | 'Invalid';

type EventListenerType = (typeof EVENT_LISTENER_TYPES_PRIORITIES)[number];

type UnknownObject = Record<string, unknown>;

export type EventListenerOptions = {
  once?: boolean;
  type?: EventListenerType;
};

export type EventRemoveListenerOptions = Pick<EventListenerOptions, 'type'>;

export type EventObject<
  ListenerValue extends UnknownObject | undefined = any,
  DispatchValue extends UnknownObject | undefined = ListenerValue,
> = {
  listenerValue?: ListenerValue;
  dispatchValue?: DispatchValue;
  dispatchable?: boolean;
  destructible?: boolean;
};

export type GetEventDispatchValue<Event extends EventObject> =
  Event['dispatchValue'] extends infer DispatchValue
    ? DispatchValue extends UnknownObject
      ? DispatchValue
      : Event['listenerValue'] extends infer ListenerValue
        ? ListenerValue extends UnknownObject
          ? ListenerValue
          : null
        : null
    : null;

export type EventDispatchParams<
  Name extends string | number | symbol,
  Event extends EventObject,
> = Event['dispatchable'] extends false
  ? [Name, GetEventDispatchValue<Event>, { lockSymbol: symbol }]
  : [Name, GetEventDispatchValue<Event>];

type EventConstructorEventObject<Event extends EventObject> = {
  listener?:
    | ((value: Event['listenerValue']) => void)
    | {
        listener: (value: Event['listenerValue']) => void;
        options: EventListenerOptions;
      };
} & (Event['dispatchable'] extends false
  ? { dispatchable: false }
  : { dispatchable?: true }) &
  (Event['destructible'] extends true
    ? { destructible: true }
    : { destructible?: false }) &
  (Event['dispatchValue'] extends UnknownObject
    ? {
        prepare: (value: Event['dispatchValue']) => Event['listenerValue'];
      }
    : {
        prepare?: (value: Event['dispatchValue']) => Event['listenerValue'];
      }) &
  (Event['destructible'] extends true
    ? Event['dispatchable'] extends false
      ? { lockSymbol: symbol }
      : { lockSymbol?: undefined }
    : { lockSymbol?: undefined });

export type EventDebugListener = <
  Type extends
    | 'destructed'
    | 'added listener'
    | 'removed listener'
    | 'dispatched',
>(
  eventName: string,
  operationType: Type,
  details: Type extends 'added listener'
    ? Required<EventListenerOptions>
    : Type extends 'dispatched'
      ? UnknownObject
      : Type extends 'removed listener'
        ? EventRemoveListenerOptions
        : undefined,
) => void;

export class CustomEventEmitter<EventMaps extends Record<string, EventObject>> {
  protected debugListeners?: Set<EventDebugListener>;

  protected events = {} as {
    [name: string | number | symbol]: {
      lockSymbol?: symbol;
      destructible: boolean;
      dispatchable: boolean;
      destructed: boolean;

      prepare?<Event extends EventObject>(
        value: Event['dispatchValue'],
      ): Event['listenerValue'];

      listeners: {
        [type in EventListenerType]?: Map<
          (value: any) => void,
          { isOnce: boolean; listener(value: any): void }
        >;
      };
    };
  };

  constructor(events: {
    [name in keyof EventMaps]-?: EventConstructorEventObject<EventMaps[name]>;
  }) {
    AppError.aggregate<EventErrorTypes>((appError) => {
      Object.keys(events).forEach((name) => {
        const {
          destructible = false,
          dispatchable = true,
          listener,
          lockSymbol,
          prepare,
        } = events[name];

        let hasError = false;
        const isDuplicated = this.events[name] !== undefined;

        if (isDuplicated) {
          appError.push(
            'Duplicated',
            `(${name as string}) event already exists`,
          );
          hasError = true;
        }

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
            listeners: {},
            destructed: false,
            destructible,
            dispatchable,
            lockSymbol,
          };
          if (listener)
            if (typeof listener === 'function')
              this.addListener(name, listener);
            else this.addListener(name, listener.listener, listener.options);
        }
      });
    });
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
      event.listeners = {};
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

  addListener<Name extends keyof EventMaps>(
    name: Name,
    listener: (value: EventMaps[Name]['listenerValue']) => void,
    listenerOptions?: EventListenerOptions,
  ) {
    if (!this.hasEvent(name)) this.throwInvalidEventNameAction(name, 'add');

    const event = this.events[name];

    if (event.destructed) return this;

    const listenerType = listenerOptions?.type ?? 'normal';
    const listenerObject = { isOnce: !!listenerOptions?.once, listener };

    if (event.listeners[listenerType]) {
      // NOTE: exclamation mark is needed to avoid @rollup/plugin-typescript build error TS2532: Object is possibly 'undefined'.
      event.listeners[listenerType]!.set(listener, listenerObject);
    } else {
      event.listeners[listenerType] = new Map([[listener, listenerObject]]);
    }

    if (this.debugListeners) {
      this.debugListeners.forEach((debugListener) =>
        debugListener(name.toString(), 'added listener', {
          type: listenerType,
          once: listenerObject.isOnce,
        }),
      );
    }

    return this;
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

    const dispatchedValue = event.prepare ? event.prepare(value) : value;

    if (this.debugListeners)
      this.debugListeners.forEach((debugListener) =>
        debugListener(name.toString(), 'dispatched', dispatchedValue),
      );

    EVENT_LISTENER_TYPES_PRIORITIES.forEach((priority) => {
      event.listeners[priority]?.forEach(({ listener, isOnce }) => {
        listener(dispatchedValue);
        if (isOnce) this.removeListener(name, listener, { type: priority });
      });
    });

    return this;
  }

  removeListener<Name extends keyof EventMaps>(
    name: Name,
    listener: (value: EventMaps[Name]['listenerValue']) => void,
    options?: EventRemoveListenerOptions,
  ) {
    if (!this.hasEvent(name))
      this.throwInvalidEventNameAction(
        name,
        'remove',
        ', because it does not exist',
      );

    const listenerType = options?.type ?? 'normal';

    const status =
      this.events[name].listeners[listenerType]?.delete(listener) || false;

    if (status && this.debugListeners) {
      this.debugListeners.forEach((debugListener) =>
        debugListener(name.toString(), 'removed listener', {
          type: listenerType,
        }),
      );
    }
    return this;
  }

  protected throwInvalidEventNameAction(
    name: keyof EventMaps,
    action: 'add' | 'remove' | 'dispatch' | 'destruct',
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
