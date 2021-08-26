// @ts-ignore
import regression from 'regression';
import { Datum, TrendInfo } from '../../interface';
import { mkTest } from '../../algorithms';

export const findTimeSeriesTrend = (data: Datum[], measureKey: string): TrendInfo[] => {
  if (!data || data.length === 0) return [];
  const result: TrendInfo[] = [];
  const dataArr = data.map((item) => item?.[measureKey] as number);
  const testResult = mkTest(dataArr, 0.05);
  const { pValue, trend } = testResult;

  if (trend !== 'no trend') {
    const regressionResult = regression.linear(dataArr.map((item, index) => [index, item]));
    const { r2, points, equation } = regressionResult;
    result.push({
      trend,
      significance: 1 - pValue,
      regression: {
        r2,
        points: points.map((item: [number, number]) => item[1]),
        equation,
      },
      type: 'trend',
    });
  }
  return result;
};
