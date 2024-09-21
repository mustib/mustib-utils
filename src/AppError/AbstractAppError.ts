import { Func } from 'types.js';

import type { AbstractAppErrorOptions } from './types.js';

export abstract class AbstractAppError extends Error {
  static indentation = 4;

  abstract length: number;

  abstract push(...args: any[]): this;

  abstract toString(): string;

  private _indentation?: number;

  stackTraceConstructor?: Func;

  prepend: string;

  append: string;

  get indentation() {
    return this._indentation ?? AbstractAppError.indentation;
  }

  set indentation(indentation: number) {
    this._indentation = indentation;
  }

  get message() {
    return this.toString();
  }

  constructor(options?: AbstractAppErrorOptions) {
    super();
    const {
      indentation,
      stackTraceConstructor,
      append = '',
      prepend = '',
    } = options || {};
    if (typeof indentation === 'number') this.indentation = indentation;
    this.stackTraceConstructor = stackTraceConstructor;
    this.append = append;
    this.prepend = prepend;
  }

  throw(): never {
    Error.captureStackTrace(this, this.stackTraceConstructor || this.throw);
    throw this;
  }

  end() {
    if (this.length > 0) this.throw();
    return undefined as never;
  }
}
