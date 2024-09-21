import { capitalize } from './capitalize';

import type { Func } from './types';

export type ErrorOptions = {
  indentation?: number;
  stackTraceConstructor?: Func;
};

export class AppError<ErrorTypes extends Capitalize<string>> extends Error {
  static throw<ErrorTypes extends Capitalize<string>>(
    type: ErrorTypes,
    error: string | string[],
    options?: ErrorOptions,
  ) {
    return new AppError<ErrorTypes>(options).push(type, error).throw();
  }

  static aggregate<ErrorTypes extends Capitalize<string>>(
    aggregateFunc: (
      appError: Omit<AppError<ErrorTypes>, 'end'>,
    ) => void | Promise<void>,
    options?: ErrorOptions,
  ) {
    const appError = new AppError(options);

    return Promise.resolve(aggregateFunc(appError))
      .then(appError.end.bind(appError))
      .catch((error: unknown) => {
        if (error instanceof Error) {
          Error.captureStackTrace(error, AppError.aggregate);
        }
        throw error;
      });
  }

  protected length = 0;

  protected errors = {} as { [key in ErrorTypes]?: string[] };

  get message() {
    return this.toString();
  }

  constructor(protected options?: ErrorOptions) {
    super();
  }

  catch(catchFunc: () => void) {
    return Promise.resolve(catchFunc()).catch((error: unknown) => {
      if (error instanceof AppError) {
        for (const [type, errors] of Object.entries(error.errors)) {
          if (errors) this.push(type as ErrorTypes, errors);
        }
      } else {
        if (error instanceof Error) {
          Error.captureStackTrace(error, this.catch);
        }
        throw error;
      }
    });
  }

  protected toString() {
    const formattedErrors = (Object.keys(this.errors) as ErrorTypes[]).map(
      this.formatErrorType.bind(this),
    );

    return formattedErrors.join('\n');
  }

  protected formatErrorType(errorType: ErrorTypes) {
    const rawErrors = this.errors[errorType];
    if (!rawErrors) return '';
    const { indentation = 4 } = this.options || {};
    const hasManyErrors = rawErrors.length > 1;
    const indentationPrefix = hasManyErrors ? `${' '.repeat(indentation)}` : '';
    const formattedErrorType = rawErrors.map(
      (err, i) =>
        `${indentationPrefix}${hasManyErrors ? `${i + 1}- ` : ''}${err}.`,
    );

    return `${errorType} ${hasManyErrors ? 'Errors:\n' : 'Error: '}${formattedErrorType.join('\n')}`;
  }

  push(type: ErrorTypes, error: string | string[]) {
    const errorType = capitalize(type, { onlyFirstWord: true }) as ErrorTypes;
    const errors = this.errors[errorType];
    if (Array.isArray(errors)) {
      errors.push(...(Array.isArray(error) ? error : [error]));
    } else {
      this.errors[errorType] = Array.isArray(error) ? [...error] : [error];
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
