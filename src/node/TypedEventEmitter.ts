import type { EventEmitter } from 'node:events';

import type { Func } from '../common';

export type TypedEventEmitter<T extends Record<string, any>> = {
  emit<Name extends keyof T, Args extends T[Name]>(
    eventName: Name,
    ...args: Args extends any[] ? Args : [Args]
  ): boolean;
} & {
  [key in
    | 'on'
    | 'once'
    | 'addListener'
    | 'prependListener'
    | 'prependOnceListener']: <Name extends keyof T, Args extends T[Name]>(
    eventName: Name,
    listener: (...args: Args extends any[] ? Args : [Args]) => void,
  ) => TypedEventEmitter<T>;
} & {
  [key in 'removeListener' | 'off']: <Name extends keyof T>(
    eventName: Name,
    ...args: any[]
  ) => TypedEventEmitter<T>;
} & {
  removeAllListeners(eventName: keyof T): TypedEventEmitter<T>;
  setMaxListeners(number: number): TypedEventEmitter<T>;
  listenerCount(eventName: keyof T): number;
  listeners(eventName: keyof T): Func[];
  rawListeners(eventName: keyof T): Func[];
  eventNames: EventEmitter['eventNames'];
  getMaxListeners: EventEmitter['getMaxListeners'];
};
