import _ from 'lodash';

import type { MatchFunction } from './types';

const standardizeNode = (data: any, childKey: string): any[] => {
  const standardizeNodeObject = (obj: any): any => {
    const result = { ...obj };

    if (_.isArray(obj[childKey]) && obj[childKey].length > 0) {
      result.children = standardizeNode(obj, childKey);
      delete result[childKey];
    }

    // 递归处理其他嵌套对象
    _.forOwn(result, (val, key) => {
      if (_.isObjectLike(val) && !_.isArray(val)) {
        result[key] = standardizeNodeObject(val);
      }
    });

    return result;
  };

  return _.map(data[childKey], (item) => {
    if (!_.isObjectLike(item)) return item;

    const newItem: any = { ...item };

    if (_.isArray(item[childKey])) {
      newItem.children = standardizeNode(item, childKey);
    } else if (_.has(item, childKey)) {
      delete newItem[childKey];
    }

    _.forOwn(newItem, (val, k) => {
      if (_.isObjectLike(val) && !_.isArray(val)) {
        newItem[k] = standardizeNodeObject(val);
      }
    });

    return newItem;
  });
};

/**
 * 检测输入是否为树结构，自动识别 childKey 并标准化为 children
 */
export const matchTreeRoot: MatchFunction = (input) => {
  if (!_.isObjectLike(input) || _.isArray(input)) {
    return { is: false, format: { data: [] } };
  }

  const rootKeys = _.keys(input);

  let childKey: string | null = null;

  for (const key of rootKeys) {
    const value = input[key];

    if (_.isArray(value) && value.length > 0) {
      const firstItem = value[0];
      if (_.isObjectLike(firstItem)) {
        const childKeys = _.keys(firstItem);
        if (_.intersection(rootKeys, childKeys).length > 0) {
          childKey = key;
          break; // 找到就退出
        }
      }
    }
  }

  if (!childKey) {
    return { is: false, format: { data: [] } };
  }

  // 开始转换
  const standardizedData = standardizeNode(input, childKey);

  const root = {
    ...input,
    children: standardizedData,
  };

  if (childKey !== 'children') {
    delete root[childKey];
  }

  return {
    is: true,
    format: {
      data: [root],
    },
  };
};

/**
 * @param input
 * @returns
 */
export const matchTree: MatchFunction = (input) => {
  if (_.isArray(input)) {
    const roots = [];
    _.each(input, (record) => {
      const res = matchTreeRoot(record);
      if (res.is) {
        roots.push(...res.format.data);
      }
    });
    return {
      is: roots.length > 0,
      format: {
        data: roots,
      },
    };
  }
  return matchTreeRoot(input);
};
