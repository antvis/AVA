import { isObject, isNumber, isString, isInteger, isBasicType, isArray, range, assert } from '../utils';
import { fillMissingValue } from './utils';
import BaseFrame from './base-frame';
import type { SeriesData, Extra, Axis } from './types';

export interface SeriesExtra {
  indexes?: Extra['indexes'];
  fillValue?: Extra['fillValue'];
}

/** 1D data structure */
export default class Series extends BaseFrame {
  constructor(data: SeriesData, extra?: SeriesExtra) {
    super(data, extra);

    assert(isObject(data) || isBasicType(data) || isArray(data), 'Data type is illegal');

    /** 1D: object */
    if (isObject(data)) {
      // generate indexes
      const indexes = Object.keys(data);

      if (extra?.indexes) {
        assert(
          extra?.indexes?.length <= indexes.length,
          `Index length ${extra?.indexes?.length} is greater than data size ${indexes.length}`
        );

        for (let i = 0; i < extra?.indexes.length; i += 1) {
          const idx = extra?.indexes[i] as string;
          if (indexes.includes(idx)) {
            this.data.push(fillMissingValue(data[idx], extra?.fillValue));
          }
        }
        this.setAxis(0, extra?.indexes);
      } else {
        this.data = Object.values(data).map((datum) => fillMissingValue(datum, extra?.fillValue));
        this.setAxis(0, indexes);
      }
    } else if (isArray(data)) {
      /** 1D: array */
      const [data0] = data;
      if (!isBasicType(data0)) {
        if (extra?.indexes) {
          assert(
            extra?.indexes?.length === data.length,
            `Index length is ${extra?.indexes.length}, but data size ${data.length}`
          );

          this.setAxis(0, extra?.indexes);
        }
        this.data = data;
      }
    }
  }

  get shape(): [number] {
    return [this.axes[0].length];
  }

  /**
   * Get data by row location and column location.
   * @param rowLoc
   */
  get(rowLoc: Axis | Axis[] | string): Series | any {
    assert(
      isNumber(rowLoc) ||
        (isString(rowLoc) && !rowLoc.includes(':')) ||
        isArray(rowLoc) ||
        (isString(rowLoc) && rowLoc.includes(':')),
      'The rowLoc is illegal'
    );

    // input is like 0 || 'a'
    if (isNumber(rowLoc) || (isString(rowLoc) && !rowLoc.includes(':'))) {
      assert(this.indexes.includes(rowLoc), 'The rowLoc is not found in the indexes.');

      if (isNumber(rowLoc)) {
        return this.data[rowLoc];
      }

      if (isString(rowLoc)) {
        const rowIdx = this.indexes.indexOf(rowLoc);
        return this.data[rowIdx];
      }
    }

    if (isArray(rowLoc)) {
      // input is like [0, 1, 2] || ['a', 'b', 'c']
      const newData: any[] = [];
      const newIndex: Axis[] = [];
      for (let i = 0; i < rowLoc.length; i += 1) {
        const loc = rowLoc[i];

        assert(this.indexes.includes(loc), 'The rowLoc is not found in the indexes.');

        const idxInIndex = this.indexes.indexOf(loc);
        newData.push(this.data[idxInIndex]);
        newIndex.push(this.indexes[idxInIndex]);
      }
      return new Series(newData, { indexes: newIndex });
    }

    if (isString(rowLoc) && rowLoc.includes(':')) {
      // input is like '0:2' || 'a:c'
      const rowLocArr = rowLoc.split(':');

      assert(rowLocArr.length === 2, 'The rowLoc is not found in the indexes.');

      const startLoc = rowLocArr[0];
      const endLoc = rowLocArr[1];

      if (isInteger(Number(startLoc)) && isInteger(Number(endLoc))) {
        const startIdx = Number(startLoc);
        const endIdx = Number(endLoc);
        const newData = this.data.slice(startIdx, endIdx);
        const newIndex = this.indexes.slice(startIdx, endIdx);
        return new Series(newData, { indexes: newIndex });
      }

      if (isString(startLoc) && isString(endLoc)) {
        const startIdx = this.indexes.indexOf(startLoc);
        const endIdx = this.indexes.indexOf(endLoc);
        const newData = this.data.slice(startIdx, endIdx);
        const newIndex = this.indexes.slice(startIdx, endIdx);
        return new Series(newData, { indexes: newIndex });
      }
    }

    throw new Error('The rowLoc is illegal');
  }

  /**
   * Get data by row location and column location using integer index.
   * @param rowLoc
   */
  getByIndex(rowLoc: number | number[] | string): Series | any {
    assert(isInteger(rowLoc) || isArray(rowLoc) || (isString(rowLoc) && rowLoc.includes(':')), 'The rowLoc is illegal');

    // input is like 1
    if (isInteger(rowLoc)) {
      assert(range(this.indexes.length).includes(rowLoc), 'The rowLoc is not found in the indexes.');

      if (range(this.indexes.length).includes(rowLoc)) {
        return this.data[rowLoc];
      }
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
      return new Series(newData, { indexes: newIndex });
    }

    if (isString(rowLoc) && rowLoc.includes(':')) {
      // input is like '0:2'
      const rowLocArr = rowLoc.split(':');
      if (rowLocArr.length === 2) {
        const startIdx = Number(rowLocArr[0]);
        const endIdx = Number(rowLocArr[1]);

        assert(isInteger(startIdx) && isInteger(endIdx), 'The rowLoc is not found in the indexes.');

        const newData = this.data.slice(startIdx, endIdx);
        const newIndex = this.indexes.slice(startIdx, endIdx);
        return new Series(newData, { indexes: newIndex });
      }
    }

    throw new Error('The rowLoc is illegal');
  }
}
