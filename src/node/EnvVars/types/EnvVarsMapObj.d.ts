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
     * An object mapping environment names (like "development", "production", or any custom string) and/or "anyEnv" (as a fallback) to either:
     *   - A string representing the variable name in the environment sources
     *   - Or an object:
     *       - varName: the variable name in the sources
     *       - defaultValue: the default value to use if not specified in the sources
     * "anyEnv" acts as a fallback when the current environment does not match any other key.

     * @example
     * {
        // .env
        Port_Dev=3000
        Port_Prod=5000

        // index.ts
        whenNodeEnvIs: {
          development: 'Port_Dev',
          production: 'Port_Prod',
          anyEnv: {
            varName: 'Port_Dev',
            defaultValue: '4000',
          },
        }
      }
     */
    whenNodeEnvIs: {
      // eslint-disable-next-line @typescript-eslint/ban-types
      [Env in (string & {}) | 'development' | 'production' | 'anyEnv']?:
      | string
      | {
        defaultValue: string;
        varName: string;
      };
    };

    /**
     * a boolean indicates that the value is dynamic and will be parsed again every time it is needed.
     */
    useDynamicValue?: boolean;
  };
};
