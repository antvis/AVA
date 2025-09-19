export class DataFrame {
  private data: any[][];

  private columns: string[];

  private rowIndexes: number[];

  private colIndexes: number[];

  constructor(options: { data: any[][]; columns: string[]; rowIndexes?: number[]; colIndexes?: number[] }) {
    const { data, columns, rowIndexes, colIndexes } = options;
    if (data.length > 0 && data[0].length !== columns.length) {
      throw new Error('Data column count does not match columns');
    }

    this.data = data;
    this.columns = [...columns];
    this.rowIndexes = rowIndexes ?? Array.from({ length: data.length }, (_, i) => i);
    this.colIndexes = colIndexes ?? Array.from({ length: columns.length }, (_, i) => i);
  }

  shape(): [number, number] {
    return [this.rowIndexes.length, this.colIndexes.length];
  }

  columnData(key: string): any[] {
    const colIndex = this.columns.indexOf(key);
    if (colIndex === -1) throw new Error(`Column '${key}' not found`);

    return this.rowIndexes.map((rowIdx) => this.data[rowIdx][colIndex]);
  }

  indexData(index: number): Record<string, any> {
    if (index < 0 || index >= this.rowIndexes.length) {
      throw new Error(`Index ${index} out of bounds`);
    }

    const rowData: Record<string, any> = {};
    const actualRowIndex = this.rowIndexes[index];

    this.columns.forEach((col, i) => {
      rowData[col] = this.data[actualRowIndex][i];
    });

    return rowData;
  }

  /**
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

    return new DataFrame({
      data: this.data,
      columns: cols,
      rowIndexes: newRowIndexes,
      colIndexes,
    });
  }

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

  /**
   *
   */
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

  dataAsArray(): any[][] {
    return this.rowIndexes.map((idx) => this.columns.map((col) => this.data[idx][this.columns.indexOf(col)]));
  }

  /**
   * 获取列名
   */
  getColumns(): string[] {
    return [...this.columns];
  }

  /**
   * 获取行索引
   */
  getRowIndexes(): number[] {
    return [...this.rowIndexes];
  }
}
