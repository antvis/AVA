declare global {
  namespace jest {
    interface Matchers<R, _T = {}> {
      toBeCloseToArray(expected: number[] | number[][]): R;
      toBeCloseToObject(expected: Record<string, any>): R;
    }
  }
}

export {};
