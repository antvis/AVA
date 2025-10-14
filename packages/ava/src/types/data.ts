import type { DATA_SHAPE } from '@ava/data';

/**
 * One row(record) of data in JSON.
 */
// export type Datum = Record<string, string | number>;

/**
 * Rows(records) of data.
 */
export type Data = FieldDataType;

/**
 * field type enum
 */
export enum COMMON_DATA_TYPE {
  STRING = 'string',
  NUMBER = 'number',
  GEO = 'geo', // geography
  DATE = 'date',
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
  : T extends DATA_SHAPE.FLOW
  ? FlowDataType
  : T extends DATA_SHAPE.GRAPH
  ? GraphDataType
  : PlainDataType;

/**
 * statistical properties
 */
export enum StatisticsFeatureKey {
  'distinctCount' = 'distinctCount',
  'max' = 'max',
  'min' = 'min',
  'mean' = 'mean',
  'median' = 'median',
  'variance' = 'variance',
  'standardDeviation' = 'standardDeviation',
  'sorted' = 'sorted',
}

/**
 * statistical features by data type
 */
export type StatisticsFeatureType = {
  [COMMON_DATA_TYPE.NUMBER]: {
    [StatisticsFeatureKey.max]: number;
    [StatisticsFeatureKey.min]: number;
    [StatisticsFeatureKey.mean]: number;
    [StatisticsFeatureKey.median]: number;
    [StatisticsFeatureKey.variance]: number;
    [StatisticsFeatureKey.standardDeviation]: number;
    [StatisticsFeatureKey.sorted]: boolean;
  };
  [COMMON_DATA_TYPE.STRING]: {
    [StatisticsFeatureKey.distinctCount]: number;
  };
  [COMMON_DATA_TYPE.DATE]: {
    [StatisticsFeatureKey.distinctCount]: number;
  };
  [COMMON_DATA_TYPE.GEO]?: {
    [StatisticsFeatureKey.distinctCount]: number;
  };
};

/**
 * field meta info
 */
export type Meta<T extends COMMON_DATA_TYPE = COMMON_DATA_TYPE> = {
  id: string;
  name: string;
  dataType: T;
  allData?: T extends COMMON_DATA_TYPE.STRING ? string[] : number[];
  statisticsFeature?: StatisticsFeatureType[T];
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
