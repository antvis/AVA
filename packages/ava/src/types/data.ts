/**
 * One row(record) of data in JSON.
 */
export type Datum = Record<string, string | number>;

/**
 * Rows(records) of data.
 */
export type Data = Datum[];

/**
 * field type enum
 */
export enum COMMON_DATA_TYPE {
  STRING = 'string',
  NUMBER = 'number',
  GEO = 'geo', // geography
  DATE = 'date',
}

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
