/**
 * Gets the value at path of object
 * implement by **You-Dont-Need-Lodash-Underscore**
 * slightly different from _.get() in lodash
 * TODO: maybe replace by optional chain later
 *
 * @param obj the object to be searched
 * @param path the path to search in `obj`
 * @param defaultValue if path does not exist, return default value.
 * @returns
 */
const get = (obj: object, path: string, defaultValue = undefined): any => {
  const travel = (regexp: RegExp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res: Record<string, any>, key: string) => (res !== null && res !== undefined ? res[key] : res), obj);
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
};

export default get;
