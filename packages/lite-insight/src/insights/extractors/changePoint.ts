import { BayesianChangePoint, BreakPoint, pettittPValue } from '../../algorithms';
import { SignificanceBenchmark } from '../../constant';
import { Datum, ChangePointInfo } from '../../interface';

const breakpointVerifier = (
  next: BreakPoint<number>,
  prev: BreakPoint<number>
): boolean => {
  if (Math.abs(next.data - prev.data) >= 1) {
    return true;
  }

  return false;
};

type ChangePointItem = {
  index: number;
  significance: number;
};

export const findChangePoints = (series: number[]): ChangePointItem[] => {
  const detection = new BayesianChangePoint<number>({
    breakpointVerifier
  });

  detection.exec(series);

  const testResult = detection.breakPoints().map(breakPoint => ( { index: breakPoint.index, significance: pettittPValue(series, breakPoint.index) }));


  const changePointsResult: ChangePointItem[] = [];

  testResult.forEach(item => {
    if (item?.index >= 0 && item?.significance >= SignificanceBenchmark) {
      changePointsResult.push(item);
    }
  });
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
