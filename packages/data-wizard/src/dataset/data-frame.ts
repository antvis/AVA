import { analyzeField } from '../analyzer';
import { isArray, isObject, isString, isInteger, isNumber, isBasicType, range, assert } from '../utils';
import BaseFrame from './base-frame';
import Series from './series';
import { generateArrayIndex, isAxis, fillMissingValue, generateSplit, stringify, getStringifyLength } from './utils';
import type { FrameData, Axis, Extra, FieldsInfo } from './types';

/** 2D data structure */
export default class DataFrame extends BaseFrame {
  constructor(data: FrameData, extra?: Extra) {
    super(data, extra);

    this.colData = [];

    assert(isBasicType(data) || isArray(data) || isObject(data), 'Data type is illegal');

    if (isBasicType(data)) {
      if (extra?.indexes && extra?.columns) {
        this.setAxis(1, extra?.columns);
        this.data = Array(extra?.columns.length).fill(this.data);
      } else if (!extra?.columns) {
        this.setAxis(1, [0]);
        this.data = [this.data];
      } else if (!extra?.indexes) {
        assert(isArray(extra?.columns), 'Index or columns must be Axis array.');
        assert(
          extra?.columns.length === 1,
          'When the length of extra?.columns is larger than 1, extra?.indexes is required.'
        );
      }

      this.colData = this.data;
    }

    if (isArray(data)) {
      const [data0] = data;

      /** 1D: basic type | array */
      if (this.data.length > 0) {
        this.generateColumns([0], extra?.columns);
        this.colData = [this.data];
        this.data = this.data.map((datum) => [datum]);
      }

      /**
       * 2D: array
       * Baseframe has made the first round of judgment. Now, if data0 is array, all the datum is array.
       */
      if (isArray(data0)) {
        const columns = range(data0.length);
        this.generateDataAndColDataFromArray(false, data, columns, extra?.fillValue);
        this.generateColumns(columns, extra?.columns);
      }

      /** 2D: object array */
      if (isObject(data0)) {
        const keys: string[] = [];

        for (let i = 0; i < data.length; i += 1) {
          const datum = data[i];
          keys.push(...Object.keys(datum));
        }

        const columns: Axis[] = [...new Set(keys)];

        for (let i = 0; i < data.length; i += 1) {
          const datum = data[i];

          assert(isObject(datum), 'The data is not standard object array.');

          // slice
          if (extra?.columns) {
            this.data[i] = [];
            for (let j = 0; j < extra?.columns.length; j += 1) {
              const column = extra?.columns[j];
              assert(columns.includes(column), `There is no column ${column} in data.`);

              const newDatum = fillMissingValue(datum[column], extra.fillValue);
              this.data[i].push(newDatum);

              if (this.colData[j]) {
                this.colData[j].push(newDatum);
              } else {
                this.colData[j] = [newDatum];
              }
            }
            this.setAxis(1, extra?.columns);
          }
        }

        if (!extra?.columns) {
          this.generateDataAndColDataFromArray(true, data, columns, extra?.fillValue);
          this.setAxis(1, columns);
        }
      }
    }

    if (isObject(data)) {
      const dataValues = Object.values(data);
      const [data0] = dataValues;

      /** 1D: object */
      if (isBasicType(data0)) {
        const columns = Object.keys(data);

        if (extra?.indexes) {
          assert(isArray(extra.indexes), 'extra.indexes must be an array.');
          assert(extra.indexes.length === 1, 'The length of extra.indexes must be 1.');

          this.setAxis(0, extra.indexes);
        } else {
          this.setAxis(0, [0]);
        }

        if (extra?.columns) {
          for (let i = 0; i < extra?.columns.length; i += 1) {
            const column = extra?.columns[i] as string;

            assert(columns.includes(column), `There is no column ${column} in data.`);

            this.data.push(fillMissingValue(data[column], extra?.fillValue));
          }
          this.colData = this.data.map((datum) => [datum]);
          this.data = [this.data];
          this.setAxis(1, extra?.columns);
        } else {
          for (let i = 0; i < columns.length; i += 1) {
            const datum = data[columns[i]];

            assert(isBasicType(datum), 'Data type is illegal');

            this.data.push(fillMissingValue(datum, extra?.fillValue));
          }
          this.data = [this.data];
          this.colData = dataValues.map((datum) => [fillMissingValue(datum, extra?.fillValue)]);
          this.generateColumns(columns);
        }
      }

      /** 2D: array object */
      if (isArray(data0)) {
        this.setAxis(0, generateArrayIndex(data0, extra?.indexes));
        const columns = Object.keys(data);
        this.generateColumns(columns, extra?.columns);

        for (let i = 0; i < this.columns.length; i += 1) {
          const datum = data[this.columns[i]];

          assert(isArray(datum), 'Data type is illegal');

          // Fill the missing values
          if (datum.length < this.indexes.length) {
            const newDatum = datum.concat(
              Array(this.indexes.length - datum.length).fill(fillMissingValue(undefined, extra?.fillValue))
            );
            this.colData.push(newDatum);
          } else {
            this.colData.push(datum.map((d) => fillMissingValue(d, extra?.fillValue)));
          }

          for (let j = 0; j < this.indexes.length; j += 1) {
            if (this.data[j]) {
              this.data[j].push(fillMissingValue(datum[j], extra?.fillValue));
            } else {
              this.data[j] = [fillMissingValue(datum[j], extra?.fillValue)];
            }
          }
        }
      }
    }
  }

  /**
   * Generate columns.
   * @param columns
   * @param extra
   */
  private generateColumns(columns: Axis[], extraColumns?: Axis[]) {
    if (extraColumns) {
      assert(
        extraColumns?.length === columns.length,
        `Columns length is ${extraColumns?.length}, but data column is ${columns.length}`
      );

      this.setAxis(1, extraColumns);
    } else {
      this.setAxis(1, columns);
    }
  }

  /**
   * Generate this.data and this.colData.
   * @param isObj
   * @param data
   * @param columns
   */
  private generateDataAndColDataFromArray(
    isObj: boolean,
    data: any[],
    columns: Axis[],
    fillValue?: Extra['fillValue']
  ) {
    for (let i = 0; i < data.length; i += 1) {
      const datum = data[i];

      assert(isObj ? isObject(datum) : isArray(datum), 'Data type is illegal');

      if (isObj && JSON.stringify(Object.keys(datum)) === JSON.stringify(columns)) {
        this.data.push(Object.values(datum).map((d) => fillMissingValue(d, fillValue)));
      } else if (!isObj) {
        this.data.push(datum.map((datum) => fillMissingValue(datum, fillValue)));
      }

      for (let j = 0; j < columns.length; j += 1) {
        const column = columns[j];
        const newDatum = fillMissingValue(datum[column], fillValue);

        // Fill the missing values
        if (isObj && JSON.stringify(Object.keys(datum)) !== JSON.stringify(columns)) {
          if (this.data[i]) {
            this.data[i].push(newDatum);
          } else {
            this.data[i] = [newDatum];
          }
        }

        if (this.colData[j]) {
          this.colData[j].push(newDatum);
        } else {
          this.colData[j] = [newDatum];
        }
      }
    }
  }

  get shape(): [number, number] {
    return [this.axes[0].length, (this.axes[1] as Axis[]).length];
  }

  get(rowLoc: Axis | Axis[] | string, colLoc?: Axis | Axis[] | string): DataFrame | Series | any {
    assert(isAxis(rowLoc) || isArray(rowLoc), 'The rowLoc is illegal');

    /** colLoc does not exist */
    if (colLoc === undefined) {
      // input is like 1
      if (isNumber(rowLoc)) {
        assert(this.indexes.includes(rowLoc), 'The rowLoc is not found in the indexes.');

        if (this.indexes.includes(rowLoc)) {
          const newData = this.data[rowLoc];
          const newIndex = this.columns;
          return new Series(newData, { indexes: newIndex });
        }
      } else if (isArray(rowLoc)) {
        // input is like [0, 1, 2]
        const newData: any[] = [];
        const newIndex: Axis[] = [];
        for (let i = 0; i < rowLoc.length; i += 1) {
          const loc = rowLoc[i];

          assert(this.indexes.includes(loc), 'The rowLoc is not found in the indexes.');

          const idxInIndex = this.indexes.indexOf(loc);
          newData.push(this.data[idxInIndex]);
          newIndex.push(this.indexes[idxInIndex]);
        }
        return new DataFrame(newData, { indexes: newIndex, columns: this.columns });
      } else if (isString(rowLoc) && rowLoc.includes(':')) {
        // input is like '0:2'
        const rowLocArr = rowLoc.split(':');
        if (rowLocArr.length === 2) {
          const startRowIdx = Number(rowLocArr[0]);
          const endRowIdx = Number(rowLocArr[1]);

          assert(isNumber(startRowIdx) && isNumber(endRowIdx), 'The rowLoc is not found in the indexes.');

          const newData = this.data.slice(startRowIdx, endRowIdx);
          const newIndex = this.indexes.slice(startRowIdx, endRowIdx);
          return new DataFrame(newData, { indexes: newIndex, columns: this.columns });
        }
      }
    }

    /** colLoc exists */
    let startRowIdx = -1;
    let endRowIdx = -1;
    const rowIdxes = [];
    let startColIdx = -1;
    let endColIdx = -1;
    const colIdxes = [];

    // rowLoc is Axis
    if (isAxis(rowLoc) && this.indexes.includes(rowLoc)) {
      startRowIdx = this.indexes.indexOf(rowLoc);
      endRowIdx = startRowIdx + 1;
    }

    // rowLoc is Axis[]
    if (isArray(rowLoc)) {
      for (let i = 0; i < rowLoc.length; i += 1) {
        const rowIdx = rowLoc[i];

        assert(this.indexes.includes(rowIdx), 'The rowLoc is not found in the indexes.');

        rowIdxes.push(this.indexes.indexOf(rowIdx));
      }
    }

    // rowLoc is slice
    if (isString(rowLoc) && rowLoc.includes(':')) {
      const rowLocArr = rowLoc.split(':');
      if (rowLocArr.length === 2) {
        const start = Number(rowLocArr[0]);
        const end = Number(rowLocArr[1]);

        assert(isNumber(start) && isNumber(end), 'The rowLoc is not found in the indexes.');

        startRowIdx = start;
        endRowIdx = end;
      }
    }

    // colLoc is Axis
    if (isAxis(colLoc) && this.columns.includes(colLoc)) {
      startColIdx = this.columns.indexOf(colLoc);
      endColIdx = startColIdx + 1;
    }

    // colLoc is Axis[]
    if (isArray(colLoc)) {
      for (let i = 0; i < colLoc.length; i += 1) {
        const colIdx = colLoc[i];

        assert(this.columns.includes(colIdx), 'The colLoc is not found in the columns.');

        colIdxes.push(this.columns.indexOf(colIdx));
      }
    }

    // colLoc is slice
    if (isString(colLoc) && colLoc.includes(':')) {
      const colLocArr = colLoc.split(':');
      if (colLocArr.length === 2) {
        const start = this.columns.indexOf(colLocArr[0]);
        const end = this.columns.indexOf(colLocArr[1]);

        assert(isNumber(start) && isNumber(end), 'The colLoc is not found in the columns.');

        startColIdx = start;
        endColIdx = end;
      }
    }

    // build new data and indexes
    let newData: any[][] = [];
    let newIndex: any[] = [];

    assert((startRowIdx >= 0 && endRowIdx >= 0) || rowIdxes.length > 0, 'The rowLoc is not found in the indexes.');

    if (startRowIdx >= 0 && endRowIdx >= 0) {
      newData = this.data.slice(startRowIdx, endRowIdx);
      newIndex = this.indexes.slice(startRowIdx, endRowIdx);
    }

    if (rowIdxes.length > 0) {
      for (let i = 0; i < rowIdxes.length; i += 1) {
        const rowIdx = rowIdxes[i];
        newData.push(this.data[rowIdx]);
        newIndex.push(this.indexes[rowIdx]);
      }
    }

    // build new columns
    if (startColIdx >= 0 && endColIdx >= 0) {
      for (let i = 0; i < newData.length; i += 1) {
        newData[i] = newData[i].slice(startColIdx, endColIdx);
      }
      const newColumns = this.columns.slice(startColIdx, endColIdx);
      return new DataFrame(newData, { indexes: newIndex, columns: newColumns });
    }

    if (colIdxes.length > 0) {
      let newColumns: Axis[] = [];
      const tempData = newData.slice();
      for (let i = 0; i < newData.length; i += 1) {
        newData[i] = [];
        newColumns = [];
        for (let j = 0; j < colIdxes.length; j += 1) {
          const colIdx = colIdxes[j];
          newData[i].push(tempData[i][colIdx]);
          newColumns.push(this.columns[colIdx]);
        }
      }
      return new DataFrame(newData, { indexes: newIndex, columns: newColumns });
    }

    throw new Error('The colLoc is illegal.');
  }

  getByIndex(rowLoc: number | number[] | string, colLoc?: number | number[] | string): DataFrame | Series | any {
    assert(isInteger(rowLoc) || isArray(rowLoc) || isString(rowLoc), 'The rowLoc is illegal');

    /** colLoc does not exist */
    if (colLoc === undefined) {
      // input is like 1
      if (isInteger(rowLoc)) {
        assert(range(this.indexes.length).includes(rowLoc), 'The rowLoc is not found in the indexes.');

        const newData = this.data[rowLoc];
        const newIndex = this.columns;
        return new Series(newData, { indexes: newIndex });
      }

      if (isArray(rowLoc)) {
        // input is like [0, 1, 2]
        const newData: any[] = [];
        const newIndex: Axis[] = [];
        for (let i = 0; i < rowLoc.length; i += 1) {
          const idx = rowLoc[i];

          assert(range(this.indexes.length).includes(idx), 'The rowLoc is not found in the indexes.');

          newData.push(this.data[idx]);
          newIndex.push(this.indexes[idx]);
        }
        return new DataFrame(newData, { indexes: newIndex, columns: this.columns });
      }

      if (isString(rowLoc) && rowLoc.includes(':')) {
        // input is like '0:2'
        const rowLocArr = rowLoc.split(':');
        if (rowLocArr.length === 2) {
          const startRowIdx = Number(rowLocArr[0]);
          const endRowIdx = Number(rowLocArr[1]);

          assert(isInteger(startRowIdx) && isInteger(endRowIdx), 'The rowLoc is not found in the indexes.');

          const newData = this.data.slice(startRowIdx, endRowIdx);
          const newIndex = this.indexes.slice(startRowIdx, endRowIdx);
          return new DataFrame(newData, { indexes: newIndex, columns: this.columns });
        }
      }
    }

    /** colLoc exists */
    let startRowIdx = -1;
    let endRowIdx = -1;
    const rowIdxes = [];
    let startColIdx = -1;
    let endColIdx = -1;
    const colIdxes = [];

    // rowLoc is int
    if (isInteger(rowLoc)) {
      assert(range(this.indexes.length).includes(rowLoc), 'The rowLoc is not found in the indexes.');

      startRowIdx = rowLoc;
      endRowIdx = rowLoc + 1;
    }

    // rowLoc is int[]
    if (isArray(rowLoc)) {
      for (let i = 0; i < rowLoc.length; i += 1) {
        const rowIdx = rowLoc[i];

        assert(range(this.indexes.length).includes(rowIdx), 'The rowLoc is not found in the indexes.');

        rowIdxes.push(rowIdx);
      }
    }

    // rowLoc is slice
    if (isString(rowLoc) && rowLoc.includes(':')) {
      const rowLocArr = rowLoc.split(':');
      if (rowLocArr.length === 2) {
        const start = Number(rowLocArr[0]);
        const end = Number(rowLocArr[1]);

        assert(isInteger(start) && isInteger(end), 'The rowLoc is not found in the indexes.');

        startRowIdx = start;
        endRowIdx = end;
      }
    }

    assert((startRowIdx >= 0 && endRowIdx >= 0) || rowIdxes.length > 0, 'The colLoc is illegal');

    // colLoc is int
    if (isInteger(colLoc) && range(this.columns.length).includes(colLoc)) {
      startColIdx = colLoc;
      endColIdx = colLoc + 1;
    }

    // colLoc is int[]
    if (isArray(colLoc)) {
      for (let i = 0; i < colLoc.length; i += 1) {
        const colIdx = colLoc[i];

        assert(range(this.columns.length).includes(colIdx), 'The colLoc is not found in the columns index.');

        colIdxes.push(colIdx);
      }
    }

    // colLoc is slice
    if (isString(colLoc) && colLoc.includes(':')) {
      const colLocArr = colLoc.split(':');
      if (colLocArr.length === 2) {
        const start = Number(colLocArr[0]);
        const end = Number(colLocArr[1]);

        assert(isInteger(start) && isInteger(end), 'The colLoc is not found in the columns index.');

        startColIdx = start;
        endColIdx = end;
      }
    }

    assert((startRowIdx >= 0 && endRowIdx >= 0) || rowIdxes.length > 0, 'The rowLoc is not found in the indexes.');

    // build new data and indexes
    let newData: any[][] = [];
    let newIndex: any[] = [];

    if (startRowIdx >= 0 && endRowIdx >= 0) {
      newData = this.data.slice(startRowIdx, endRowIdx);
      newIndex = this.indexes.slice(startRowIdx, endRowIdx);
    } else if (rowIdxes.length > 0) {
      for (let i = 0; i < rowIdxes.length; i += 1) {
        const rowIdx = rowIdxes[i];
        newData.push(this.data[rowIdx]);
        newIndex.push(this.indexes[rowIdx]);
      }
    }

    assert(
      (startColIdx >= 0 && endColIdx >= 0) || colIdxes.length > 0,
      'The colLoc is not found in the columns index.'
    );

    // build new columns
    if (startColIdx >= 0 && endColIdx >= 0) {
      for (let i = 0; i < newData.length; i += 1) {
        newData[i] = newData[i].slice(startColIdx, endColIdx);
      }
      const newColumns = this.columns.slice(startColIdx, endColIdx);
      return new DataFrame(newData, { indexes: newIndex, columns: newColumns });
    }

    if (colIdxes.length > 0) {
      let newColumns: Axis[] = [];
      const tempData = newData.slice();
      for (let i = 0; i < newData.length; i += 1) {
        newData[i] = [];
        newColumns = [];
        for (let j = 0; j < colIdxes.length; j += 1) {
          const colIdx = colIdxes[j];
          newData[i].push(tempData[i][colIdx]);
          newColumns.push(this.columns[colIdx]);
        }
      }
      return new DataFrame(newData, { indexes: newIndex, columns: newColumns });
    }

    throw new Error('The colLoc is illegal.');
  }

  /**
   * Get data by column.
   * @param col
   */
  getByColumn(col: Axis): Series {
    assert(this.columns.includes(col), 'The col is illegal');

    const colIdx = this.columns.indexOf(col);
    return new Series(this.colData[colIdx], {
      indexes: this.indexes,
    });
  }

  /**
   * Get statistics.
   */
  info(): FieldsInfo {
    const fields: FieldsInfo = [];
    for (let i = 0; i < this.columns?.length; i += 1) {
      const column = this.columns[i];
      fields.push({ ...analyzeField(this.colData[i]), name: String(column) });
    }
    return fields;
  }

  /**
   * Get tabular data string.
   */
  toString(): string {
    // Calculate the longest field length for each column, add two spaces to get the split
    const maxLengths = Array(this.columns.length + 1).fill(0);
    for (let i = 0; i < this.indexes.length; i += 1) {
      const len = getStringifyLength(this.indexes[i]);
      if (len > maxLengths[0]) maxLengths[0] = len;
    }
    for (let i = 0; i < this.columns.length; i += 1) {
      // Contain escape characters' length
      const len = getStringifyLength(this.columns[i]);
      if (len > maxLengths[i + 1]) maxLengths[i + 1] = len;
    }
    for (let i = 0; i < this.colData.length; i += 1) {
      for (let j = 0; j < this.colData[i].length; j += 1) {
        const len = getStringifyLength(this.colData[i][j]);
        if (len > maxLengths[i + 1]) maxLengths[i + 1] = len;
      }
    }

    return `${generateSplit(maxLengths[0])}${this.columns
      .map(
        (col, i) =>
          // JSON.stringify will add "" to string, it's two extra characters.
          `${col}${i !== this.columns.length ? generateSplit(maxLengths[i + 1] - getStringifyLength(col) + 2) : ''}`
      )
      .join('')}\n${this.indexes
      .map(
        (idx, idxIndex) =>
          `${idx}${generateSplit(maxLengths[0] - getStringifyLength(idx))}${this.data[idxIndex]
            ?.map(
              (datum, i) =>
                `${stringify(datum)}${
                  i !== this.columns.length ? generateSplit(maxLengths[i + 1] - getStringifyLength(datum)) : ''
                }`
            )
            .join('')}${idxIndex !== this.indexes.length ? '\n' : ''}`
      )
      .join('')}`;
  }
}
