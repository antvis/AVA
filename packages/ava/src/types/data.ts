import type { LevelOfMeasurement } from '@ava/ckb';
import type { DATA_SHAPE } from '@ava/extract/constants';
import type { PURPOSE } from '@ava/constants';

export type MatchFunction = (input: Record<string, any> | Record<string, any>[]) => { is: boolean; format: any };

export type Datum = Record<string, any>;

export type Data = Datum[];

export type TrendType = 'decreasing' | 'increasing' | 'no trend';

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

export type PlainLikeDataType = Array<Record<string, string | number>> | Array<Array<string | number>>;

export type HierarchyLikeDataType = Array<{
  id: string;
  name?: string;
  children?: HierarchyLikeDataType;
  [key: string]: any;
}>;

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

export type RelationLikeDataType = {
  nodes: NodeData[];
  edges: EdgeData[];
};

/**
 * Rows(records) of data.
 */
export type FieldDataType<T extends DATA_SHAPE = DATA_SHAPE.PLAIN> = T extends DATA_SHAPE.HIERARCHY
  ? HierarchyLikeDataType
  : T extends DATA_SHAPE.RELATION
  ? RelationLikeDataType
  : PlainLikeDataType;

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

export type NodeStructFeature = {
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

export type EdgeStructFeature = {
  isDirected: Boolean;
  centrality: number;
  cycleCount: number;
  triangleCount: number;
  starCount: number;
  cliqueCount: number;
};

export type RelationFeature = {
  rootFeatures: Partial<{
    nodeCount: number;
    edgeCount: number;
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
  }>;
  nodeFeatures: ColumnFeature[];
  edgeFeatures: ColumnFeature[];
  nodeStructFeatures: Partial<NodeStructFeature>[];
  linkStructFeatures: Partial<EdgeStructFeature>[];
  [key: string]: any;
};

export type PurposeObject = {
  name: string;
  key: string;
  purpose: PURPOSE;
  purposeDesc?: string;
};

export type DataShard = {
  shape: DATA_SHAPE;
  data: FieldDataType<DATA_SHAPE>;
  metas: Array<Meta>;
  purpose?: PurposeObject;
};
