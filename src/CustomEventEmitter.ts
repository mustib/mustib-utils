import { AppError, AppErrorRoot } from './AppError/index.js';

export type CustomEvent<
  Name extends string,
  Value extends object | undefined = undefined,
  DispatchValue extends object | undefined = Value,
> = { [name in Name]: { value: Value; dispatchValue: DispatchValue } };

export class CustomEventEmitter<
  EventMaps extends CustomEvent<string, object | undefined, object | undefined>,
> {
  private events = {} as {
    [name in keyof EventMaps]: {
      listeners: Set<(listener: EventMaps[name]['value']) => void>;
      prepare?: (
        value: EventMaps[name]['dispatchValue'],
      ) => EventMaps[name]['value'];
    };
  };

  constructor(
    events: (keyof EventMaps extends infer Name
      ? Name extends keyof EventMaps
        ? {
            name: Name;
            prepend?(value: EventMaps[Name]['value']): void;
            prependOnce?(value: EventMaps[Name]['value']): void;
            prepare?(
              value: EventMaps[Name]['dispatchValue'],
            ): EventMaps[Name]['value'];
          }
        : never
      : never)[],
  ) {
    const appErrorRoot = new AppErrorRoot({
      prepend:
        'The following errors happened while creating CustomEventEmitter:',
    });

    events.forEach(({ name, prepare, prepend, prependOnce }) => {
      const isDuplicated = this.events[name] !== undefined;
      if (isDuplicated) {
        appErrorRoot.push(
          'Duplicated',
          `(${name as string}) event already exists`,
        );
      } else {
        this.events[name] = {
          listeners: new Set(),
          prepare,
        };
        if (prependOnce) this.addListenerOnce(name, prependOnce);
        if (prepend) this.addListener(name, prepend);
      }
    });

    appErrorRoot.end();
  }

  addListener<Name extends keyof EventMaps>(
    name: Name,
    listener: (value: EventMaps[Name]['value']) => void,
  ) {
    const { listeners } = this.events[name];
    if (listeners === undefined)
      AppError.throw(
        'Unsupported',
        `provided listener name (${name as string}) is not supported`,
      );
    listeners.add(listener);
    return this;
  }

  addListenerOnce<Name extends keyof EventMaps>(
    name: Name,
    listener: (value: EventMaps[Name]['value']) => void,
  ) {
    const _listener = (...args: any[]) => {
      (listener as any)(...args);
      this.removeListener(name, _listener);
    };
    return this.addListener(name, _listener);
  }

  removeListener<Name extends keyof EventMaps>(
    name: Name,
    listener: (value: EventMaps[Name]['value']) => void,
  ) {
    const { listeners } = this.events[name];
    if (listeners === undefined)
      AppError.throw(
        'Unsupported',
        `provided listener name (${name as string}) is not supported`,
      );

    return listeners.delete(listener);
  }

  dispatch<Name extends keyof EventMaps>(
    name: Name,
    value: EventMaps[Name]['dispatchValue'],
  ) {
    const event = this.events[name];
    if (event === undefined)
      AppError.throw(
        'Unsupported',
        `dispatched event with provided name (${name as string}) is not supported`,
      );
    const _value = event.prepare ? event.prepare(value) : value;
    event.listeners.forEach((listener) => listener(_value));
    return this;
  }
}
