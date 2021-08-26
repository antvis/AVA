export type SeriesData =
  /**
   * 1D: object
   * be like
   * {a: 1, b: 2}
   */
  | {
      [key: string]: any;
    }
  /**
   * 1D: array
   * be like
   * [1, 2, 3]
   */
  | any[]
  /**
   * 1D: basic type
   * be like
   * 1
   */
  | number
  | string
  | boolean;

export type FrameData =
  // 1D
  /**
   * 1D: object
   * be like
   * {a: 1, b: 2}
   */
  | {
      [key: string]: any;
    }
  /**
   * 1D: array
   * be like
   * [1, 2, 3]
   */
  | any[]
  // 2D
  /**
   * 2D: object in array
   * be like
   * [
   *  {a: 1, b: 2},
   *  {a: 3, b: 4},
   *  {a: 5, b: 6}
   * ]
   */
  | {
      [key: string]: any;
    }[]
  /**
   * 2D: array in object
   * be like
   * {
   *  a: [1, 2, 3],
   *  b: [4, 5, 6]
   * }
   */
  | {
      [key: string]: any[];
    }
  /**
   * 2D: array
   * be like
   * [
   *  [1, 2, 3],
   *  [4, 5, 6]
   * ]
   */
  | any[][];

export type Axis = string | number;

// extra data configs
export type Extra = {
  index?: Axis[];
  columns?: Axis[];
};