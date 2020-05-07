import { groupBy } from '@antv/util';
import { RowData } from './helper';

export function partition(
  rows: RowData[],
  groupby?: string | string[] | ((item: RowData) => any),
  orderby?: string | string[] | ((item: RowData) => any)
): Record<string, RowData[]> {
  let sortFn: undefined | ((left: RowData, right: RowData) => number) = undefined;
  if (typeof orderby === 'function') {
    const key = orderby;
    sortFn = (left: RowData, right: RowData): number => {
      if (key(left) > key(right)) return 1;
      if (key(left) < key(right)) return -1;
      return 0;
    };
  } else {
    const keys = typeof orderby === 'string' ? [orderby] : orderby;
    if (Array.isArray(keys) && keys.length > 0) {
      sortFn = (left: RowData, right: RowData) => {
        for (const field of keys) {
          if (left[field] > right[field]) return 1;
          if (left[field] < right[field]) return -1;
        }
        return 0;
      };
    }
  }
  const newRows = sortFn ? [...rows].sort(sortFn) : [...rows];
  let groupingFn: (row: RowData) => any = () => '_';
  if (typeof groupby === 'function') {
    groupingFn = groupby;
  } else if (Array.isArray(groupby) && groupby.length > 0) {
    groupingFn = (row: RowData) => `_${groupby.map((col) => row[col]).join('-')}`;
    // NOTE: Object.keys({'b': 'b', '2': '2', '1': '1', 'a': 'a'}) => [ '1', '2', 'b', 'a' ]
    // that is why we have to add a prefix
  } else if (typeof groupby === 'string') {
    groupingFn = (row: RowData) => `_${row[groupby]}`;
  }
  return groupBy(newRows, groupingFn);
}
