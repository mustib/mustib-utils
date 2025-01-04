import type { CombinedEnvVarsSources } from './CombinedEnvVarsSources';

/** it's value will be used to convert the value of the env-var from string to the specified type */
export type ParseAsString = 'date' | 'string' | 'number' | 'bool';

/** A user-defined function whose return value determines the value of the environment variable. */
export type ParseAsFunction = (data: {
  /** @see {@link CombinedEnvVarsSources} */
  combinedEnvVars: CombinedEnvVarsSources;

  /**
   * the value of the varNameForCurrentEnv in assignedSource object
   */
  varValueForCurrentEnv: string;

  currentEnv: string;

  /**
   * the first object from combinedEnvVars that has the varNameForCurrentEnv as a key
   */
  assignedSource: Record<string, string>;

  /**
   * the value of the current env in whenNodeEnvIs.
   * @example
   * ```ts
   * const whenNodeEnvIs = {
   *   production: 'Prod_VAR',
   *   anyEnv: 'ANY_VAR',
   * }
   * ```
   * in this case if `currentEnv` is `production` then `varNameForCurrentEnv` is `Prod_VAR`
   * for any other env that is not defined in whenNodeEnvIs `varNameForCurrentEnv` is `ANY_VAR`
   */
  varNameForCurrentEnv: string;
}) => any;
