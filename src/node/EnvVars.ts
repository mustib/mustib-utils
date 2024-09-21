import { existsSync } from 'fs';

import { parse } from 'dotenv';

import { getTypeof, AppError, type Func, type UntypedObject } from '../common';

type ParseAsString = 'date' | 'string' | 'number' | 'bool';

type CombinedEnvVarsSources = Record<string, string>[];

type ParseAsFunction = (data: {
  /**
   * all env vars combined from the provided sources as array of objects
   */
  combinedEnvVars: CombinedEnvVarsSources;
  varValueForCurrentEnv: string;
  currentEnv: string;
  assignedSource: Record<string, string>;
  varNameForCurrentEnv: string;
}) => any;

type EnvVarsMapObj = {
  [key: string]: {
    /**
     * defines the type of the variable.
     * parseAs must be a string with a value of ("string" | "number" | "date" | "bool") or a function that parses the value and returns it so it can be basically any type.
     * if it is a function it will be called with an object of this shape { value: string, currentEnv: string, key: string, envVars: Record<string, string> }
     */
    parseAs?: ParseAsString | ParseAsFunction;

    /**
     * an object used to defines the variable name in the provided sources for the current env
     * used to define the variable name in each env with the env name as the key and the variable name for that env as the value
     * anyEnv key can be used to define the variable name for all other envs that are not defined in the object
     */
    whenNodeEnvIs: {
      // eslint-disable-next-line @typescript-eslint/ban-types
      [Env in (string & {}) | 'development' | 'production' | 'anyEnv']?: string;
    };

    /**
     * a boolean indicates that the value is dynamic and will be parsed again every time it is needed.
     * it only make sense to use it when parseAs is a function and returns a dynamic value.
     * parseAs function will be set as a getter method to the variable.
     */
    useDynamicValue?: boolean;
  };
};

type EnvSourcesObj = {
  fromFile?: string;
  fromObject?: UntypedObject;
  fromDynamicFunction?: () => UntypedObject;
};

type EnvVarsSources = string | EnvSourcesObj | EnvSourcesObj[];

type EnvVars = new <VarsMapObj extends EnvVarsMapObj = EnvVarsMapObj>(
  param: ConstructorParams<VarsMapObj>,
) => {
  [key in keyof VarsMapObj]: VarsMapObj[key]['parseAs'] extends infer Type
    ? Type extends 'string'
      ? string
      : Type extends 'number'
        ? number
        : Type extends 'bool'
          ? boolean
          : Type extends 'date'
            ? Date
            : Type extends Func
              ? ReturnType<Type>
              : never
    : never;
};

type ConstructorParams<VarsMapObj extends EnvVarsMapObj> = {
  /**
   * the sources of env vars, it can be a string containing .env file path or an object containing fromFile, fromObject and fromDynamicFunction or an array of that object
   * defaults to { fromObject: process.env }
   */
  sources?: EnvVarsSources;

  /**
   * an object defines how the final env vars result will be, where the keys will be env vars names and the values will be an object type defines how their values will be in different envs
   */
  mapObj: VarsMapObj;

  /**
   * the current env, defaults to process.env.NODE_ENV
   */
  currentEnv?: string;

  /**
   * a boolean indicates whether the generated env object should be enumerable or not (defaults to false)
   */
  enumerable?: boolean;
};

const parseAsStringHandlers: {
  [key in ParseAsString]: (_value: string) => {
    value:
      | (key extends 'date'
          ? Date
          : key extends 'number'
            ? number
            : key extends 'bool'
              ? boolean
              : string)
      | string;
    valueType: ReturnType<typeof getTypeof>;
    isValid: boolean;
  };
} = {
  string: (_value) => {
    const value = String(_value);
    const isValid = value !== '';

    return {
      value,
      isValid,
      valueType: 'string',
    };
  },
  number: (_value) => {
    const value = Number(_value);
    const valueType = getTypeof(value);
    const isValid = valueType === 'number';

    return {
      value,
      isValid,
      valueType,
    };
  },
  bool: (_value) => {
    let value;
    let isValid = true;
    let valueType: ReturnType<typeof getTypeof> = 'boolean';

    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (_value === '0' || _value === 'false' || !_value) value = false;
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    else if (_value === '1' || _value === 'true' || _value) value = true;
    else {
      value = _value;
      isValid = false;
      valueType = getTypeof(_value);
    }

    return {
      value,
      isValid,
      valueType,
    };
  },
  date: (_value) => {
    const value = new Date(_value);
    const valueType = getTypeof(value);
    const isValid = valueType === 'date';

    return {
      value,
      isValid,
      valueType,
    };
  },
};

function combineEnvVarsSources(sources: EnvVarsSources) {
  let envVarsSources!: EnvSourcesObj[];
  const typeofSources = getTypeof(sources);

  switch (typeofSources) {
    case 'array':
      envVarsSources = sources as EnvSourcesObj[];
      break;
    case 'object':
      envVarsSources = [sources as EnvSourcesObj];
      break;
    case 'string':
      envVarsSources = [{ fromFile: sources as string }];
      break;
    default:
      AppError.throw(
        'Unsupported',
        `unsupported env vars source type, only string, object and array are supported, but instead got (${typeofSources})`,
      );
  }

  const combinedEnvVarsSources = [] as CombinedEnvVarsSources;
  const pushToCombinedEnvVars = (obj: CombinedEnvVarsSources[number]) =>
    combinedEnvVarsSources.push(obj);

  envVarsSources.forEach(({ fromFile, fromObject, fromDynamicFunction }) => {
    if (typeof fromFile === 'string') {
      if (!existsSync(fromFile)) {
        AppError.throw('Undefined', `failed to find env file ${fromFile}`);
      }

      pushToCombinedEnvVars(parse(fromFile));
    }

    if (getTypeof(fromObject) === 'object') pushToCombinedEnvVars(fromObject!);

    if (typeof fromDynamicFunction === 'function') {
      const vars = fromDynamicFunction();
      const typeofVars = getTypeof(vars);

      if (typeofVars !== 'object') {
        AppError.throw(
          'Undefined',
          `failed to get env vars from dynamic function as it returned a value of type (${typeofVars}) which is not an object`,
        );
      }

      pushToCombinedEnvVars(vars);
    }
  });

  const hasAssignedValue = JSON.stringify(combinedEnvVarsSources) !== '{}';

  if (!hasAssignedValue) {
    AppError.throw('Undefined', 'undefined env vars sources');
  }

  return combinedEnvVarsSources;
}

function getVarFromSources({
  whenNodeEnvIs,
  currentEnv,
  varName,
  combinedEnvVarsSources,
}: {
  whenNodeEnvIs: EnvVarsMapObj[string]['whenNodeEnvIs'];
  currentEnv: string;
  varName: string;
  combinedEnvVarsSources: CombinedEnvVarsSources;
}) {
  let varNameInCombinedEnvVars: string | undefined;

  if (Object.hasOwn(whenNodeEnvIs, currentEnv)) {
    varNameInCombinedEnvVars = whenNodeEnvIs[currentEnv];
  } else if (Object.hasOwn(whenNodeEnvIs, 'anyEnv')) {
    varNameInCombinedEnvVars = whenNodeEnvIs.anyEnv;
  } else {
    AppError.throw(
      'Undefined',
      `${varName} in envVars has not assigned value because defined envs in whenNodeEnvIs has not matched currentEnv which is ${currentEnv} and there is no anyEnv defined in whenNodeEnvIs`,
    );
  }

  const indexOfVarNameInCombinedEnvVars = combinedEnvVarsSources.findIndex(
    (obj) => {
      if (typeof varNameInCombinedEnvVars === 'string') {
        return Object.hasOwn(obj, varNameInCombinedEnvVars);
      }
      return false;
    },
  );

  if (indexOfVarNameInCombinedEnvVars === -1) {
    return AppError.throw(
      'Undefined',
      `(${varName}) in envVars has not assigned value because (${varNameInCombinedEnvVars}) value in the currentEnv which is (${currentEnv}) is undefined and cannot be found in the provided sources`,
    ) as never;
  }

  const assignedSource =
    combinedEnvVarsSources[indexOfVarNameInCombinedEnvVars];
  const varNameInSources = varNameInCombinedEnvVars!;
  const varValue = assignedSource[varNameInSources];

  return {
    assignedSource,
    varNameInSources,
    varValue,
  };
}

function parseVarValueFromString({
  parseAsStringValue,
  currentEnv,
  varNameInAllEnvVarsFromSources,
  varName,
  assignedSource,
}: {
  parseAsStringValue: ParseAsString;
  currentEnv: string;
  varNameInAllEnvVarsFromSources: string;
  varName: string;
  assignedSource: Record<string, string>;
}) {
  const varValue = assignedSource[varNameInAllEnvVarsFromSources];

  switch (parseAsStringValue) {
    case 'string':
    case 'number':
    case 'date':
    case 'bool': {
      const { value, isValid, valueType } =
        parseAsStringHandlers[parseAsStringValue](varValue);

      if (!isValid) {
        AppError.throw(
          'Failed',
          `failed to parse (${varName}) in envVars as a ${parseAsStringValue}, because the assigned value for the current env which is (${currentEnv}) from the variable (${varNameInAllEnvVarsFromSources}) is of type (${valueType}), if you need to manually parse it you can use parseAs as a function`,
        );
      }

      return value;
    }

    default:
      return AppError.throw(
        'Unsupported',
        `parseAs as a string value must be a "string" or "number" or "date" or "bool" but instead got (${parseAsStringValue})`,
      ) as never;
  }
}

function getParseAsHandler({
  parseAs,
  currentEnv,
  varName,
  combinedEnvVarsSources,
  whenNodeEnvIs,
}: {
  parseAs: EnvVarsMapObj[string]['parseAs'];
  currentEnv: string;
  varName: string;
  combinedEnvVarsSources: CombinedEnvVarsSources;
  whenNodeEnvIs: EnvVarsMapObj[string]['whenNodeEnvIs'];
}) {
  let handler!: Func;

  const { assignedSource, varNameInSources, varValue } = getVarFromSources({
    currentEnv,
    varName,
    whenNodeEnvIs,
    combinedEnvVarsSources,
  });

  const typeofParseAs = getTypeof(parseAs);

  switch (typeofParseAs) {
    case 'string':
      handler = () =>
        parseVarValueFromString({
          currentEnv,
          parseAsStringValue: parseAs as ParseAsString,
          varName,
          varNameInAllEnvVarsFromSources: varNameInSources,
          assignedSource,
        });

      break;
    case 'function':
      handler = () =>
        (parseAs as ParseAsFunction)({
          assignedSource,
          varValueForCurrentEnv: varValue,
          currentEnv,
          varNameForCurrentEnv: varNameInSources,
          combinedEnvVars: combinedEnvVarsSources,
        });
      break;
    default:
      return AppError.throw(
        'Unsupported',
        `parseAs must be a string with a value of ("string" | "number" | "date" | "bool") or a function that parses the value and returns it, but ${typeofParseAs} is not supported parseAs type`,
      ) as never;
  }

  return handler;
}

/**
 * Simplify and make it as easy as possible to work with environment variables
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const EnvVars = class _EnvVars {
  constructor({
    sources = { fromObject: process.env },
    mapObj,
    enumerable = false,
    currentEnv = process.env.NODE_ENV!,
  }: ConstructorParams<EnvVarsMapObj>) {
    if (currentEnv === undefined) {
      // eslint-disable-next-line no-console
      console.warn('currentEnv is undefined');
    }

    const combinedEnvVarsSources = combineEnvVarsSources(sources);

    Object.entries(mapObj).forEach(
      ([varName, { parseAs = 'string', whenNodeEnvIs, useDynamicValue }]) => {
        const handler = getParseAsHandler({
          combinedEnvVarsSources,
          currentEnv,
          parseAs,
          varName,
          whenNodeEnvIs,
        });

        Object.defineProperty(this, varName, {
          enumerable,
          ...(useDynamicValue ? { get: handler } : { value: handler() }),
        });
      },
    );
  }
} as EnvVars;
