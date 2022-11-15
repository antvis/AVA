export function flatObject(obj, concatenator = '.') {
  return Object.keys(obj).reduce((acc, key) => {
    if (typeof obj[key] !== 'object' || obj[key] === null) {
      return {
        ...acc,
        [key]: obj[key],
      };
    }

    const flattenedChild = flatObject(obj[key], concatenator);

    return {
      ...acc,
      ...Object.keys(flattenedChild).reduce(
        (childAcc, childKey) => ({ ...childAcc, [`${key}${concatenator}${childKey}`]: flattenedChild[childKey] }),
        {}
      ),
    };
  }, {});
}
