import { isArray } from '../utils';
import { isLegalBasicType, generateArrayIndex } from './utils';
import type { SeriesData, FrameData, Axis, Extra } from './types';

type NDArray = any[] | any[][];

/** Base data structure */
export default abstract class BaseFrame {
  axes: [Axis[]] | [Axis[], Axis[]] = [[]];

  data: NDArray = [];

  colData: NDArray = [];

  constructor(data: SeriesData | FrameData, extra?: Extra) {
    // 1D: array
    if (isArray(data)) {
      this.setAxis(0, generateArrayIndex(data, extra));
      for (let i = 0; i < data.length; i += 1) {
        const datum = data[i];
        // As long as any datum in data is basic type, it's a 1D array
        if (isLegalBasicType(datum)) {
          this.data = data;
          this.colData = this.data;
        }
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
  setAxis(axis: number, labels: Axis[]) {
    this.axes[axis] = labels;
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
