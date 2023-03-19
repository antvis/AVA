import { sumBy, meanBy, minBy, maxBy, groupBy, mapValues } from 'lodash';

import type { Datum } from '../../common/types';
import type { AggregationMethodType } from '../analysis/field/types';

const getAggregatedMeasure = (value: any[], measure: string, agg?: AggregationMethodType): number => {
  switch (agg) {
    case 'sum': {
      return sumBy(value, measure);
    }
    case 'avg': {
      return meanBy(value, measure);
    }
    case 'min': {
      return minBy(value, measure);
    }
    case 'max': {
      return maxBy(value, measure);
    }
    case 'count': {
      return value.length;
    }
    case 'count_distinct': {
      return [...new Set(value)].length;
    }
    default: {
      return sumBy(value, measure);
    }
  }
};

const sliceAndAggregate = (
  sequence: Datum[],
  dimensions: string[],
  allDims: string[],
  measures: string[],
  result?: Datum[],
  aggMethod?: Record<string, AggregationMethodType>
): Datum[] | null => {
  if (
    sequence === null ||
    sequence?.length === 0 ||
    dimensions === null ||
    measures === null ||
    measures?.length === 0
  ) {
    return sequence;
  }
  if (aggMethod && Object.values(aggMethod).filter((agg) => agg === 'aggregate-none').length > 0) {
    return sequence;
  }

  if (!dimensions.length) {
    // terminal condition of recursion
    const obj = {};
    for (let i = 0; i < allDims.length; i += 1) {
      const dimId = allDims[i];
      obj[dimId] = sequence[0][dimId];
    }

    for (let j = 0; j < measures.length; j += 1) {
      const meaId = measures[j];
      const getAgg = () => {
        if (aggMethod) {
          return Object.prototype.hasOwnProperty.call(aggMethod, meaId) ? aggMethod[meaId] : 'sum';
        }
        return 'sum';
      };
      const agg = getAgg();
      obj[meaId] = getAggregatedMeasure(sequence, meaId, agg);
    }
    result.push(obj);
    return sequence;
  }

  const firstKey = dimensions[0];
  const restKey = dimensions.slice(1);
  const groupedRes = groupBy(sequence, firstKey);
  const res = mapValues(groupedRes, (value) => {
    return sliceAndAggregate(value, restKey, dimensions, measures, result, aggMethod);
  });
  return res;
};

export const autoAggregation = (
  sequence: Datum[],
  dimensions: string[],
  measures: string[],
  aggMethod?: Record<string, AggregationMethodType>
) => {
  const result: Datum[] = [];
  if (sequence === null || sequence?.length === 0) {
    return sequence;
  }
  if (dimensions === null || dimensions.length === 0 || measures === null || measures?.length === 0) {
    throw Error('invalid input for autoAggregation function, all the params should not be empty expect aggMethods');
  }
  if (aggMethod && Object.values(aggMethod).filter((agg) => agg === 'aggregate-none').length > 0) {
    return sequence;
  }
  sliceAndAggregate(sequence, dimensions, dimensions, measures, result, aggMethod);
  return result;
};
