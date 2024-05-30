import { getTypeof } from '../getTypeof.js';

import { AbstractAppError } from './AbstractAppError.js';

import { AppError } from './AppError.js';


export class AppErrorRoot<AppErrorTypes extends string> extends AbstractAppError {
  length = 0;

  errors: Record<string, AppError<AppErrorTypes>> = {};

  static aggregate<AppErrorTypes extends string>(
    aggregateFunc: (tryCatch: AppErrorRoot<AppErrorTypes>['tryCatch']) => void | Promise<void>
  ) {
    const appErrorRoot = new AppErrorRoot();

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
            appErrorRoot.tryCatch.bind(appErrorRoot)
          ) as Promise<any>
        )
          .catch(catchError)
          .finally(() => {
            appErrorRoot.end(AppErrorRoot.aggregate);
          });

      aggregateFunc(appErrorRoot.tryCatch.bind(appErrorRoot));
    } catch (error) {
      catchError(error);
    }

    appErrorRoot.end(AppErrorRoot.aggregate);

    return undefined;
  }

  push(type: AppErrorTypes, error: string | string[]) {
    if (type in this.errors) {
      this.errors[type].push(error);
      return this;
    }
    const appError = new AppError(type);
    appError.push(error);
    this.errors[type] = appError;
    this.length++;
    return this;
  }

  protected pushRoot(appErrorRoot: AppErrorRoot<AppErrorTypes>) {
    const appErrorRootEntries = Object.entries(appErrorRoot.errors);

    appErrorRootEntries.forEach(([errType, error]) => {
      this.push(errType as AppErrorTypes, error.errors);
    });
  }

  toString(indentation = 4) {
    const errorsString = Object.values(this.errors)
      .map((error) => error.toString(indentation))
      .join('\n');

    return errorsString;
  }

  tryCatch(tryCatchFunc: () => void | Promise<void>) {
    const catchError = (error: unknown) => {
      if (error instanceof AppError) this.push(error.type, error.errors);
      else if (error instanceof AppErrorRoot) this.pushRoot(error);
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

