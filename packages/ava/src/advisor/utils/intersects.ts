export function intersects(array1: any[], array2: any[]): boolean {
  return array2.some((e) => array1.includes(e));
}
