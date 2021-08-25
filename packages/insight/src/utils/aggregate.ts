import _groupBy from 'lodash/groupBy';
import _sumBy from 'lodash/sumBy';
import _maxBy from 'lodash/maxBy';
import _minBy from 'lodash/minBy';
import _meanBy from 'lodash/meanBy';
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

export const aggregate = (data: Datum[], groupByField: string, measures: Measure[]) => {
  const grouped = _groupBy(data, groupByField);
  return Object.entries(grouped).map(([value, dataGroup]) => {
    const datum: Datum = { [groupByField]: value };
    measures.forEach((measure) => {
      const { field: measureField, method } = measure;
      const aggregator = AggregatorMap[method];
      datum[measureField] = aggregator(dataGroup, measureField);
    });
    return datum;
  });
};
