import { pettittTest } from '../../algorithms';
import { SignificanceBenchmark } from '../../constant';
import { Datum, ChangePointInfo } from '../../interface';

type ChangePointItem = {
  index: number;
  significance: number;
};

export const findChangePoints = (series: number[]): ChangePointItem[] => {
  const testResult = pettittTest(series);

  const changePointsResult: ChangePointItem[] = [];

  if (testResult.index >= 0 && testResult.significance >= SignificanceBenchmark) {
    changePointsResult.push(testResult);
  }
  return changePointsResult;
};

export const extractor = (data: Datum[], dimension: string, measure: string): ChangePointInfo[] => {
  if (!data || data.length === 0) return [];
  const values = data.map((item) => item?.[measure] as number);
  const outliers = findChangePoints(values).map(item => {
    const { index, significance } = item;
    return {
      type: 'change_point',
      dimension,
      measure,
      significance,
      index,
      x: data[index][dimension],
      y: data[index][measure] as number
    };
  });
  return outliers;
};
