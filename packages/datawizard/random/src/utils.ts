import { BasicRandom } from './basic-random';

/**
 * 断言
 * @param test - 需要断言的内容
 * @param errorMessage - 错误信息
 */
export function assert(test: any, errorMessage: string): void {
  if (test) throw new Error(errorMessage);
}

/**
 * 合并默认值
 * @param options - 需要初始化的对象
 * @param defaults - 默认值
 */
export function initOptions<T, U>(options: T, defaults: U): T & U {
  const def: any = Object.assign({}, defaults);
  Object.entries(options || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      def[key] = value;
    }
  });
  return def;
}

/**
 * 大写第一个字符
 * @param source - 字符串
 */
export function capitalize(source: string): string {
  return source.charAt(0).toUpperCase() + source.substr(1);
}

type Constructor<T = {}> = new (...args: any[]) => T;

export function applyMixins<T extends Constructor<BasicRandom>>(derivedCtor: T, baseCtors: T[]): void {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name)!);
    });
  });
}

export const MAX_INT = 2 ** 53 - 1;
export const MIN_INT = -MAX_INT;

/**
 * 生成 [0, 1, ...]
 * @param size - 数组长度
 */
export function range(size: number): number[] {
  return Array.of(...Array(size)).map((_, i) => i);
}
