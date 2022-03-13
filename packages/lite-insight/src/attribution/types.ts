import { Datum } from '../interface';
/** DataConfig specifies the input data with its focused dimensions and target measure to be analysed. */
export type DataConfig = {
  sourceData: Datum[];
  dimensions: string[];
  measures: string[];
  expression?: string;
};

/** FluctInfo is the necessary input for fluctuation analysis.  */
export type FluctInfo = {
  /** Typically, flucDim is a time dimension that the measure value varies on */
  fluctDim: string;
  /** baseInterval is the time interval that is assigned as the basement */
  baseInterval: CompareInterval;
  /** currInterval is the time interval that user is focusing on */
  currInterval: CompareInterval;
};

/** Time Interval in Fluctuation Analysis */
export type CompareInterval = {
  /** start time of this interval */
  startPoint: string | number;
  /** end time of this interval */
  endPoint: string | number;
};

/** a flag that indicates the belongings of a single line of data, which is useful for aggregation */
export type DataLocation = 'left' | 'right' | 'none';

/** Record the calculation result */
export type InfoType = {
  /** Calculation value corresponding to baseInterval */
  baseValue: number;
  /** Calculation value corresponding to currInterval */
  currValue: number;
  /** diff = currValue - baseValue */
  diff: number;
};

/**  Dimension drill down Result type */
export type AttributionResult = {
  /** total difference  */
  unitedInfo: InfoType;
  /** Tree like returned data */
  resultTree?: TreeDim;
  /** Flatten returned data */
  resultFlatten?: FlattenResult[];

  resultFunctionBased?: FunctionBasedResult[];
};

/** The first string is dimension name, the second string is dimension value */
export type DimWithValue = Record<string, string>;

/** Dimension drill down attribution Result type that has been formalized into Datum[] */
export type FlattenResult = Partial<DimWithValue & InfoType>;

/** Function based attribution Result type */
export type FunctionBasedResult = Record<string, InfoType>;

/** Example: Tree Data Structure for dimension drill down analysis
 *
 * {
 * dimNameA: {
 *   dimValueA1: {
 *      info: {baseValue: 222, curValue: 555, diff: 333},
 *      drillDown: {
 *          dimNameB: {
 *   dimValueB1: {
 *      info: {baseValue: 000, curValue: 111, diff: 111},
 *      drillDown: {}
 *   },
 *   dimValueB2: {
 *      info: {baseValue: 222, curValue: 444, diff: 222},
 *      drillDown: {}
 *   }
 * }
 *      }
 *   },
 * },
 * dimNameB: {
 *   dimValueB1: {
 *      info: {baseValue: 000, curValue: 111, diff: 111},
 *      drillDown: {}
 *   },
 *   dimValueB2: {
 *      info: {baseValue: 222, curValue: 444, diff: 222},
 *      drillDown: {}
 *   }
 * }
 * }
 *
 */
/** eslint-disable */
/** The dimension name level of the tree or the first level in drillDown */
export interface TreeDim {
  [dimName: string]: TreeDimVal;
}

/** The dimension value level of the tree which is inside the dimension name level */
export type TreeDimVal = Record<string | number, TreeDrillDown>;

/** The information level inside the dimension value  */
export interface TreeDrillDown {
  info: InfoType;
  drillDown: TreeDim;
}
/** eslint-enable */
