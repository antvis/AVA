import { groupBy, sumBy, minBy, maxBy, meanBy, sortBy, flatten, uniq } from 'lodash';

import { Aggregator, Datum, Measure, MeasureMethod } from '../types';

const sum = (data: Datum[], measure: string) => {
  return sumBy(data, measure);
};

const count = (data: Datum[], measure: string) => {
  return data.filter((item) => measure in item).length;
};

const countDistinct = (data: Datum[], measure: string) => {
  return uniq(data.filter((item) => measure in item).map((item) => item[measure])).length;
};

const max = (data: Datum[], measure: string) => {
  return maxBy(data, measure)?.[measure] as number;
};

const min = (data: Datum[], measure: string) => {
  return minBy(data, measure)?.[measure] as number;
};

const mean = (data: Datum[], measure: string) => {
  return meanBy(data, measure);
};

export const AggregatorMap: Record<MeasureMethod, Aggregator> = {
  SUM: sum,
  COUNT: count,
  MAX: max,
  MIN: min,
  MEAN: mean,
  COUNT_DISTINCT: countDistinct,
};

export function aggregate(data: Datum[], groupByField: string, measures: Measure[], sort?: boolean) {
  const grouped = groupBy(data, groupByField);
  const entries = sort ? sortBy(Object.entries(grouped), '0') : Object.entries(grouped);
  return entries.map(([value, dataGroup]) => {
    const datum: Datum = { [groupByField]: value };
    measures.forEach((measure) => {
      const { field: measureField, method } = measure;
      const aggregator = AggregatorMap[method];
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
      const { field: measureField, method } = measure;
      if (measureField in dataGroup[0]) {
        const aggregator = AggregatorMap[method];
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
  const { field: measureField, method } = measure;
  const aggregator = AggregatorMap[method];
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
