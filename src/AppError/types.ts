import { Func } from 'types.js';

export type AbstractAppErrorOptions = Partial<{
  indentation?: number;
  stackTraceConstructor?: Func;
  prepend?: string;
  append?: string;
}>;

export type AppErrorOptions = AbstractAppErrorOptions;

export type AppErrorRootOptions = AbstractAppErrorOptions & {
  appErrorOptions?: AppErrorOptions;
};
