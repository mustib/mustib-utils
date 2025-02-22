import { capitalize } from '../capitalize';

import type { Func } from '../types';

export type ErrorScope = (string | symbol)[] | undefined;

export type ErrorOptions = {
  // used to indent the error message for better readability
  indentation?: number;
  // used as Error.captureStackTrace(error, stackTraceConstructor) when throwing an error
  stackTraceConstructor?: Func;
};

export type PushOptions = { scope?: ErrorScope };

export class AppError<ErrorTypes extends Capitalize<string>> extends Error {
  static throw<ErrorTypes extends Capitalize<string>>(
    type: ErrorTypes,
    error: string | string[],
    options?: ErrorOptions & { pushOptions?: PushOptions },
  ) {
    return new AppError<ErrorTypes>(options)
      .push(type, error, options?.pushOptions)
      .throw();
  }

  static async aggregate<ErrorTypes extends Capitalize<string>>(
    aggregateFunc: (
      appError: Omit<AppError<ErrorTypes>, 'end'>,
    ) => void | Promise<void>,
    options?: ErrorOptions,
  ) {
    const appError = new AppError(options);

    try {
      await aggregateFunc(appError);
      appError.end();
    } catch (error) {
      if (error instanceof Error) {
        Error.captureStackTrace(
          error,
          options?.stackTraceConstructor ?? AppError.aggregate,
        );
      }
      throw error;
    }
  }

  protected length = 0;

  protected errors = {} as {
    [key in ErrorTypes]?: { message: string; scope?: ErrorScope }[];
  };

  get message() {
    return this.toString();
  }

  constructor(protected options?: ErrorOptions) {
    super();
  }

  async catch(catchFunc: () => void | Promise<void>) {
    try {
      await catchFunc();
    } catch (error) {
      if (error instanceof AppError) {
        for (const [type, errors] of Object.entries(error.errors)) {
          if (errors)
            errors.forEach((err) =>
              this.push(type as ErrorTypes, err.message, { scope: err.scope }),
            );
        }
      } else {
        if (error instanceof Error) {
          Error.captureStackTrace(error, this.catch);
        }
        throw error;
      }
    }
  }

  toString(
    options?: Omit<
      Parameters<AppError<ErrorTypes>['matchesScope']>['0'],
      'errScope'
    >,
  ) {
    const formattedErrors = [] as string[];
    (Object.keys(this.errors) as ErrorTypes[]).forEach((errorType) => {
      const rawErrors = this.errors[errorType];
      if (!rawErrors) return;

      const { indentation = 4 } = this.options || {};

      const formattedErrorType = rawErrors.reduce((result, err) => {
        const hasMatchedScope = this.matchesScope({
          errScope: err.scope,
          includesScope: options?.includesScope,
          excludesScope: options?.excludesScope,
        });

        if (hasMatchedScope) {
          result.push(`${result.length + 1}- ${err.message}.`);
        }

        return result;
      }, [] as string[]);

      const hasManyErrors = formattedErrorType.length > 1;
      const indentationPrefix = `${' '.repeat(indentation)}`;

      if (formattedErrorType.length > 0)
        formattedErrors.push(
          `${errorType} Error${hasManyErrors ? 's' : ''}:\n${indentationPrefix}${formattedErrorType.join(`\n${indentationPrefix}`)}`,
        );
    });

    return formattedErrors.join('\n');
  }

  protected matchesScope({
    errScope,
    includesScope,
    excludesScope,
  }: {
    errScope: ErrorScope;
    includesScope?: ErrorScope;
    excludesScope?: ErrorScope;
  }) {
    if (includesScope === undefined && excludesScope === undefined) return true;
    if (errScope === undefined) return false;

    if (excludesScope) {
      return !excludesScope.some((scope) => errScope.includes(scope));
    }

    if (includesScope) {
      return includesScope.some((scope) => errScope.includes(scope));
    }

    return false;
  }

  push(type: ErrorTypes, error: string | string[], options?: PushOptions) {
    const errorType = capitalize(type, { onlyFirstWord: true }) as ErrorTypes;
    const errors = this.errors[errorType];

    const newError = Array.isArray(error)
      ? error.map((err) => ({ message: err, scope: options?.scope }))
      : [{ message: error, scope: options?.scope }];

    if (Array.isArray(errors)) {
      errors.push(...newError);
    } else {
      this.errors[errorType] = newError;
      this.length++;
    }

    return this;
  }

  protected throw(): never {
    Error.captureStackTrace(
      this,
      this.options?.stackTraceConstructor || this.throw,
    );
    throw this;
  }

  end() {
    if (this.length > 0) this.throw();
  }
}
