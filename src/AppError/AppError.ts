import { AbstractAppError } from './AbstractAppError.js';

export class AppError<AppErrorTypes extends string> extends AbstractAppError {
  errors: string[] = [];

  get length() {
    return this.errors.length;
  }

  static throw<AppErrorTypes extends string>(type: AppErrorTypes, error: string) {
    const appError = new AppError(type);
    appError.push(error);
    appError.throw();
  }

  constructor(public type: AppErrorTypes) {
    super();
  }

  toString(indentation = 4) {
    const _indentation = ' '.repeat(indentation);

    const errorsString = this.errors
      .map((err, i, arr) => {
        const errorPrefix = arr.length > 1 ? `${_indentation}${i + 1}: ` : '';
        return `${errorPrefix}${err}.`;
      })
      .join('\n');

    const errorHeader = `${this.type} ${this.length > 1 ? 'Errors:\n' : 'Error: '
      }`;

    return `${errorHeader}${errorsString}`;
  }

  push(error: string | string[]) {
    if (typeof error === 'string') this.errors.push(error);
    if (Array.isArray(error)) this.errors.push(...error);
    return this;
  }
}
