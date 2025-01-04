import type { UntypedObject } from '../../../common';

export type EnvSourcesObj = {
  /** A string containing absolute path to an env file to read variables from */
  fromFile?: string;

  /** An object containing variables names as keys and their values as string */
  fromObject?: UntypedObject;

  /** A function that return an object containing variables names as keys and their values as string */
  fromDynamicFunction?: () => UntypedObject;
};
