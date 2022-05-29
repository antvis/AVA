import { meanBy, sumBy, minBy, maxBy, groupBy, sum, mean, min, max } from '../../statistics';
import { DataFrame } from '..';

type Datum = Record<string, string | number>[];

const getAggregatedMeasure = (value: any[], measure: string, agg?: string): number => {
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

const aggregateArray = (value: number[], agg?: string): number => {
  switch (agg) {
    case 'sum': {
      return sum(value);
    }
    case 'avg': {
      return mean(value);
    }
    case 'min': {
      return min(value);
    }
    case 'max': {
      return max(value);
    }
    case 'count': {
      return value.length;
    }
    case 'count_distinct': {
      return [...new Set(value)].length;
    }
    default: {
      return sum(value);
    }
  }
};

export const aggregateDataFrame = (
  inputData: DataFrame,
  dimensions: string[] | any[],
  measures: string[] | any[],
  aggMethod?: Record<string, string>
): DataFrame => {
  const tempResult = {};
  const dimensionsIndex = dimensions.map((item) => inputData.axes[1].indexOf(item));
  const measuresIndex = measures.map((item) => inputData.axes[1].indexOf(item));

  inputData.data.forEach((item) => {
    const tempKeyList = [];
    for (let i = 0; i < dimensionsIndex.length; i += 1) {
      const dimColId = dimensionsIndex[i];
      tempKeyList.push(item[dimColId]);
    }
    const tempKey = tempKeyList.join('-');

    if (!Object.prototype.hasOwnProperty.call(tempResult, tempKey)) {
      tempResult[tempKey] = {};
      for (let i = 0; i < dimensionsIndex.length; i += 1) {
        const dimColId = dimensionsIndex[i];
        tempResult[tempKey][dimColId] = item[dimColId];
      }
      for (let j = 0; j < measuresIndex.length; j += 1) {
        const agg =
          aggMethod && Object.prototype.hasOwnProperty.call(aggMethod, measures[j]) ? aggMethod[measures[j]] : 'sum';
        tempResult[tempKey][measuresIndex[j]] = {
          data: [],
          agg,
        };
      }
    }

    for (let j = 0; j < measuresIndex.length; j += 1) {
      tempResult[tempKey][measuresIndex[j]].data.push(item[measuresIndex[j]]);
    }
  });

  const result = Object.values(tempResult).map((item) => {
    const temp = item;
    for (let j = 0; j < measuresIndex.length; j += 1) {
      const meaId = measuresIndex[j];
      temp[meaId] = aggregateArray(item[meaId].data, item[meaId].agg);
    }
    const datum = {};
    Object.keys(temp).forEach((index) => {
      datum[inputData.axes[1][index]] = temp[index];
      return null;
    });
    return datum;
  });
  return new DataFrame(Object.values(result));
};

export const sliceAndAggregate = (
  sequence: Datum,
  dimensions: string[],
  measures: string[],
  result: Datum,
  aggMethod?: Record<string, string>
): Datum => {
  if (!dimensions.length) {
    // terminal condition of recursion
    const obj = {};
    for (let i = 0; i < dimensions.length; i += 1) {
      const dimId = dimensions[i];
      obj[dimId] = sequence[0][dimId];
    }

    for (let j = 0; j < measures.length; j += 1) {
      const meaId = measures[j];
      const agg = Object.prototype.hasOwnProperty.call(aggMethod, meaId) ? aggMethod[meaId] : 'sum';
      obj[meaId] = getAggregatedMeasure(sequence, meaId, agg);
    }
    result.push(obj);
    return sequence;
  }

  const firstKey = dimensions[0];
  const restKey = dimensions.slice(1);
  return groupBy(sequence, firstKey).map((value) => {
    return sliceAndAggregate(value, restKey, measures, result, aggMethod);
  });
};
