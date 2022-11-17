export function hasSubset(array1: any[], array2: any[]): boolean {
  return array2.every((e) => array1.includes(e));
}
