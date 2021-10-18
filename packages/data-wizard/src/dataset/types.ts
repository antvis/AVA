import type { StringFieldInfo, NumberFieldInfo, DateFieldInfo } from '../analyzer';

export type SeriesData =
  /**
   * 1D: basic type
   * be like
   * 1
   */
  | number
  | string
  | boolean
  | undefined
  | null
  /**
   * 1D: array
   * be like
   * [1, 2, 3]
   */
  | any[]
  /**
   * 1D: object
   * be like
   * {a: 1, b: 2}
   */
  | {
      [key: string]: any;
    };

export type FrameData =
  /** 1D */
  /**
   * 1D: basic type
   * be like
   * 1
   */
  | number
  | string
  | boolean
  | undefined
  | null
  /**
   * 1D: array
   * be like
   * [1, 2, 3]
   */
  | any[]
  /**
   * 1D: object
   * be like
   * {a: 1, b: 2}
   */
  | {
      [key: string]: any;
    }
  /** 2D */
  /**
   * 2D: array
   * be like
   * [
   *  [1, 2, 3],
   *  [4, 5, 6]
   * ]
   */
  | any[][]
  /**
   * 2D: object array
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
   * 2D: array object
   * be like
   * {
   *  a: [1, 2, 3],
   *  b: [4, 5, 6]
   * }
   */
  | {
      [key: string]: any[];
    };

export type Axis = string | number;

// extra data configs
export type Extra = {
  index?: Axis[];
  columns?: Axis[];
};

/**
 * Fields Type
 * @public
 */
export type FieldsInfo = Array<
  (StringFieldInfo | NumberFieldInfo | DateFieldInfo) & { /** field name */ name: string }
>;

export type GraphExtra = {
  nodeKey?: string; // key for node array in data object
  edgeKey?: string; // key for edge array in data object
  sourceKey?: string; // key for edge source in edge object
  targetKey?: string;
  childrenKey?: string;
  nodeIndex?: Axis[];
  nodeColumns?: Axis[];
  edgeIndex?: Axis[];
  edgeColumns?: Axis[];
}
export type NodeData = {
  id: string,
  name?: string;
  [key: string]: any;
}
export type EdgeData = {
  source: string;
  target: string;
  [key: string]: any;
}

export type GraphInput = 
  | TreeNode 
  // object array, such as array of edge object, e.g. [ {source: 1, target: 1}, ...]
  | {
    [key: string]: any;
  }[]
  // array object, such as { nodes: [], edges: [] }
  | {
    [key: string]: any[];
  }
export type TreeNode = {
  id: string;
  children: TreeNode[];
  [key: string]: any;
}
