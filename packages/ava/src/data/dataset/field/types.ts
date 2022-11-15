import type { StringFieldInfo, NumberFieldInfo, DateFieldInfo, FieldType } from '../../analysis/types';

/**
 * Array Type. One dimension or two dimension
 * @public
 */
export type NDArray = unknown[] | unknown[][];

/**
 * One dimension series data.
 * @public
 */
export type SeriesData =
  /*
   * 1D: basic type
   * be like
   * 1
   */
  | number
  | string
  | boolean
  | undefined
  | null
  /*
   * 1D: array
   * be like
   * [1, 2, 3]
   */
  | unknown[]
  /*
   * 1D: object
   * be like
   * {a: 1, b: 2}
   */
  | {
      [key: string]: unknown;
    };

/**
 * One or two dimension frame data.
 * @public
 */
export type FrameData =
  /* 1D */
  /*
   * 1D: basic type
   * be like
   * 1
   */
  | number
  | string
  | boolean
  | undefined
  | null
  /*
   * 1D: array
   * be like
   * [1, 2, 3]
   */
  | unknown[]
  /*
   * 1D: object
   * be like
   * {a: 1, b: 2}
   */
  | {
      [key: string]: unknown;
    }
  /* 2D */
  /*
   * 2D: array
   * be like
   * [
   *  [1, 2, 3],
   *  [4, 5, 6]
   * ]
   */
  | unknown[][]
  /*
   * 2D: object array
   * be like
   * [
   *  {a: 1, b: 2},
   *  {a: 3, b: 4},
   *  {a: 5, b: 6}
   * ]
   */
  | {
      [key: string]: unknown;
    }[]
  /*
   * 2D: array object
   * be like
   * {
   *  a: [1, 2, 3],
   *  b: [4, 5, 6]
   * }
   */
  | {
      [key: string]: unknown[];
    };

/**
 * Axis
 * @public
 */
export type Axis = string | number;

/**
 * extra data configs
 * @public
 */
export type Extra = {
  indexes?: Axis[];
  columns?: Axis[];
  fillValue?: unknown;
  /** When the columnType is empty, no data type is specified */
  columnTypes?: (FieldType | '')[];
};

/**
 * Fields Type
 * @public
 */
export type FieldsInfo = Array<
  (StringFieldInfo | NumberFieldInfo | DateFieldInfo) & {
    /** Field name */
    name: string;
  }
>;
