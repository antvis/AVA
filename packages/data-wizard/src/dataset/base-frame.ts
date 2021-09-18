import { assert, isArray, isObject } from '../utils';
import { isBasicType, generateArrayIndex } from './utils';
import type { SeriesData, FrameData, Axis, Extra } from './types';

type NDArray = any[] | any[][];

/** Base data structure */
export default abstract class BaseFrame {
  axes: [Axis[]] | [Axis[], Axis[]] = [[]];

  data: NDArray = [];

  colData?: NDArray = [];

  constructor(data: SeriesData | FrameData, extra?: Extra) {
    assert(!extra || isObject(extra), 'If extra exists, it must be an object.');

    /** 1D: basic type */
    if (isBasicType(data)) {
      // generate index
      if (extra?.index) {
        this.setAxis(0, extra?.index);
        this.data = Array(extra?.index.length).fill(data);
      } else {
        this.data = [data];
        this.setAxis(0, [0]);
      }
    } else if (isArray(data)) {
      /** 1D: array */
      let legal = true;

      for (let i = 0; i < data.length; i += 1) {
        const datum = data[i];
        // As long as any datum in data is basic type, it's a 1D array
        if (!isBasicType(datum)) {
          legal = false;
          break;
        }
      }

      this.setAxis(0, generateArrayIndex(data, extra));

      if (legal) {
        if (extra?.index) {
          assert(extra?.index?.length === data.length, `Index length is ${extra?.index.length}, but data size ${data.length}`);

          this.setAxis(0, extra?.index);
        }
        this.data = data;
      }
    }
  }

  abstract get shape(): [number] | [number, number];

  get index(): Axis[] {
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
   * Get data by row location and column location using integer-index.
   * @param rowLoc
   * @param colLoc
   */
  abstract getByIntegerIndex(rowLoc: number | number[] | string, colLoc?: number | number[] | string): BaseFrame;
}
