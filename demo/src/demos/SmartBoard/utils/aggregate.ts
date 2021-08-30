import { groupBy, sumBy, maxBy, minBy, meanBy, flatten } from 'lodash';

export type AggregateMethod = 'SUM' | 'COUNT' | 'MAX' | 'MIN' | 'MEAN';

export type Aggregator = (data: any, measure: string) => number;

const sum = (data: any[], measure: string) => {
  return sumBy(data, measure);
};

const count = (data: any[], measure: string) => {
  return data.filter((item) => measure in item).length;
};

const max = (data: any[], measure: string) => {
  return maxBy(data, measure)?.[measure] as number;
};

const min = (data: any[], measure: string) => {
  return minBy(data, measure)?.[measure] as number;
};

const mean = (data: any[], measure: string) => {
  return meanBy(data, measure);
};

const AggregatorMap: Record<AggregateMethod, Aggregator> = {
  SUM: sum,
  COUNT: count,
  MAX: max,
  MIN: min,
  MEAN: mean,
};

/**
 * Data aggregation function
 * @param data
 * @param dimensionField
 * @param measure
 * @param seriesField
 * @returns
 */
export const aggregate = (
  data: any[],
  dimensionField: string,
  measure: string,
  seriesField?: string,
  aggMethod: AggregateMethod = 'SUM'
) => {
  const grouped = groupBy(data, dimensionField);
  const aggregator = AggregatorMap[aggMethod];
  if (!seriesField) {
    return Object.entries(grouped).map(([value, dataGroup]) => {
      return {
        [dimensionField]: value,
        [measure]: aggregator(dataGroup, measure),
      };
    });
  }
  return flatten(
    Object.entries(grouped).map(([value, dataGroup]) => {
      const childGrouped = groupBy(dataGroup, seriesField);
      const part = Object.entries(childGrouped).map(([childValue, childDataGroup]) => {
        return {
          [seriesField]: childValue,
          [measure]: sum(childDataGroup, measure),
        };
      });
      return part.map((item) => {
        return {
          ...item,
          [dimensionField]: value,
        };
      });
    })
  );
};
