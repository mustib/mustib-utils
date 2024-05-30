import { getTypeof } from "./getTypeof.js";

import type { UntypedObject } from "types.js";

type MergeObjects<Target, Source> = Target extends Array<any>
  ? Source
  : Source extends Array<any>
  ? Source
  : Target extends UntypedObject ? Source extends UntypedObject
  ? Target & Source : Source
  : Source;

function isObject(v: any): v is UntypedObject {
  return getTypeof(v) === 'object';
}

function _mergeTwoObjects<
  Target extends UntypedObject,
  Source extends UntypedObject
>(target: Target, source: Source) {
  const sourceEntries = Object.entries(source) as [keyof Target, any][];

  const merged = target;

  sourceEntries.forEach(([key, value]) => {
    if (
      !(key in target) ||
      !isObject(value) ||
      !isObject(target[key])
    ) {
      merged[key] = value;
      return;
    }

    _mergeTwoObjects(merged[key] as UntypedObject, value);
  });
  return merged;
}

/**
 * Merges two objects at a deep level by cloning properties from the source object to the target object only if both are objects.
 *
 * @param {Target} target - The target object to merge to.
 * @param {Source} source - The source object to merge from.
 * @param {boolean} [shouldMutateTarget=false] - A boolean indicating whether to create a new object or mutate the target object (defaults to false).
 * @returns {MergeObjects<Target, Source>} - The merged object, or the source object if either the target or source is not an object.
 */
export function mergeTwoObjects<
  Target,
  Source
>(target: Target, source: Source, shouldMutateTarget = false): MergeObjects<Target, Source> {
  if (
    !isObject(target) ||
    !isObject(source)
  ) {
    return source as never;
  }

  return _mergeTwoObjects(
    shouldMutateTarget ? target : structuredClone(target),
    source
  ) as never;
}
