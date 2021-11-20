import { assert, isArray, isObject, isBasicType } from '../utils';
import { generateArrayIndex, fillMissingValue } from './utils';
import type { SeriesData, FrameData, Axis, Extra } from './types';

type NDArray = any[] | any[][];

/** Base data structure */
export default abstract class BaseFrame {
  axes: [Axis[]] | [Axis[], Axis[]] = [[]];

  data: NDArray = [];

  colData?: NDArray;

  constructor(data: SeriesData | FrameData, extra?: Extra) {
    assert(!extra || isObject(extra), 'If extra exists, it must be an object.');

    /** 1D: basic type */
    if (isBasicType(data)) {
      // generate indexes
      if (extra?.indexes) {
        this.setAxis(0, extra?.indexes);
        this.data = Array(extra?.indexes.length).fill(fillMissingValue(data, extra?.fillValue));
      } else {
        this.data = [fillMissingValue(data, extra?.fillValue)];
        this.setAxis(0, [0]);
      }
    } else if (isArray(data)) {
      /** 1D: array */
      let legal = true;

      for (let i = 0; i < data.length; i += 1) {
        const datum = data[i];
        // For DataFrame, as long as any datum in data is basic type, it's a 1D array
        if (!isBasicType(datum)) {
          legal = false;
          break;
        }
      }

      this.setAxis(0, generateArrayIndex(data, extra?.indexes));

      if (legal) {
        if (extra?.indexes) {
          assert(
            extra?.indexes?.length === data.length,
            `Index length is ${extra?.indexes.length}, but data size ${data.length}`
          );

          this.setAxis(0, extra?.indexes);
        }
        this.data = extra?.fillValue ? data.map((datum) => fillMissingValue(datum, extra?.fillValue)) : data;
      }
    }
  }

  abstract get shape(): [number] | [number, number];

  get indexes(): Axis[] {
    return this.getAxis(0);
  }

  get columns(): Axis[] {
    return this.getAxis(1);
  }

  private getAxis(axis: number) {
    return this.axes[axis];
  }

  /**
   * Set axis. Only the 0 and 1 are currently supported.
   * @param axis
   * @param labels
   */
  setAxis(axis: number, values: Axis[]) {
    assert(isArray(values), 'Index or columns must be Axis array.');

    this.axes[axis] = values;
  }

  /** get value functions */

  /**
   * Get data by row location and column location.
   * @param rowLoc
   * @param colLoc
   */
  abstract get(rowLoc: Axis | Axis[] | string, colLoc?: Axis | Axis[] | string): BaseFrame;

  /**
   * Get data by row location and column location using integer index.
   * @param rowLoc
   * @param colLoc
   */
  abstract getByIndex(rowLoc: number | number[] | string, colLoc?: number | number[] | string): BaseFrame;
}
