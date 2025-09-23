import _ from 'lodash';

import { DataStore } from './DataStore';

export class DataFrame {
  readonly dataStore: DataStore;

  // row clipping indexes
  private rowIndexes: number[];

  // column clipping indexes
  private colIndexes: number[];

  constructor(
    store: DataStore,
    options: {
      rowIndexes?: number[];
      colIndexes?: number[];
    }
  ) {
    const { rowIndexes, colIndexes } = options;
    this.dataStore = store;
    this.rowIndexes = rowIndexes ?? Array.from({ length: store.data.length }, (_, i) => i);
    this.colIndexes = colIndexes ?? Array.from({ length: store.data[0]?.length ?? 0 }, (_, i) => i);
  }

  get data() {
    return this.dataStore.data;
  }

  get columns() {
    return this.dataStore.columns;
  }

  get columnsMap() {
    return this.dataStore.columnsMap;
  }

  shape(): [number, number] {
    return [this.rowIndexes.length, this.colIndexes.length];
  }

  /**
   * get column data with column key
   * @param key
   */
  getColumnData(key: string): any[] {
    const res = [];
    const colIndex = this.columnsMap.get(key);
    _.each(this.data, (d) => {
      res.push(d[colIndex]);
    });
    return res;
  }

  getRowData(index: number): Record<string, any> {
    const data = this.data[index];
    const res = {};
    if (!data) {
      return res;
    }
    _.each(data, (d, i) => {
      const colName = this.columns[i];
      res[colName] = d;
    });
    return res;
  }

  /**
   * 对 DataFrame 进行剪裁并返回一个新的 DataFrame，rowIndexes 和 columnIndexes 需要重新排列
   * @return DataFrame
   */
  clip(options: { cols?: string[]; indexes?: number[]; indexRange?: [number, number] }) {
    const { cols = this.columns, indexes = this.colIndexes, indexRange } = options;
    const colIndexes: number[] = [];

    cols.forEach((col) => {
      colIndexes.push(this.columns.indexOf(col));
    });

    let newRowIndexes: number[];
    if (indexes) {
      newRowIndexes = indexes;
    } else if (indexRange) {
      const [start, end] = indexRange;
      newRowIndexes = this.rowIndexes.slice(start, end);
    } else {
      newRowIndexes = this.rowIndexes;
    }

    return new DataFrame(this.dataStore, { rowIndexes: newRowIndexes, colIndexes });
  }

  /**
   * 基于某个维度值来剪裁，返回多个 DataFrame，用于分面分析
   */
  clipByColumns() {}

  /**
   *
   */
  group(keys: string[]): DataFrame[] {
    for (const key of keys) {
      if (!this.columns.includes(key)) {
        throw new Error(`Grouping key '${key}' not found`);
      }
    }

    if (keys.length === 0) {
      return [this];
    }

    return [];
  }

  groupByRecursive(rowIndexes: number[], keys: string[]): Record<string, number[]> {
    if (keys.length === 0) {
      return { '': rowIndexes };
    }

    const [lastKey, ...remainingKeys] = keys.reverse(); // 取最右的 key
    const keyColIndex = this.columns.indexOf(lastKey);

    const map: Record<string, number[]> = {};

    for (const rowIdx of rowIndexes) {
      const cellValue = this.data[rowIdx][keyColIndex];
      const keyStr = String(cellValue);

      if (!map[keyStr]) {
        map[keyStr] = [];
      }
      map[keyStr].push(rowIdx);
    }

    // 如果还有剩余 keys，继续在每个分组内部分组
    if (remainingKeys.length > 0) {
      const result: Record<string, number[]> = {};
      for (const [groupKey, rows] of Object.entries(map)) {
        const subGroups = this.groupByRecursive(rows, remainingKeys.reverse());
        for (const [subKey, subRows] of Object.entries(subGroups)) {
          result[`${groupKey}|${subKey}`] = subRows;
        }
      }
      return result;
    }

    return map;
  }

  /**
   * 分析列，并缓存结果
   */
  analysisColumns() {}
}
