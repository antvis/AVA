import regression from 'regression';
import { Datum, Measure, TrendInfo } from '../../interface';
import { mkTest } from '../../algorithms';

type TrendResult = {
  significance: number;
  trend: TrendInfo['trend'];
  regression: TrendInfo['regression'];
};

export const findTimeSeriesTrend = (series: number[]): TrendResult => {
  const testResult = mkTest(series, 0.05);
  const { pValue, trend } = testResult;

  const regressionResult = regression.linear(series.map((item, index) => [index, item]));
  const { r2, points, equation } = regressionResult;
  return {
    trend,
    significance: 1 - pValue,
    regression: {
      r2,
      points: points.map((item) => item[1]),
      equation,
    },
  };
};

export const extractor = (data: Datum[], dimensions: string[], measures: Measure[]): TrendInfo[] => {
  const dimension = dimensions[0];
  const measure = measures[0].field;
  if (!data || data.length === 0) return [];
  const values = data.map((item) => item?.[measure] as number);
  const result = findTimeSeriesTrend(values);
  if (result.trend !== 'no trend') {
    return [
      {
        ...result,
        type: 'trend',
        dimension,
        measure,
      },
    ];
  }
  return [];
};
