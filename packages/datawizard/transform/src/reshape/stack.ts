import { RowData } from '../util/helper';
import { xor, keys, compact, pick } from 'lodash';

/**
 * Pivot specific field of each values.
 * @public
 * @param {string} field field
 * @param {string} values unstack  values
 * @returns row datas
 */
export function unstack(data: RowData[], field: string, values: string[]): RowData[] {
  if (!values.length) return data;

  const extraCols = compact(xor(keys(data[0]), [...values, field]));
  if (!extraCols.length) return data;

  // 缓存处理过的数据 index
  const cache = new Map<any, number>();

  const result: RowData[] = [];
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const k = getUniqRowKey(item, extraCols);
    if (!cache.has(k)) {
      const length = result.push({ ...pick(item, extraCols) });
      cache.set(k, length - 1);
    }
    const index = cache.get(k);
    if (index !== undefined) {
      const row = result[index];
      const fieldValue = item[field];
      if (row) {
        values.forEach((vf) => {
          row[`${vf}_${fieldValue}`] = item[vf];
        });
      }
    }
  }

  function getUniqRowKey(row: RowData, cols: string[]) {
    return cols.reduce((prev, curr) => prev + `[${curr}:${row[curr]}]`, '');
  }
  return result;
}
