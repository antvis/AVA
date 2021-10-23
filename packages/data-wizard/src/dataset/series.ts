import { isObject, isNumber, isString, isInteger, isBasicType, isArray, range, assert } from '../utils';
import BaseFrame from './base-frame';
import type { SeriesData, Extra, Axis } from './types';

export interface SeriesExtra {
  index?: Extra['index'];
}

/** 1D data structure */
export default class Series extends BaseFrame {
  constructor(data: SeriesData, extra?: SeriesExtra) {
    super(data, extra);

    assert(isObject(data) || isBasicType(data) || isArray(data), 'Data type is illegal');

    /** 1D: object */
    if (isObject(data)) {
      // generate index
      const index = Object.keys(data);

      if (extra?.index) {
        assert(
          extra?.index?.length <= index.length,
          `Index length ${extra?.index?.length} is greater than data size ${index.length}`
        );

        for (let i = 0; i < extra?.index.length; i += 1) {
          const idx = extra?.index[i] as string;
          if (index.includes(idx)) {
            this.data.push(data[idx]);
          }
        }
        this.setAxis(0, extra?.index);
      } else {
        this.data = Object.values(data);
        this.setAxis(0, index);
      }
    } else if (isArray(data)) {
      /** 1D: array */
      const [data0] = data;
      if (!isBasicType(data0)) {
        if (extra?.index) {
          assert(
            extra?.index?.length === data.length,
            `Index length is ${extra?.index.length}, but data size ${data.length}`
          );

          this.setAxis(0, extra?.index);
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
      assert(this.index.includes(rowLoc), 'The rowLoc is not found in the index.');

      if (isNumber(rowLoc)) {
        return this.data[rowLoc];
      }

      if (isString(rowLoc)) {
        const rowIdx = this.index.indexOf(rowLoc);
        return this.data[rowIdx];
      }
    }

    if (isArray(rowLoc)) {
      // input is like [0, 1, 2] || ['a', 'b', 'c']
      const newData: any[] = [];
      const newIndex: Axis[] = [];
      for (let i = 0; i < rowLoc.length; i += 1) {
        const loc = rowLoc[i];

        assert(this.index.includes(loc), 'The rowLoc is not found in the index.');

        const idxInIndex = this.index.indexOf(loc);
        newData.push(this.data[idxInIndex]);
        newIndex.push(this.index[idxInIndex]);
      }
      return new Series(newData, { index: newIndex });
    }

    if (isString(rowLoc) && rowLoc.includes(':')) {
      // input is like '0:2' || 'a:c'
      const rowLocArr = rowLoc.split(':');

      assert(rowLocArr.length === 2, 'The rowLoc is not found in the index.');

      const startLoc = rowLocArr[0];
      const endLoc = rowLocArr[1];

      if (isInteger(Number(startLoc)) && isInteger(Number(endLoc))) {
        const startIdx = Number(startLoc);
        const endIdx = Number(endLoc);
        const newData = this.data.slice(startIdx, endIdx);
        const newIndex = this.index.slice(startIdx, endIdx);
        return new Series(newData, { index: newIndex });
      }

      if (isString(startLoc) && isString(endLoc)) {
        const startIdx = this.index.indexOf(startLoc);
        const endIdx = this.index.indexOf(endLoc);
        const newData = this.data.slice(startIdx, endIdx);
        const newIndex = this.index.slice(startIdx, endIdx);
        return new Series(newData, { index: newIndex });
      }
    }

    throw new Error('The rowLoc is illegal');
  }

  /**
   * Get data by row location and column location using integer-index.
   * @param rowLoc
   */
  getByIntegerIndex(rowLoc: number | number[] | string): Series | any {
    assert(isInteger(rowLoc) || isArray(rowLoc) || (isString(rowLoc) && rowLoc.includes(':')), 'The rowLoc is illegal');

    // input is like 1
    if (isInteger(rowLoc)) {
      assert(range(this.index.length).includes(rowLoc), 'The rowLoc is not found in the index.');

      if (range(this.index.length).includes(rowLoc)) {
        return this.data[rowLoc];
      }
    }

    if (isArray(rowLoc)) {
      // input is like [0, 1, 2]
      const newData: any[] = [];
      const newIndex: Axis[] = [];
      for (let i = 0; i < rowLoc.length; i += 1) {
        const idx = rowLoc[i];

        assert(range(this.index.length).includes(idx), 'The rowLoc is not found in the index.');

        newData.push(this.data[idx]);
        newIndex.push(this.index[idx]);
      }
      return new Series(newData, { index: newIndex });
    }

    if (isString(rowLoc) && rowLoc.includes(':')) {
      // input is like '0:2'
      const rowLocArr = rowLoc.split(':');
      if (rowLocArr.length === 2) {
        const startIdx = Number(rowLocArr[0]);
        const endIdx = Number(rowLocArr[1]);

        assert(isInteger(startIdx) && isInteger(endIdx), 'The rowLoc is not found in the index.');

        const newData = this.data.slice(startIdx, endIdx);
        const newIndex = this.index.slice(startIdx, endIdx);
        return new Series(newData, { index: newIndex });
      }
    }

    throw new Error('The rowLoc is illegal');
  }
}
