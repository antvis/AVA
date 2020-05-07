/**
 * 数据行
 * @public
 */
export type RowData = Record<string, any>;
/**
 * 合并默认值
 * @param options - 需要初始化的对象
 * @param defaults - 默认值
 */
export function mergeOptions<T, U>(options: T, defaults: U): T & U {
  const result: any = Object.assign({}, defaults);
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      result[key] = value;
    }
  });
  return result;
}

export function getExtent(arr: number[]): [number, number] {
  return [Math.min(...arr), Math.max(...arr)];
}

/**
 * 断言
 * @param test - 需要断言的内容
 * @param errorMessage - 错误信息
 */
export function assert(condition: any, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg);
  }
}

export function getSequence(start: number, stop: number, step?: number): number[] {
  let s: number;
  if (step) {
    if (start > stop) {
      assert(step < 0, 'xxx');
    }

    if (start < stop) {
      assert(step > 0, 'xxx');
    }
    s = step;
  } else {
    s = start < stop ? 1 : -1;
  }
  const result: number[] = [];
  let i = 0;
  while (true) {
    const value = start + i * s;
    if (s > 0 && value >= stop) break;
    if (s < 0 && value <= stop) break;
    result.push(value);
    i++;
  }
  return result;
}
