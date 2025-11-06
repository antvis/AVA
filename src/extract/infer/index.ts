import _ from 'lodash';

import { DATA_SHAPE } from '../../types';
import { matchRelation } from './relation';
import { matchHierarchy } from './hierarchy';

/**
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
  let matchResult = matchHierarchy(input);
  if (matchResult.is) {
    return {
      shape: DATA_SHAPE.HIERARCHY,
      format: matchResult.format,
    };
  }
  matchResult = matchRelation(input);
  if (matchResult.is) {
    return {
      shape: DATA_SHAPE.RELATION,
      format: matchResult.format,
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
  return {
    shape: DATA_SHAPE.PLAIN,
    format: { data: rows, columns: Array.from(columnsSet) },
  };
};
