import _ from 'lodash';

import { DATA_SHAPE } from '@ava/data/constants';
import { kmeans, normalizedVectorVariance } from '@ava/data/utils';

type MatchFuntion = (input: Record<string, any> | Record<string, any>[]) => { is: boolean; format: any };

const oneHotEncodeKeys = (arr: Record<string, any>[]) => {
  const keyMap = new Map();
  let keyIndex = 0;
  let encodes: number[][] = [];
  _.each(arr, (record) => {
    const keys = _.keys(record).sort();
    // one-hot encode the keys
    const encode = [];
    _.each(keys, (key) => {
      if (keyMap.has(key)) {
        encode[keyMap.get(key)] = 1;
      } else {
        keyMap.set(key, keyIndex);
        encode[keyIndex] = 1;
        keyIndex++;
      }
    });
    encodes.push(encode);
  });
  encodes = encodes.map((encode) => {
    const padencode = encode.concat(_.times(keyIndex, () => 0)).slice(0, 8);
    return Array.from(padencode, (v) => v || 0);
  });
  return encodes;
};

/**
 * 匹配树形数据，并将其转化为标准树状结构
 * @param input
 * @returns
 */
export const matchTree: MatchFuntion = (input) => {
  let isTree = false;
  const roots = [];
  // let childKey = 'children';
  if (_.isArray(input)) {
    // array like, todo
    isTree = _.some(input, (record) => {
      return matchTree(record);
    });
    if (!isTree) {
      // 判断是否是多元素关联的树,todo
      isTree = false;
    }
  } else {
    // is root node
    const rootKeys = _.keys(input);
    isTree = _.some(input, (value) => {
      if (_.isArray(value)) {
        const child = value[0];
        if (_.isObjectLike(child)) {
          const childKeys = _.keys(child);
          return _.intersection(rootKeys, childKeys).length > 0;
        }
      }
      return false;
    });
  }
  return {
    is: isTree,
    format: {
      data: roots,
    },
  };
};

/**
 * 判断是否是图数据
 * @param input
 * @returns
 */
export const matchGraph: MatchFuntion = (input) => {
  let is = false;
  if (_.isArray(input)) {
    const encodes = oneHotEncodeKeys(input);
    const cluster = kmeans(encodes, 2);
    is = _.every(cluster.variances, (v) => v < 0.1);
  } else {
    let arrayCount = 0;
    const arrs = [];
    _.each(input, (value) => {
      if (_.isArray(value)) {
        arrayCount++;
        arrs.push(value);
      }
      if (arrayCount > 2) return false;
      return true;
    });
    if (arrayCount !== 2) {
      is = false;
    } else {
      is = _.every(arrs, (arr) => {
        const encodes = oneHotEncodeKeys(arr);
        const variance = normalizedVectorVariance(encodes);
        return variance < 0.1;
      });
    }
  }
  return {
    is,
    format: {
      // stardard graph data
      data: {
        nodes: [],
        links: [],
      },
    },
  };
};

export const matchFlow: MatchFuntion = (input) => {
  const matchRes = matchGraph(input);
  const { is } = matchRes;
  // 根据图的特性判断是否是流程数据
  return {
    is,
    format: {
      data: {
        nodes: [],
        links: [],
      },
    },
  };
};

/**
 * 推断数据的基础结构
 * @returns
 */
export const inferDataShape = (
  input: Record<string, any> | Record<string, any>[] | any[][]
): {
  shape: DATA_SHAPE;
  format: any;
} => {
  let shape = DATA_SHAPE.PLAIN;
  let format: any = {};
  const is2DimArray = Array.isArray(input) && _.every(input, (item) => Array.isArray(item));
  if (is2DimArray) {
    shape = DATA_SHAPE.PLAIN;
    // todo: 将 input 转化成二维数组，并且抽取 columns
    format = { data: input, columns: [] };
  } else {
    const matchTreeRes = matchTree(input);
    if (matchTreeRes.is) {
      shape = DATA_SHAPE.TREE;
      format = matchTreeRes.format;
    } else {
      const matchGraphRes = matchGraph(input);
      if (matchGraphRes.is) {
        shape = DATA_SHAPE.GRAPH;
        format = matchGraphRes.format;
      } else {
        const matchFlowRes = matchFlow(input);
        if (matchFlowRes.is) {
          shape = DATA_SHAPE.FLOW;
          format = matchFlowRes.format;
        }
      }
    }
  }
  return {
    shape,
    format,
  };
};
