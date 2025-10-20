import { existsSync, readFileSync } from 'fs';

import {
  getTypeof,
  AppError,
  type Func,
  type UntypedObject,
  LIBRARY_ERROR_SCOPE,
} from '../../common';

import type {
  EnvSourcesObj,
  EnvVarsMapObj,
  ParseAsFunction,
  ConstructorParams,
  ParseAsString,
  EnvVarsSources,
  CombinedEnvVarsSources,
} from './types';

export const envVarsCustomEventEmitterErrorScope = [
  Symbol('@mustib/utils/EnvVars'),
  LIBRARY_ERROR_SCOPE,
];

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
    : string
    : never;
  };

function parseEnvFile(path: string) {
  if (!existsSync(path)) {
    AppError.throw(
      'Not-Found',
      `provided env file path (${path}) doesn't exist`,
      { pushOptions: { scope: envVarsCustomEventEmitterErrorScope } },
    );
  }

  const content = readFileSync(path, 'utf-8');

  const lines = content.split('\n');

  return lines.reduce((vars, line) => {
    // Ignore empty lines and comments
    if (line.trim() === '' || line.startsWith('#')) {
      return vars;
    }

    const [key = '', value] = line.split('=').map((val) => val.trim());

    if (key === '')
      AppError.throw(
        'Invalid',
        `empty variable name found in env file (${path}) with value = (${value})`,
        { pushOptions: { scope: envVarsCustomEventEmitterErrorScope } },
      );

    vars[key] = value;

    return vars;
  }, {} as UntypedObject);
}

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
        'Invalid',
        `invalid env vars source type, only string, object and array are supported, but instead got (${typeofSources})`,
        { pushOptions: { scope: envVarsCustomEventEmitterErrorScope } },
      );
  }

  const combinedEnvVarsSources = [] as CombinedEnvVarsSources;
  const pushToCombinedEnvVars = (obj: CombinedEnvVarsSources[number]) =>
    combinedEnvVarsSources.push(obj);

  envVarsSources.forEach(({ fromFile, fromObject, fromDynamicFunction }) => {
    const typeofFromFile = getTypeof(fromFile);
    if (typeofFromFile === 'string') {
      pushToCombinedEnvVars(parseEnvFile(fromFile!));
    } else if (typeofFromFile !== 'undefined')
      AppError.throw(
        'Invalid',
        `fromFile in EnvVars sources must be an file but instead got (${typeofFromFile})`,
        { pushOptions: { scope: envVarsCustomEventEmitterErrorScope } },
      );

    const typeofFromObject = getTypeof(fromObject);
    if (typeofFromObject === 'object') pushToCombinedEnvVars(fromObject!);
    else if (typeofFromObject !== 'undefined')
      AppError.throw(
        'Invalid',
        `fromObject in EnvVars sources must be an object but instead got (${typeofFromObject})`,
        { pushOptions: { scope: envVarsCustomEventEmitterErrorScope } },
      );

    const typeofFromDynamicFunction = getTypeof(fromDynamicFunction);
    if (typeofFromDynamicFunction === 'function') {
      const vars = fromDynamicFunction!();
      const typeofVars = getTypeof(vars);

      if (typeofVars !== 'object') {
        AppError.throw(
          'Invalid',
          `failed to get env vars from dynamic function as it returned a value of type (${typeofVars}) which is not an object`,
          { pushOptions: { scope: envVarsCustomEventEmitterErrorScope } },
        );
      }

      pushToCombinedEnvVars(vars);
    } else if (typeofFromDynamicFunction !== 'undefined')
      AppError.throw(
        'Invalid',
        `fromDynamicFunction in EnvVars sources must be a function but instead got (${typeofFromDynamicFunction})`,
        { pushOptions: { scope: envVarsCustomEventEmitterErrorScope } },
      );
  });

  const hasAssignedValue = JSON.stringify(combinedEnvVarsSources) !== '{}';

  if (!hasAssignedValue) {
    AppError.throw('Undefined', 'undefined env vars sources',
      { pushOptions: { scope: envVarsCustomEventEmitterErrorScope } },
    );
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
      { pushOptions: { scope: envVarsCustomEventEmitterErrorScope } },
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
      { pushOptions: { scope: envVarsCustomEventEmitterErrorScope } },
    ) as never;
  }

  const assignedSource =
    combinedEnvVarsSources[indexOfVarNameInCombinedEnvVars]!;
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
  const varValue = assignedSource[varNameInAllEnvVarsFromSources]!;

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
          { pushOptions: { scope: envVarsCustomEventEmitterErrorScope } },
        );
      }

      return value;
    }

    default:
      return AppError.throw(
        'Invalid',
        `parseAs as a string value must be a "string" or "number" or "date" or "bool" but instead got (${parseAsStringValue})`,
        { pushOptions: { scope: envVarsCustomEventEmitterErrorScope } },
      );
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

  if (typeof varValue !== 'string')
    return AppError.throw(
      'Invalid',
      `expected the value for (${varName}) which has the name (${varNameInSources}) in the sources for the current env which is (${currentEnv}) to be a string, but received type (${getTypeof(varValue)}).`,
      { pushOptions: { scope: envVarsCustomEventEmitterErrorScope } },
    );

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
        'Invalid',
        `parseAs must be a string with a value of ("string" | "number" | "date" | "bool") or a function that parses the value and returns it, but ${typeofParseAs} is not a valid parseAs type`,
        { pushOptions: { scope: envVarsCustomEventEmitterErrorScope } },
      ) as never;
  }

  return handler;
}

/**
 * Simplify and make it as easy as possible to work with environment variables
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare, @typescript-eslint/no-shadow
export const EnvVars = class EnvVars {
  constructor({
    sources = { fromObject: process.env },
    mapObj,
    useDynamicValues,
    enumerable = false,
    currentEnv = process.env.NODE_ENV!,
  }: ConstructorParams<EnvVarsMapObj>) {
    if (currentEnv === undefined) {
      // eslint-disable-next-line no-console
      console.warn('currentEnv is undefined');
      throw new Error(currentEnv);
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

        const shouldBeDynamic =
          useDynamicValue || (useDynamicValues && useDynamicValue !== false);

        Object.defineProperty(this, varName, {
          enumerable,
          ...(shouldBeDynamic ? { get: handler } : { value: handler() }),
        });
      },
    );
  }
} as EnvVars;
