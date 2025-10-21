import _ from 'lodash';

import { DATA_SHAPE } from '@ava/data/constants';

import { matchGraph } from './graph';
import { matchTree } from './tree';
import { matchFlow } from './flow';

/**
 * 推断数据的基础结构
 * @returns
 */
export const matchDataShape = (
  input: Record<string, any> | Record<string, any>[] | any[][]
): {
  shape: DATA_SHAPE;
  format: any;
} => {
  const is2DimArray = Array.isArray(input) && _.every(input, (item) => Array.isArray(item));
  if (is2DimArray) {
    return {
      shape: DATA_SHAPE.PLAIN,
      format: { data: input, columns: _.times(input[0]?.lenght).map((i) => `column_${i}`) },
    };
  }
  const matchTreeRes = matchTree(input);
  if (matchTreeRes.is) {
    return {
      shape: DATA_SHAPE.TREE,
      format: matchTreeRes.format,
    };
  }
  const matchGraphRes = matchGraph(input);
  if (matchGraphRes.is) {
    return {
      shape: DATA_SHAPE.GRAPH,
      format: matchGraphRes.format,
    };
  }
  const matchFlowRes = matchFlow(input);
  if (matchFlowRes.is) {
    return {
      shape: DATA_SHAPE.FLOW,
      format: matchFlowRes.format,
    };
  }

  let columnIndex = 0;
  const rows = [];
  const columnsSet = new Set();
  const columnsIndexMap = new Map<string, number>();
  _.each(input, (record) => {
    const row = [];
    _.each(record, (value, key) => {
      let index = columnsIndexMap.get(key);
      columnsSet.add(key);
      if (_.isNil(index)) {
        index = columnIndex++;
        columnsIndexMap.set(key, index);
      }
      row[index] = value;
    });
    rows.push(row);
  });
  // todo: 需要按长度补齐
  return {
    shape: DATA_SHAPE.PLAIN,
    format: { data: rows, columns: Array.from(columnsSet) },
  };
};
