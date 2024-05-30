import type { Func } from "types.js";

export abstract class AbstractAppError extends Error {
  abstract length: number;

  abstract push(...args: any[]): this;

  get message() {
    return this.toString();
  }

  abstract toString(indentation?: number): string;

  throw(stackTraceConstructor?: Func) {
    Error.captureStackTrace(this, stackTraceConstructor ?? this.throw);

    throw this;
  }

  end(stackTraceConstructor?: Func) {
    if (this.length > 0) this.throw(stackTraceConstructor ?? this.end);
  }
}
