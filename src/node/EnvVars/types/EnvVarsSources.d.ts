import type { EnvSourcesObj } from './EnvSourcesObj';

/** if it is a string it acts as {@link EnvSourcesObj.fromFile fromFile} property of {@link EnvSourcesObj} */
export type EnvVarsSources = string | EnvSourcesObj | EnvSourcesObj[];
