import { getTypeof } from '../getTypeof.js';

import { AbstractAppError } from './AbstractAppError.js';

import { AppError } from './AppError.js';

import type { AppErrorRootOptions } from './types.js';

export class AppErrorRoot<AppErrorTypes extends string>
  extends AbstractAppError
  implements Pick<AppErrorRootOptions, 'appErrorOptions'>
{
  static aggregate<AppErrorTypes extends string>(
    aggregateFunc: (
      tryCatch: AppErrorRoot<AppErrorTypes>['tryCatch'],
    ) => void | Promise<void>,
    options?: AppErrorRootOptions,
  ) {
    const appErrorRoot = new AppErrorRoot(options);

    const catchError = (error: unknown) => {
      if (getTypeof(error) === 'object') {
        Error.captureStackTrace(error as object, AppErrorRoot.aggregate);
      }
      throw error;
    };

    try {
      if (aggregateFunc.constructor.name === 'AsyncFunction')
        return (
          aggregateFunc(
            appErrorRoot.tryCatch.bind(appErrorRoot),
          ) as Promise<never>
        )
          .catch(catchError)
          .finally(() => {
            appErrorRoot.end();
          });

      aggregateFunc(appErrorRoot.tryCatch.bind(appErrorRoot));
    } catch (error) {
      catchError(error);
    }

    return appErrorRoot.end();
  }

  length = 0;

  errors: Record<string, AppError<AppErrorTypes>> = {};

  appErrorOptions;

  constructor({ appErrorOptions, ...options } = {} as AppErrorRootOptions) {
    super(options);
    this.appErrorOptions = appErrorOptions;
  }

  push(
    type: AppErrorTypes,
    error: string | string[],
    { appErrorOptions } = {
      appErrorOptions: this.appErrorOptions,
    } as AppErrorRootOptions,
  ) {
    if (type in this.errors) {
      this.errors[type].push(error, appErrorOptions);
      return this;
    }
    const appError = new AppError(type);
    appError.push(error, appErrorOptions);
    this.errors[type] = appError;
    this.length++;
    return this;
  }

  protected pushRoot(
    appErrorRoot: AppErrorRoot<AppErrorTypes>,
    options?: AppErrorRootOptions,
  ) {
    const appErrorRootEntries = Object.entries(appErrorRoot.errors);

    appErrorRootEntries.forEach(([errType, error]) => {
      this.push(errType as AppErrorTypes, error.errors, options);
    });
  }

  toString() {
    const errorsString = Object.values(this.errors)
      .map((error) => {
        error.indentation = this.indentation;
        return error.toString();
      })
      .join('\n');

    return [this.prepend, errorsString, this.append].join('\n');
  }

  tryCatch(
    tryCatchFunc: () => void | Promise<void>,
    options?: AppErrorRootOptions,
  ) {
    const catchError = (error: unknown) => {
      if (error instanceof AppError)
        this.push(error.type, error.errors, options);
      else if (error instanceof AppErrorRoot) this.pushRoot(error, options);
      else {
        if (getTypeof(error) === 'object') {
          Error.captureStackTrace(error as object, this.tryCatch);
        }
        throw error;
      }
    };

    try {
      if (tryCatchFunc.constructor.name === 'AsyncFunction')
        return (tryCatchFunc() as Promise<any>).catch(catchError);

      tryCatchFunc();
    } catch (error) {
      catchError(error);
    }

    return undefined;
  }
}
