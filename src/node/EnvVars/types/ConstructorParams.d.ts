import type { EnvVarsSources } from './EnvVarsSources';
import type { EnvVarsMapObj } from './EnvVarsMapObj';

export type ConstructorParams<VarsMapObj extends EnvVarsMapObj> = {
  /**
   * If true, it will be used as a global value for `mapObj.useDynamicValue`
   * when `mapObj.useDynamicValue` value is not false.
   * See {@link EnvVarsMapObj} for more information.
   */
  useDynamicValues?: boolean;

  /**
   * the sources of env vars.
   * @see {@link EnvVarsSources}
   * @default { fromObject: process.env }
   */
  sources?: EnvVarsSources;

  /**
   * an object defines how the final env vars result will be generated, where the keys will be the names of the generated env vars and the values will be an object that defines how the value of each env var will be generated in different environments
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
