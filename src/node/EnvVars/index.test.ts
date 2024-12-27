import path from 'node:path';

import { describe, it, expect } from 'vitest';

import { AppError } from '../../common/AppError';

import { getDirname } from '../getDirname';

import { EnvVars } from '.';

const envFilePath = path.join(getDirname(import.meta.url), '.env.test');

describe('EnvVars', () => {
  it('should parse env file source', () => {
    const envVars = new EnvVars({
      sources: { fromFile: envFilePath },
      mapObj: { fileVar: { whenNodeEnvIs: { anyEnv: 'FILE_VAR' } } },
    });
    expect(envVars.fileVar).toBe('FILE_VAR');
  });

  it('should treat sources as env file if sources is a string', () => {
    const envVars = new EnvVars({
      sources: envFilePath,
      mapObj: { fileVar: { whenNodeEnvIs: { anyEnv: 'FILE_VAR' } } },
    });
    expect(envVars.fileVar).toBe('FILE_VAR');
  });

  it('should use object source', () => {
    const envVars = new EnvVars({
      sources: { fromObject: { OBJ_VAR: 'OBJ_VAR' } },
      mapObj: { objVar: { whenNodeEnvIs: { anyEnv: 'OBJ_VAR' } } },
    });
    expect(envVars.objVar).toBe('OBJ_VAR');
  });

  it('should use dynamic function source', () => {
    const envVars = new EnvVars({
      sources: {
        fromDynamicFunction() {
          return { FUNC_VAR: 'FUNC_VAR' };
        },
      },
      mapObj: { funcVar: { whenNodeEnvIs: { anyEnv: 'FUNC_VAR' } } },
    });
    expect(envVars.funcVar).toBe('FUNC_VAR');
  });

  it('should use process.env as default source', () => {
    process.env.TEST_VAR = 'TEST_VAR';

    const envVars = new EnvVars({
      mapObj: { testVar: { whenNodeEnvIs: { anyEnv: 'TEST_VAR' } } },
    });

    expect(envVars.testVar).toBe('TEST_VAR');
  });

  it('should use process.env.NODE_ENV as default env', () => {
    const envVars = new EnvVars({
      sources: { fromObject: { TEST_VAR: 'TEST_VAR' } },
      mapObj: { testVar: { whenNodeEnvIs: { test: 'TEST_VAR' } } },
    });

    expect(envVars.testVar).toBe('TEST_VAR');
  });

  it('should use anyEnv value as fallback env', () => {
    const envVars = new EnvVars({
      sources: {
        fromObject: { ANY_ENV_VAR: 'ANY_ENV_VAR' },
      },
      mapObj: { testVar: { whenNodeEnvIs: { anyEnv: 'ANY_ENV_VAR' } } },
    });

    expect(envVars.testVar).toBe('ANY_ENV_VAR');
  });

  it('should not use anyEnv value if current env is included in whenNodeEnvIs', () => {
    const envVars = new EnvVars({
      sources: {
        fromObject: { ANY_ENV_VAR: 'ANY_ENV_VAR', TEST_VAR: 'TEST_VAR' },
      },
      mapObj: {
        var: { whenNodeEnvIs: { anyEnv: 'ANY_ENV_VAR', test: 'TEST_VAR' } },
      },
    });

    expect(envVars.var).toBe('TEST_VAR');
  });

  it('should use currEnv if provided', () => {
    const envVars = new EnvVars({
      currentEnv: 'prod',
      sources: {
        fromObject: { TEST_VAR: 'TEST_VAR', PROD_VAR: 'PROD_VAR' },
      },
      mapObj: {
        var: { whenNodeEnvIs: { test: 'TEST_VAR', prod: 'PROD_VAR' } },
      },
    });

    expect(envVars.var).toBe('PROD_VAR');
  });

  it('should combine sources objects', () => {
    const envVars = new EnvVars({
      sources: {
        fromFile: envFilePath,
        fromObject: { OBJ_VAR: 'OBJ_VAR' },
        fromDynamicFunction() {
          return { FUNC_VAR: 'FUNC_VAR' };
        },
      },
      mapObj: {
        fileVar: { whenNodeEnvIs: { anyEnv: 'FILE_VAR' } },
        objVar: { whenNodeEnvIs: { anyEnv: 'OBJ_VAR' } },
        funcVar: { whenNodeEnvIs: { anyEnv: 'FUNC_VAR' } },
      },
    });

    expect(envVars.fileVar, 'should merge file source').toBe('FILE_VAR');
    expect(envVars.objVar, 'should merge object source').toBe('OBJ_VAR');
    expect(envVars.funcVar, 'should merge dynamic function source').toBe(
      'FUNC_VAR',
    );
  });

  it('should use sources array', () => {
    const envVars = new EnvVars({
      sources: [
        { fromObject: { VAR_1: 'VAR_1' } },
        { fromObject: { VAR_2: 'VAR_2' } },
      ],
      mapObj: {
        var1: { whenNodeEnvIs: { anyEnv: 'VAR_1' } },
        var2: { whenNodeEnvIs: { anyEnv: 'VAR_2' } },
      },
    });

    expect(envVars.var1).toBe('VAR_1');
    expect(envVars.var2).toBe('VAR_2');
  });

  it('should use dynamic value', () => {
    const sourceObject = { OBJ_VAR: 'OBJ_VAR' };
    const envVars = new EnvVars({
      sources: {
        fromObject: sourceObject,
      },
      mapObj: {
        objVar: { whenNodeEnvIs: { anyEnv: 'OBJ_VAR' }, useDynamicValue: true },
      },
    });

    expect(envVars.objVar).toBe('OBJ_VAR');

    sourceObject.OBJ_VAR = 'NEW_OBJ_VAR';

    expect(envVars.objVar).toBe('NEW_OBJ_VAR');
  });

  it('should not use dynamic value', () => {
    const sourceObject = { OBJ_VAR: 'OBJ_VAR' };
    const envVars = new EnvVars({
      sources: {
        fromObject: sourceObject,
      },
      mapObj: {
        objVar: {
          whenNodeEnvIs: { anyEnv: 'OBJ_VAR' },
          useDynamicValue: false,
        },
      },
    });

    expect(envVars.objVar).toBe('OBJ_VAR');

    sourceObject.OBJ_VAR = 'NEW_OBJ_VAR';

    expect(envVars.objVar).toBe('OBJ_VAR');
  });

  it('should not use dynamic value by default if useDynamicValue is undefined', () => {
    const sourceObject = { OBJ_VAR: 'OBJ_VAR' };
    const envVars = new EnvVars({
      sources: {
        fromObject: sourceObject,
      },
      mapObj: {
        objVar: {
          whenNodeEnvIs: { anyEnv: 'OBJ_VAR' },
        },
      },
    });

    expect(envVars.objVar).toBe('OBJ_VAR');

    sourceObject.OBJ_VAR = 'NEW_OBJ_VAR';

    expect(envVars.objVar).toBe('OBJ_VAR');
  });

  it('should use global useDynamicValues if it is true and useDynamicValue is not false', () => {
    const sourceObject = {
      STATIC_OBJ_VAR: 'STATIC_OBJ_VAR',
      Dynamic_OBJ_VAR: 'Dynamic_OBJ_VAR',
      OBJ_VAR: 'OBJ_VAR',
    };
    const envVars = new EnvVars({
      sources: { fromObject: sourceObject },
      useDynamicValues: true,
      mapObj: {
        staticObjVar: {
          whenNodeEnvIs: { anyEnv: 'STATIC_OBJ_VAR' },
          useDynamicValue: false,
        },
        dynamicObjVar: {
          whenNodeEnvIs: { anyEnv: 'Dynamic_OBJ_VAR' },
          useDynamicValue: true,
        },
        objVar: { whenNodeEnvIs: { anyEnv: 'OBJ_VAR' } },
      },
    });
    expect(envVars.staticObjVar).toBe('STATIC_OBJ_VAR');
    expect(envVars.dynamicObjVar).toBe('Dynamic_OBJ_VAR');
    expect(envVars.objVar).toBe('OBJ_VAR');

    sourceObject.STATIC_OBJ_VAR = 'NEW_STATIC_OBJ_VAR';
    sourceObject.Dynamic_OBJ_VAR = 'NEW_Dynamic_OBJ_VAR';
    sourceObject.OBJ_VAR = 'NEW_OBJ_VAR';

    expect(envVars.staticObjVar).toBe('STATIC_OBJ_VAR');
    expect(envVars.dynamicObjVar).toBe('NEW_Dynamic_OBJ_VAR');
    expect(envVars.objVar).toBe('NEW_OBJ_VAR');
  });

  it('should parseAs number', () => {
    const envVars = new EnvVars({
      sources: { fromObject: { NUMBER_VAR: '42' } },
      mapObj: {
        numberVar: {
          whenNodeEnvIs: { anyEnv: 'NUMBER_VAR' },
          parseAs: 'number',
        },
      },
    });

    expect(envVars.numberVar).toBe(42);
  });

  it('should parseAs date', () => {
    const date = new Date().toString();
    const envVars = new EnvVars({
      sources: { fromObject: { DATE_VAR: date } },
      mapObj: {
        dateVar: {
          whenNodeEnvIs: { anyEnv: 'DATE_VAR' },
          parseAs: 'date',
        },
      },
    });

    expect(envVars.dateVar).toBeInstanceOf(Date);
    expect(envVars.dateVar).toEqual(new Date(date));
  });

  it('should parseAs boolean', () => {
    const envVars = new EnvVars({
      sources: {
        fromObject: {
          BOOL_VAR1: 'true',
          BOOL_VAR2: '1',
          BOOL_VAR3: 'false',
          BOOL_VAR4: '0',
        },
      },
      mapObj: {
        boolVar1: {
          whenNodeEnvIs: { anyEnv: 'BOOL_VAR1' },
          parseAs: 'bool',
        },
        boolVar2: {
          whenNodeEnvIs: { anyEnv: 'BOOL_VAR2' },
          parseAs: 'bool',
        },
        boolVar3: {
          whenNodeEnvIs: { anyEnv: 'BOOL_VAR3' },
          parseAs: 'bool',
        },
        boolVar4: {
          whenNodeEnvIs: { anyEnv: 'BOOL_VAR4' },
          parseAs: 'bool',
        },
      },
    });

    expect(envVars.boolVar1).toBe(true);
    expect(envVars.boolVar2).toBe(true);
    expect(envVars.boolVar3).toBe(false);
    expect(envVars.boolVar4).toBe(false);
  });

  it('should not be enumerable by default', () => {
    const envVars = new EnvVars({
      sources: {
        fromObject: { TEST_VAR: 'TEST_VAR' },
      },
      mapObj: { testVar: { whenNodeEnvIs: { anyEnv: 'TEST_VAR' } } },
    });

    expect(Object.keys(envVars).length).toBe(0);
  });

  it('should not be enumerable by default', () => {
    const envVars = new EnvVars({
      enumerable: true,
      sources: {
        fromObject: { TEST_VAR: 'TEST_VAR' },
      },
      mapObj: { testVar: { whenNodeEnvIs: { anyEnv: 'TEST_VAR' } } },
    });

    expect(Object.keys(envVars)).toEqual(['testVar']);
  });

  it('should parseAs string by default', () => {
    const envVars = new EnvVars({
      sources: { fromObject: { STRING_VAR: 'STRING_VAR' } },
      mapObj: { stringVar: { whenNodeEnvIs: { anyEnv: 'STRING_VAR' } } },
    });

    expect(envVars.stringVar).toBe('STRING_VAR');
  });

  it('should use custom parseAs function', () => {
    const envVars = new EnvVars({
      sources: { fromObject: { STRING_ARRAY_VAR: '1,2,3' } },
      mapObj: {
        stringArrayVar: {
          whenNodeEnvIs: { anyEnv: 'STRING_ARRAY_VAR' },
          parseAs({ varValueForCurrentEnv }) {
            return varValueForCurrentEnv.split(',');
          },
        },
      },
    });

    expect(envVars.stringArrayVar).toEqual(['1', '2', '3']);
  });

  it('should throw Not-Found error if provided env file does not exist', () => {
    expect(
      () =>
        new EnvVars({
          sources: { fromFile: 'DOES-NOT-EXIST' },
          mapObj: {},
        }),
    ).to.throw(AppError, /Not-Found/i);
  });

  it('should throw Invalid error if variable name is empty in provided env file', () => {
    expect(
      () =>
        new EnvVars({
          sources: {
            fromFile: path.join(getDirname(import.meta.url), '.env.empty.test'),
          },
          mapObj: {},
        }),
    ).to.throw(AppError, 'Invalid');
  });

  it('should throw Invalid error if fromDynamicFunction in sources returns a non-object', () => {
    expect(
      () =>
        new EnvVars({
          sources: {
            fromDynamicFunction() {
              return [];
            },
          },
          mapObj: {},
        }),
    ).to.throw(AppError, 'Invalid');
  });

  it('should throw Invalid error if fromDynamicFunction in sources is defined and not a function', () => {
    expect(
      () =>
        new EnvVars({
          sources: {
            fromDynamicFunction: 'not a function' as any,
          },
          mapObj: {},
        }),
    ).to.throw(AppError, 'Invalid');
  });

  it('should throw Invalid error if fromFile in sources is defined and not a string', () => {
    expect(
      () =>
        new EnvVars({
          sources: {
            fromFile: null as any,
          },
          mapObj: {},
        }),
    ).to.throw(AppError, 'Invalid');
  });

  it('should throw Invalid error if fromObject in sources is defined and not an object', () => {
    expect(
      () =>
        new EnvVars({
          sources: {
            fromObject: 'not an object' as any,
          },
          mapObj: {},
        }),
    ).to.throw(AppError, 'Invalid');
  });

  it('should throw Invalid error if typeof sources is not a string, object or array', () => {
    expect(
      () =>
        new EnvVars({
          sources: 123 as any,
          mapObj: {},
        }),
    ).to.throw(AppError, 'Invalid');
  });

  it('should throw Invalid error if var value in sources for the current env is not a string', () => {
    expect(
      () =>
        new EnvVars({
          sources: {
            fromObject: { TEST_VAR: 123 },
          },
          mapObj: {
            testVar: { whenNodeEnvIs: { anyEnv: 'TEST_VAR' } },
          },
        }),
    ).to.throw(AppError, 'Invalid');
  });

  it('should throw Invalid error if parseAs is not a function or a string with value other than string | number | date | bool', () => {
    ['invalid', NaN, {}].forEach((parseAs) =>
      expect(
        () =>
          new EnvVars({
            sources: {
              fromObject: { TEST_VAR: 'value' },
            },
            mapObj: {
              testVar: {
                whenNodeEnvIs: { anyEnv: 'TEST_VAR' },
                parseAs: parseAs as any,
              },
            },
          }),
      ).to.throw(AppError, 'Invalid'),
    );
  });

  it('should throw Failed error if parseAs is a string and the parsed value is not valid (empty)', () => {
    expect(
      () =>
        new EnvVars({
          sources: {
            fromObject: { TEST_VAR: '' },
          },
          mapObj: {
            testVar: {
              whenNodeEnvIs: { anyEnv: 'TEST_VAR' },
              parseAs: 'string',
            },
          },
        }),
    ).to.throw(AppError, 'Failed');
  });

  it('should throw Undefined error if anyEnv and currentEnv is not defined in whenNodeEnvIs', () => {
    expect(
      () =>
        new EnvVars({
          sources: {
            fromObject: { TEST_VAR: 'value' },
          },
          mapObj: {
            testVar: {
              whenNodeEnvIs: {},
            },
          },
        }),
    ).to.throw(AppError, 'Undefined');
  });

  it('should throw Undefined error if sources is empty', () => {
    expect(
      () =>
        new EnvVars({
          sources: {},
          mapObj: {
            testVar: {
              whenNodeEnvIs: { anyEnv: 'TEST_VAR' },
            },
          },
        }),
    ).to.throw(AppError, 'Undefined');
  });
});
