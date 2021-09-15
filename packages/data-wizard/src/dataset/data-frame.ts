import { analyzeField } from '../analyzer';
import { isArray, isObject, isString, isInteger, isNumber, range } from '../utils';
import BaseFrame from './base-frame';
import Series from './series';
import { isLegalBasicType, generateArrayIndex, isAxis } from './utils';
import type { FrameData, Axis, Extra, FieldsInfo } from './types';

/** 2D data structure */
export default class DataFrame extends BaseFrame {
  constructor(data: FrameData, extra?: Extra) {
    super(data, extra);

    if (isObject(extra) && !extra.index && !extra.columns && Object.keys(extra).length > 0) {
      throw new Error("The extra of DataFrame only owns 'index' and 'columns' properties");
    }

    if (isArray(data)) {
      const [data0] = data;
      // 1D: array
      if (this.data.length > 0) {
        this.generateColumns([0]);
      }

      // 2D: object in array
      if (isObject(data0)) {
        const columns: Axis[] = Object.keys(data0);
        // slice
        if (extra?.columns && extra?.columns.length < columns.length) {
          for (let i = 0; i < data.length; i += 1) {
            const datum = data[i];
            this.data[i] = [];
            for (let j = 0; j < extra.columns.length; j += 1) {
              const column = extra.columns[j];
              if (columns.includes(column)) {
                this.data[i].push(datum[column]);
              } else {
                throw new Error(`There is no column ${column} in data.`);
              }

              if (this.colData[j]) {
                this.colData[j].push(datum[column]);
              } else {
                this.colData[j] = [datum[column]];
              }
            }
          }

          this.setAxis(1, extra.columns);
        } else {
          this.generateDataAndColDataFromArray(true, data, columns);
          this.generateColumns(columns, extra);
        }
      }

      // 2D: array
      if (isArray(data0)) {
        const columns = range(data0.length);
        this.generateDataAndColDataFromArray(false, data, columns);
        this.generateColumns(columns, extra);
      }
    } else if (isObject(data)) {
      const [data0] = Object.values(data);

      // 1D: object
      if (isLegalBasicType(data0)) {
        this.setAxis(0, [0]);

        const columns = Object.keys(data);
        this.generateColumns(columns, extra);

        for (let i = 0; i < columns.length; i += 1) {
          const datum = data[columns[i]];

          if (!isLegalBasicType(datum)) throw new Error('Data type is illegal');

          this.data.push(datum);
        }
        this.colData = Object.values(data);
      }

      // 2D: array in object
      if (isArray(data0)) {
        this.setAxis(0, generateArrayIndex(data0, extra));
        const columns = Object.keys(data);
        this.generateColumns(columns, extra);

        for (let i = 0; i < columns.length; i += 1) {
          const datum = data[columns[i]];

          if (!isArray(datum)) throw new Error('Data type is illegal');

          this.colData.push(datum);
          for (let j = 0; j < this.index.length; j += 1) {
            if (this.data[j]) {
              this.data[j].push(datum[j]);
            } else {
              this.data[j] = [datum[j]];
            }
          }
        }
      }
    } else {
      throw new Error('Data type is illegal');
    }
  }

  /**
   * Generate columns.
   * @param columns
   * @param extra
   */
  private generateColumns(columns: Axis[], extra?: Extra) {
    if (extra?.columns) {
      if (extra.columns?.length === columns.length) {
        this.setAxis(1, extra.columns);
      } else {
        throw new Error(`Columns length is ${extra.columns?.length}, but data size is ${columns.length}`);
      }
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
  private generateDataAndColDataFromArray(isObj: boolean, data: any[], columns: Axis[]) {
    for (let i = 0; i < data.length; i += 1) {
      const datum = data[i];

      if (isObj ? !isObject(datum) : !isArray(datum)) throw new Error('Data type is illegal');

      this.data.push(isObj ? Object.values(datum) : datum);
      for (let j = 0; j < columns.length; j += 1) {
        const column = columns[j];
        if (this.colData[j]) {
          this.colData[j].push(datum[column]);
        } else {
          this.colData[j] = [datum[column]];
        }
      }
    }
  }

  get shape(): [number, number] {
    return [this.axes[0].length, (this.axes[1] as Axis[]).length];
  }

  get(rowLoc: Axis | Axis[] | string, colLoc?: Axis | Axis[] | string): DataFrame | Series | any {
    if (isAxis(rowLoc) || isArray(rowLoc)) {
      /** colLoc does not exist */
      if (colLoc === undefined) {
        // input is like 1
        if (isNumber(rowLoc)) {
          if (this.index.includes(rowLoc)) {
            const newData = this.data[rowLoc];
            const newIndex = this.columns;
            return new Series(newData, { index: newIndex });
          }
          throw new Error('The rowLoc is not found in the index.');
        } else if (isArray(rowLoc)) {
          // input is like [0, 1, 2]
          const newData: any[] = [];
          const newIndex: Axis[] = [];
          for (let i = 0; i < rowLoc.length; i += 1) {
            const loc = rowLoc[i];
            if (!this.index.includes(loc)) {
              throw new Error('The rowLoc is not found in the index.');
            }
            const idxInIndex = this.index.indexOf(loc);
            newData.push(this.data[idxInIndex]);
            newIndex.push(this.index[idxInIndex]);
          }
          return new DataFrame(newData, { index: newIndex, columns: this.columns });
        } else if (isString(rowLoc) && rowLoc.includes(':')) {
          // input is like '0:2'
          const rowLocArr = rowLoc.split(':');
          if (rowLocArr.length === 2) {
            const startRowIdx = Number(rowLocArr[0]);
            const endRowIdx = Number(rowLocArr[1]);
            if (isNumber(startRowIdx) && isNumber(endRowIdx)) {
              const newData = this.data.slice(startRowIdx, endRowIdx);
              const newIndex = this.index.slice(startRowIdx, endRowIdx);
              return new DataFrame(newData, { index: newIndex, columns: this.columns });
            }
            throw new Error('The rowLoc is not found in the index.');
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
      if (isAxis(rowLoc) && this.index.includes(rowLoc)) {
        startRowIdx = this.index.indexOf(rowLoc);
        endRowIdx = startRowIdx + 1;
      }

      // rowLoc is Axis[]
      if (isArray(rowLoc)) {
        for (let i = 0; i < rowLoc.length; i += 1) {
          const rowIdx = rowLoc[i];
          if (!this.index.includes(rowIdx)) {
            throw new Error('The rowLoc is not found in the index.');
          }
          rowIdxes.push(this.index.indexOf(rowIdx));
        }
      }

      // rowLoc is slice
      if (isString(rowLoc) && rowLoc.includes(':')) {
        const rowLocArr = rowLoc.split(':');
        if (rowLocArr.length === 2) {
          const start = Number(rowLocArr[0]);
          const end = Number(rowLocArr[1]);
          if (isNumber(start) && isNumber(end)) {
            startRowIdx = start;
            endRowIdx = end;
          } else {
            throw new Error('The rowLoc is not found in the index.');
          }
        }
      }

      if ((startRowIdx >= 0 && endRowIdx >= 0) || rowIdxes.length > 0) {
        // colLoc is Axis
        if (isAxis(colLoc) && this.columns.includes(colLoc)) {
          startColIdx = this.columns.indexOf(colLoc);
          endColIdx = startColIdx + 1;
        }

        // colLoc is Axis[]
        if (isArray(colLoc)) {
          for (let i = 0; i < colLoc.length; i += 1) {
            const colIdx = colLoc[i];
            if (!this.columns.includes(colIdx)) {
              throw new Error('The colLoc is not found in the columns index.');
            }
            colIdxes.push(this.columns.indexOf(colIdx));
          }
        }

        // colLoc is slice
        if (isString(colLoc) && colLoc.includes(':')) {
          const colLocArr = colLoc.split(':');
          if (colLocArr.length === 2) {
            const start = this.columns.indexOf(colLocArr[0]);
            const end = this.columns.indexOf(colLocArr[1]);
            if (isNumber(start) && isNumber(end)) {
              startColIdx = start;
              endColIdx = end;
            } else {
              throw new Error('The colLoc is not found in the columns index.');
            }
          }
        }

        // build new data and index
        let newData: any[][] = [];
        let newIndex: any[] = [];

        if (startRowIdx >= 0 && endRowIdx >= 0) {
          newData = this.data.slice(startRowIdx, endRowIdx);
          newIndex = this.index.slice(startRowIdx, endRowIdx);
        } else if (rowIdxes.length > 0) {
          for (let i = 0; i < rowIdxes.length; i += 1) {
            const rowIdx = rowIdxes[i];
            newData.push(this.data[rowIdx]);
            newIndex.push(this.index[rowIdx]);
          }
        } else {
          throw new Error('The rowLoc is not found in the index.');
        }
        // build new columns
        if (startColIdx >= 0 && endColIdx >= 0) {
          for (let i = 0; i < newData.length; i += 1) {
            newData[i] = newData[i].slice(startColIdx, endColIdx);
          }
          const newColumns = this.columns.slice(startColIdx, endColIdx);
          return new DataFrame(newData, { index: newIndex, columns: newColumns });
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
          return new DataFrame(newData, { index: newIndex, columns: newColumns });
        }
        throw new Error('The colLoc is not found in the columns index.');
      }

      throw new Error('The colLoc is illegal');
    }
    throw new Error('The rowLoc is illegal');
  }

  getByIntegerIndex(rowLoc: number | number[] | string, colLoc?: number | number[] | string): DataFrame | Series | any {
    if (isInteger(rowLoc) || isArray(rowLoc) || isString(rowLoc)) {
      /** colLoc does not exist */
      if (colLoc === undefined) {
        // input is like 1
        if (isInteger(rowLoc)) {
          if (range(this.index.length).includes(rowLoc)) {
            const newData = this.data[rowLoc];
            const newIndex = this.columns;
            return new Series(newData, { index: newIndex });
          }
          throw new Error('The rowLoc is not found in the index.');
        } else if (isArray(rowLoc)) {
          // input is like [0, 1, 2]
          const newData: any[] = [];
          const newIndex: Axis[] = [];
          for (let i = 0; i < rowLoc.length; i += 1) {
            const idx = rowLoc[i];
            if (!range(this.index.length).includes(idx)) {
              throw new Error('The rowLoc is not found in the index.');
            }
            newData.push(this.data[idx]);
            newIndex.push(this.index[idx]);
          }
          return new DataFrame(newData, { index: newIndex, columns: this.columns });
        } else if (isString(rowLoc) && rowLoc.includes(':')) {
          // input is like '0:2'
          const rowLocArr = rowLoc.split(':');
          if (rowLocArr.length === 2) {
            const startRowIdx = Number(rowLocArr[0]);
            const endRowIdx = Number(rowLocArr[1]);
            if (isInteger(startRowIdx) && isInteger(endRowIdx)) {
              const newData = this.data.slice(startRowIdx, endRowIdx);
              const newIndex = this.index.slice(startRowIdx, endRowIdx);
              return new DataFrame(newData, { index: newIndex, columns: this.columns });
            }
            throw new Error('The rowLoc is not found in the index.');
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
        if (range(this.index.length).includes(rowLoc)) {
          startRowIdx = rowLoc;
          endRowIdx = rowLoc + 1;
        } else {
          throw new Error('The rowLoc is not found in the index.');
        }
      }

      // rowLoc is int[]
      if (isArray(rowLoc)) {
        for (let i = 0; i < rowLoc.length; i += 1) {
          const rowIdx = rowLoc[i];
          if (!range(this.index.length).includes(rowIdx)) {
            throw new Error('The rowLoc is not found in the index.');
          }
          rowIdxes.push(rowIdx);
        }
      }

      // rowLoc is slice
      if (isString(rowLoc) && rowLoc.includes(':')) {
        const rowLocArr = rowLoc.split(':');
        if (rowLocArr.length === 2) {
          const start = Number(rowLocArr[0]);
          const end = Number(rowLocArr[1]);
          if (isInteger(start) && isInteger(end)) {
            startRowIdx = start;
            endRowIdx = end;
          } else {
            throw new Error('The rowLoc is not found in the index.');
          }
        }
      }

      if ((startRowIdx >= 0 && endRowIdx >= 0) || rowIdxes.length > 0) {
        // colLoc is int
        if (isInteger(colLoc) && range(this.columns.length).includes(colLoc)) {
          startColIdx = colLoc;
          endColIdx = colLoc + 1;
        }

        // colLoc is int[]
        if (isArray(colLoc)) {
          for (let i = 0; i < colLoc.length; i += 1) {
            const colIdx = colLoc[i];
            if (!range(this.columns.length).includes(colIdx)) {
              throw new Error('The colLoc is not found in the columns index.');
            }
            colIdxes.push(colIdx);
          }
        }

        // colLoc is slice
        if (isString(colLoc) && colLoc.includes(':')) {
          const colLocArr = colLoc.split(':');
          if (colLocArr.length === 2) {
            const start = Number(colLocArr[0]);
            const end = Number(colLocArr[1]);
            if (isInteger(start) && isInteger(end)) {
              startColIdx = start;
              endColIdx = end;
            } else {
              throw new Error('The colLoc is not found in the columns index.');
            }
          }
        }

        // build new data and index
        let newData: any[][] = [];
        let newIndex: any[] = [];

        if (startRowIdx >= 0 && endRowIdx >= 0) {
          newData = this.data.slice(startRowIdx, endRowIdx);
          newIndex = this.index.slice(startRowIdx, endRowIdx);
        } else if (rowIdxes.length > 0) {
          for (let i = 0; i < rowIdxes.length; i += 1) {
            const rowIdx = rowIdxes[i];
            newData.push(this.data[rowIdx]);
            newIndex.push(this.index[rowIdx]);
          }
        } else {
          throw new Error('The rowLoc is not found in the index.');
        }

        // build new columns
        if (startColIdx >= 0 && endColIdx >= 0) {
          for (let i = 0; i < newData.length; i += 1) {
            newData[i] = newData[i].slice(startColIdx, endColIdx);
          }
          const newColumns = this.columns.slice(startColIdx, endColIdx);
          return new DataFrame(newData, { index: newIndex, columns: newColumns });
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
          return new DataFrame(newData, { index: newIndex, columns: newColumns });
        }
        throw new Error('The colLoc is not found in the columns index.');
      }

      throw new Error('The colLoc is illegal');
    }
    throw new Error('The rowLoc is illegal');
  }

  /**
   * Get data by column.
   * @param col
   */
  getByColumn(col: Axis): Series {
    if (this.columns.includes(col)) {
      const colIdx = this.columns.indexOf(col);
      return new Series(this.colData[colIdx], {
        index: this.index,
      });
    }
    throw new Error('The col is illegal');
  }

  /**
   * Get statistics.
   */
  info(): FieldsInfo {
    const fields: FieldsInfo = [];
    for (let i = 0; i < this.columns.length; i += 1) {
      const column = this.columns[i];
      fields.push({ ...analyzeField(this.colData[i]), name: String(column) });
    }
    return fields;
  }
}
