import _groupBy from 'lodash/groupBy';
import _sumBy from 'lodash/sumBy';
import _maxBy from 'lodash/maxBy';
import _minBy from 'lodash/minBy';
import _meanBy from 'lodash/meanBy';
import _sortBy from 'lodash/sortBy';
import _flatten from 'lodash/flatten';
import { Aggregator, Datum, Measure, MeasureMethod } from '../interface';

const sum = (data: Datum[], measure: string) => {
  return _sumBy(data, measure);
};

const count = (data: Datum[], measure: string) => {
  return data.filter((item) => measure in item).length;
};

const max = (data: Datum[], measure: string) => {
  return _maxBy(data, measure)?.[measure] as number;
};

const min = (data: Datum[], measure: string) => {
  return _minBy(data, measure)?.[measure] as number;
};

const mean = (data: Datum[], measure: string) => {
  return _meanBy(data, measure);
};

export const AggregatorMap: Record<MeasureMethod, Aggregator> = {
  SUM: sum,
  COUNT: count,
  MAX: max,
  MIN: min,
  MEAN: mean,
};

export const aggregate = (data: Datum[], groupByField: string, measures: Measure[], sort?: boolean) => {
  const grouped = _groupBy(data, groupByField);
  const entries = sort ? _sortBy(Object.entries(grouped), '0') : Object.entries(grouped);
  return entries.map(([value, dataGroup]) => {
    const datum: Datum = { [groupByField]: value };
    measures.forEach((measure) => {
      const { field: measureField, method } = measure;
      const aggregator = AggregatorMap[method];
      datum[measureField] = aggregator(dataGroup, measureField);
    });
    return datum;
  });
};

export const aggregateWithMeasures = (data: Datum[], groupByField: string, measures: Measure[]) => {
  const grouped = _groupBy(data, groupByField);
  const result = [];
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
};

export const aggregateWithSeries = (data: Datum[], groupByField: string, measure: Measure, expandingField: string) => {
  const grouped = _groupBy(data, groupByField);
  const { field: measureField, method } = measure;
  const aggregator = AggregatorMap[method];
  return _flatten(
    Object.entries(grouped).map(([value, dataGroup]) => {
      const childGrouped = _groupBy(dataGroup, expandingField);
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
};
