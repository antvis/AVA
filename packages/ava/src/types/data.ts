import type { LevelOfMeasurement } from '@ava/ckb';
import type { DATA_SHAPE } from '@ava/data';

/**
 * Rows(records) of data.
 */
export type Data = FieldDataType;

/**
 * Field Type
 */
export enum COLUMN_TYPE {
  null = 'null',
  boolean = 'boolean',
  number = 'number',
  date = 'date',
  string = 'string',
  geo = 'geo',
}

export type PlainDataType = Array<Record<string, string | number>> | Array<Array<string | number>>;

export type TreeDataType = Array<{
  id: string;
  name?: string;
  children?: TreeDataType;
  [key: string]: any;
}>;

export type GraphDataType = {
  nodes: Array<{
    id: string;
    name?: string;
    [key: string]: any;
  }>;
  edges: Array<{
    source: string;
    target: string;
    [key: string]: any;
  }>;
};

export type FlowDataType = {
  nodes: Array<{
    id: string;
    name?: string;
    [key: string]: any;
  }>;
  edges: Array<{
    source: string;
    target: string;
    value: number;
    [key: string]: any;
  }>;
};

/**
 * Rows(records) of data.
 */
export type FieldDataType<T extends DATA_SHAPE = DATA_SHAPE.PLAIN> = T extends DATA_SHAPE.TREE
  ? TreeDataType
  : T extends DATA_SHAPE.GRAPH
  ? GraphDataType
  : PlainDataType;

/**
 * statistical properties
 */
export enum StatisticsFeatureKey {
  'distinct' = 'distinct',
  'max' = 'max',
  'min' = 'min',
  'mean' = 'mean',
  'median' = 'median',
  'variance' = 'variance',
  'standardDeviation' = 'standardDeviation',
  'sorted' = 'sorted',
}

/**
 * field meta info
 */
export type Meta<T extends COLUMN_TYPE = COLUMN_TYPE> = {
  id: string;
  name: string;
  dataType: T;
  allData?: T extends COLUMN_TYPE.string ? string[] : number[];
  statisticsFeature?: StringColumnFeature | NumberColumnFeature | DateColumnFeature | GeoColumnFeature;
  format?: string;
};

export type MeasureMethod = 'SUM' | 'COUNT' | 'MAX' | 'MIN' | 'MEAN' | 'COUNT_DISTINCT';

// impact measures must satisfies anti-monotonic condition and is bounded between 0 and 1.
export type ImpactMeasureMethod = 'SUM' | 'COUNT';

export type Aggregator = (data: FieldDataType<DATA_SHAPE.PLAIN>, measure: string) => number;

export type DomainType = 'measure' | 'dimension';

export type Measure = {
  /** use the field name as uniq key */
  fieldName: string;
  method: MeasureMethod;
};

export type RawDataType = string | boolean | number;

/**
 * The field meta which be existed only the Field type is mixed
 */
export type ColumnMeta = {
  number?: NumberColumnFeature;
  date?: DateColumnFeature;
  string?: StringColumnFeature;
};

/**
 * Basic info of field
 * @public
 */
export type ColumnFeature = {
  /** field name */
  name?: string;
  /** field type */
  types: COLUMN_TYPE[]; // float integer bool date null string mixed

  /** recommendation type */
  recommendation: COLUMN_TYPE;
  /** number of empty includes null undefined or empty string */
  missing?: number;
  /** distinct count */
  distinct?: number;
  /** Number of each distinct item */
  valueMap?: Record<string, number>;
  /** count of rawData */
  count?: number;
  /** rawData */
  rawData: any[];
  /** level of measurements */
  levelOfMeasurements?: LevelOfMeasurement[];
};

/**
 * String Field
 * @public
 */
export type StringColumnFeature = ColumnFeature & {
  /** max length */
  maxLength: number;
  /** min length */
  minLength: number;
  /** mean of length */
  meanLength: number;
  /** is contain charts */
  containsChar: boolean;
  /**  is contain digits */
  containsDigit: boolean;
  /** is contain white space */
  containsSpace: boolean;
};

/**
 * Number Field
 * @public
 */
export type NumberColumnFeature = ColumnFeature & {
  /** the counts of zero value */
  zeros: number;
  /** minimum */
  minimum: number;
  /** 5% percentile */
  percentile5: number;
  /** 25% percentile */
  percentile25: number;
  /** 50% percentile */
  percentile50: number;
  /** 75% percentile */
  percentile75: number;
  /** 95% percentile */
  percentile95: number;
  /** maximum */
  maximum: number;
  /** standardDeviation */
  standardDeviation: number;
  /** mean */
  mean: number;
  /** sum */
  sum: number;
  /** variance */
  variance: number;
};
/**
 * Date Field
 * @public
 */

export interface DateColumnFeature extends ColumnFeature {
  /** minimum date */
  minimum: string | number | Date;
  /** maximum date */
  maximum: string | number | Date;
  /** interval of date or time */
  interval?: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface GeoColumnFeature extends ColumnFeature {
  /** geo type */
  geoType: 'name' | 'code' | 'coordinates';
}

export type NodeStructFeat = {
  degree: number;
  inDegree: number;
  outDegree: number;
  pageRank: number;
  closeness: number;
  kCore: number;
  cycleCount: number;
  triangleCount: number;
  starCount: number;
  cliqueCount: number;
  clusterCoeff: number;
};

export type LinkStructFeat = {
  isDirected: Boolean;
  centrality: number;
  cycleCount: number;
  triangleCount: number;
  starCount: number;
  cliqueCount: number;
};

// Statistical features of graph
export type GraphStatisticalFeature = {
  nodeCount: number;
  linkCount: number;
  direction: number;
  isDirected: Boolean;
  isDAG: Boolean;
  isCycle: Boolean;
  isConnected: Boolean;
  ratio: number; // ratio of breadth to depth
  breadth: number;
  depth: number;
  maxDegree: number;
  minDegree: number;
  avgDegree: number;
  degreeStd: number;
  maxPageRank: number;
  minPageRank: number;
  avgPageRank: number;
  components: any[];
  componentCount: number;
  strongConnectedComponents: any[];
  strongConnectedComponentCount: number;
  cycleCount: number;
  directedCycleCount: number;
  starCount: number;
  cliqueCount: number;
  cycleParticipate: number;
  triangleCount: number;
  localClusterCoeff: number;
  globalClusterCoeff: number;
  maxKCore: number;
};

export type GraphFeature = {
  nodeFeats: ColumnFeature[];
  linkFeats: ColumnFeature[];
  graphInfo: Partial<GraphStatisticalFeature>;
  nodeFeature: ColumnFeature[];
  linkFeature: ColumnFeature[];
  [key: string]: any;
};

export type NodeData = {
  id: string;
  name?: string;
  [key: string]: unknown;
};

export type EdgeData = {
  source: string;
  target: string;
  [key: string]: unknown;
};

/**
 * Graph extra info.
 */
export type GraphExtra = {
  nodeKey?: string; // key for node array in data object
  linkKey?: string; // key for link array in data object
  sourceKey?: string; // key for link source in link object
  targetKey?: string;
  childrenKey?: string;
  nodeIndexes?: string[];
  nodeColumns?: string[];
  linkIndexes?: string[];
  linkColumns?: string[];
};

export type GraphData = {
  nodes: NodeData[];
  edges: EdgeData[];
};
