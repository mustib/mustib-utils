import type { ParseAsString, ParseAsFunction } from './ParseAs';

export type EnvVarsMapObj = {
  [varName: string]: {
    /**
     * used to convert the value of the env-var from string to the specified type
     * @see {@link ParseAsString}-{@link ParseAsFunction}
     * @default 'string'
     */
    parseAs?: ParseAsString | ParseAsFunction;

    /**
     * an object where the key is the environments name or "anyEnv" and the variable name in the env sources as the value.
     * anyEnv" serves as a fallback when the current environment isn't specified.
     * @example
     * {
        // .env
        Port_Dev=123
        Port_Prod=456

        // index.ts
        whenNodeEnvIs: {
          development: 'Port_Dev',
          production: 'Port_Prod',
          anyEnv: 'Port_Dev',
        }
      }
     */
    whenNodeEnvIs: {
      // eslint-disable-next-line @typescript-eslint/ban-types
      [Env in (string & {}) | 'development' | 'production' | 'anyEnv']?: string;
    };

    /**
     * a boolean indicates that the value is dynamic and will be parsed again every time it is needed.
     */
    useDynamicValue?: boolean;
  };
};
