/**
 * implementation of deepMix in antv/utils
 */

const MAX_MIX_LEVEL = 5;

const isObjectLike = (value: any): value is object => {
  /**
   * isObjectLike({}) => true
   * isObjectLike([1, 2, 3]) => true
   * isObjectLike(Function) => false
   * isObjectLike(null) => false
   */
  return typeof value === 'object' && value !== null;
};

const { toString } = {};

const isType = (value: any, type: string): boolean => toString.call(value) === `[object ${type}]`;

const isPlainObject = (value: any): value is object => {
  /**
   * isObjectLike(new Foo) => false
   * isObjectLike([1, 2, 3]) => false
   * isObjectLike({ x: 0, y: 0 }) => true
   * isObjectLike(Object.create(null)) => true
   */
  if (!isObjectLike(value) || !isType(value, 'Object')) {
    return false;
  }
  if (Object.getPrototypeOf(value) === null) {
    return true;
  }
  let proto = value;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(value) === proto;
};

const isArray = (value: any): value is Array<any> => {
  return Array.isArray ? Array.isArray(value) : isType(value, 'Array');
};

function pDeepMix(inputDist: any, src: any, inputLevel?: number, inputMaxLevel?: number) {
  const level = inputLevel || 0;
  const maxLevel = inputMaxLevel || MAX_MIX_LEVEL;
  const dist = inputDist;
  Object.keys(src).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(src, key)) {
      const value = src[key];
      if (value !== null && isPlainObject(value)) {
        if (!isPlainObject(dist[key])) {
          dist[key] = {};
        }
        if (level < maxLevel) {
          pDeepMix(dist[key], value, level + 1, maxLevel);
        } else {
          dist[key] = src[key];
        }
      } else if (isArray(value)) {
        dist[key] = [];
        dist[key] = dist[key].concat(value);
      } else if (value !== undefined) {
        dist[key] = value;
      }
    }
  });
}

const deepMix = (rst: any, ...args: any[]) => {
  for (let i = 0; i < args.length; i += 1) {
    pDeepMix(rst, args[i]);
  }
  return rst;
};

export default deepMix;
