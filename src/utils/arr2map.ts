export function arr2map<T>(arr: T[], keyId: string) {
  return arr.reduce<Record<string, T>>((prev, curr) => {
    // eslint-disable-next-line no-param-reassign
    prev[curr[keyId]] = curr;
    return prev;
  }, {});
}
