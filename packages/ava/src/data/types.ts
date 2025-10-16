import type { LevelOfMeasurement } from '@ava/ckb';

export type RawDataType = string | boolean | number;

/**
 * Field Type
 */
export type ColumnType = 'null' | 'boolean' | 'number' | 'date' | 'string' | 'geo';

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
  types: ColumnType[]; // float integer bool date null string mixed
  /** recommendation type */
  recommendation: ColumnType;
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

/** --------------- types for graph ---------------  */
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

/** ---------------  end of graph ---------------  */
