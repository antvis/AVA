import { changePoint } from '../../algorithms';

import type { ChangePointInfo, InsightExtractorProp } from '../../types';

type ChangePointItem = {
  index: number;
  significance: number;
};

const SignificanceBenchmark = 0.85;

export const findChangePoints = (series: number[]): ChangePointItem[] => {
  const results = changePoint.Bayesian(series);

  const changePointsResult: ChangePointItem[] = [];

  results.forEach((item) => {
    if (item?.index >= 0 && item?.significance >= SignificanceBenchmark) {
      changePointsResult.push(item);
    }
  });
  return changePointsResult;
};

export function extractor({ data, dimensions, measures }: InsightExtractorProp): ChangePointInfo[] {
  const dimension = dimensions[0];
  const measure = measures[0].fieldName;
  if (!data || data.length === 0) return [];
  const values = data.map((item) => item?.[measure] as number);
  const outliers: ChangePointInfo[] = findChangePoints(values).map((item) => {
    const { index, significance } = item;
    return {
      type: 'change_point',
      dimension,
      measure,
      significance,
      index,
      x: data[index][dimension],
      y: data[index][measure] as number,
    };
  });
  return outliers;
}
