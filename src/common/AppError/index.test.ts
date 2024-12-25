import { describe, it, expect } from 'vitest';

import { AppError } from '.';

describe('AppError', () => {
  it('should have a length = 0 by default', () => {
    const appError = new AppError();
    expect((appError as any).length).to.be.equal(0);
  });

  it('should not include new line for single error', () => {
    const appError = new AppError();
    appError.push('Test', 'test error');
    expect(appError.message).not.contain('\n');
  });

  it('should include new line for multiple errors', () => {
    const appError = new AppError();
    appError.push('Test', 'test error');
    appError.push('Test', 'test error 2');
    expect(appError.message).contain('\n');
  });

  it('should start with capitalized error type', () => {
    const appError = new AppError();
    appError.push('test' as any, 'test error');
    expect(appError.message.startsWith('Test')).toBe(true);
  });

  it('should have a length equal to the number of errors type', () => {
    const appError = new AppError();
    appError.push('Test1', ['test error', 'test error']);
    appError.push('Test2', 'test error 2');
    expect((appError as any).length).to.be.equal(2);
  });

  it('should push same error types to the same array', () => {
    const appError = new AppError();
    appError.push('Test', 'test error');
    appError.push('Test', 'test error 2');
    expect((appError as any).errors.Test.length).to.be.equal(2);
  });

  it('should add undefined scope to error if not provided', () => {
    const appError = new AppError();
    appError.push('Test', 'test error');
    expect((appError as any).errors.Test[0].scope).to.be.equal(undefined);
  });

  it('should add scope to error if provided', () => {
    const appError = new AppError();
    appError.push('Test', 'test error', { scope: ['test'] });
    expect((appError as any).errors.Test[0].scope).to.be.toStrictEqual([
      'test',
    ]);
  });

  it('should throw if end called with length > 0', () => {
    const appError = new AppError();
    (appError as any).length = 1;
    expect(() => appError.end()).to.toThrowError(AppError);
  });

  it('should catch AppError instances', async () => {
    const appError = new AppError();
    await appError.catch(() => {
      AppError.throw('Test', 'test error');
    });
    expect((appError as any).errors.Test[0].message).to.be.equal('test error');
  });

  it('should throw non AppError instances', async () => {
    const appError = new AppError();
    await expect(() =>
      appError.catch(() => {
        throw new Error('test error');
      }),
    ).rejects.toThrow('test error');
  });

  it('should throw automatically if aggregate call end with errors without call end manually', async () => {
    try {
      await AppError.aggregate(async (appError) => {
        await appError.catch(() => {
          AppError.throw('Test2', 'test error 2');
        });
        appError.push('Test', 'test error');
      });
    } catch (error) {
      expect(
        (error as any).length,
        'add caught and pushed error to AppError',
      ).to.be.equal(2);
      expect(error).toBeInstanceOf(AppError);
    }
  });

  it('toString() should return only included scope if provided', () => {
    const appError = new AppError();
    appError.push('Test', 'test error with include scope', {
      scope: ['include'],
    });
    appError.push('Test', 'test error without scope');
    const scopeMessage = appError.toString({ includesScope: ['include'] });
    expect(scopeMessage).to.contain('test error with include scope');
    expect(scopeMessage).not.to.contain('test error without scope');
  });

  it('toString() should not return excluded scope if provided even if it is included', () => {
    const appError = new AppError();

    appError.push('Test', 'test error with exclude and include scope', {
      scope: ['exclude', 'include'],
    });
    appError.push('Test', 'test error with exclude scope', {
      scope: ['exclude'],
    });
    appError.push('Test', 'test error with include scope', {
      scope: ['include'],
    });
    appError.push('Test', 'test error without scope');

    const scopeMessage = appError.toString({
      includesScope: ['include'],
      excludesScope: ['exclude'],
    });

    expect(
      scopeMessage,
      'should exclude excluded scope even if it is included',
    ).to.not.contain('test error with exclude and include scope');

    expect(scopeMessage, 'should exclude excluded scope').to.not.contain(
      'test error with exclude scope',
    );

    expect(scopeMessage, 'should only include included scope').to.contain(
      'test error with include scope',
    );
  });
});
