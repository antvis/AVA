import { groupBy, sumBy, minBy, maxBy, meanBy, sortBy, flatten, uniq } from 'lodash';

import type { Aggregator, Datum, Measure, MeasureMethod } from '../types';

/**
 * Aggregate the sum of measure field.
 */
const sum = (data: Datum[], measure: string) => {
  return sumBy(data, measure);
};

/**
 * Aggregate the count of measure field.
 */
const count = (data: Datum[], measure: string) => {
  return data.filter((item) => measure in item).length;
};

/**
 * Aggregate the distinct count of measure field.
 */
const countDistinct = (data: Datum[], measure: string) => {
  return uniq(data.filter((item) => measure in item).map((item) => item[measure])).length;
};

/**
 * Aggregate the max of measure field.
 */
const max = (data: Datum[], measure: string) => {
  return maxBy(data, measure)?.[measure] as number;
};

/**
 * Aggregate the min of measure field.
 */
const min = (data: Datum[], measure: string) => {
  return minBy(data, measure)?.[measure] as number;
};

/**
 * Aggregate the mean of measure field.
 */
const mean = (data: Datum[], measure: string) => {
  return meanBy(data, measure);
};

export const AGGREGATOR_MAP: Record<MeasureMethod, Aggregator> = {
  SUM: sum,
  COUNT: count,
  MAX: max,
  MIN: min,
  MEAN: mean,
  COUNT_DISTINCT: countDistinct,
};

/**
 * Aggregate data by groupByField and measures.
 */
export function aggregate(data: Datum[], groupByField: string, measures: Measure[], sort?: boolean) {
  const grouped = groupBy(data, groupByField);
  const entries = sort ? sortBy(Object.entries(grouped), '0') : Object.entries(grouped);
  return entries.map(([value, dataGroup]) => {
    const datum: Datum = { [groupByField]: value };
    measures.forEach((measure) => {
      const { fieldName: measureField, method } = measure;
      const aggregator = AGGREGATOR_MAP[method];
      datum[measureField] = aggregator(dataGroup, measureField);
    });
    return datum;
  });
}

export function aggregateWithMeasures(data: Datum[], groupByField: string, measures: Measure[]) {
  const grouped = groupBy(data, groupByField);
  const result: Datum[] = [];
  Object.entries(grouped).forEach(([value, dataGroup]) => {
    measures.forEach((measure) => {
      const { fieldName: measureField, method } = measure;
      if (measureField in dataGroup[0]) {
        const aggregator = AGGREGATOR_MAP[method];
        const measureValue = aggregator(dataGroup, measureField);
        result.push({
          [groupByField]: value,
          value: measureValue,
          measureName: measureField,
        });
      }
    });
  });
  return result;
}

export function aggregateWithSeries(data: Datum[], groupByField: string, measure: Measure, expandingField: string) {
  const grouped = groupBy(data, groupByField);
  const { fieldName: measureField, method } = measure;
  const aggregator = AGGREGATOR_MAP[method];
  return flatten(
    Object.entries(grouped).map(([value, dataGroup]) => {
      const childGrouped = groupBy(dataGroup, expandingField);
      const part = Object.entries(childGrouped).map(([childValue, childDataGroup]) => {
        return {
          [expandingField]: childValue,
          [measureField]: aggregator(childDataGroup, measureField),
        };
      });
      return part.map((item) => {
        return {
          ...item,
          [groupByField]: value,
        };
      });
    })
  );
}
