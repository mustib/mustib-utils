import { AbstractAppError } from './AbstractAppError.js';

import type { AppErrorOptions } from './types.js';

export class AppError<AppErrorTypes extends string> extends AbstractAppError {
  static throw<AppErrorTypes extends string>(
    type: AppErrorTypes,
    error: string,
    options?: AppErrorOptions,
  ) {
    const appError = new AppError(type, options);
    appError.push(error);

    return appError.throw();
  }

  errors: string[] = [];

  get length() {
    return this.errors.length;
  }

  constructor(
    public type: AppErrorTypes,
    options?: AppErrorOptions,
  ) {
    super(options);
  }

  toString() {
    const indentation = ' '.repeat(this.indentation);

    const errorsString = this.errors
      .map((err, i, arr) => {
        const errorPrefix = arr.length > 1 ? `${indentation}${i + 1}: ` : '';
        return `${errorPrefix}${err}.`;
      })
      .join('\n');

    const errorHeader = `${this.type} ${
      this.length > 1 ? 'Errors:\n' : 'Error: '
    }`;

    return `${errorHeader}${errorsString}`;
  }

  push(
    error: string | string[],
    options?: Pick<AppErrorOptions, 'prepend' | 'append'>,
  ) {
    const { prepend = this.prepend, append = this.append } = options || {};
    (typeof error === 'string' ? [error] : error).forEach((err) =>
      this.errors.push(`${prepend}${err}${append}`),
    );
    return this;
  }
}
