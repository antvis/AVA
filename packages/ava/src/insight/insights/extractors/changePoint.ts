import { get } from 'lodash';

import { changePoint } from '../../algorithms';
import { getAlgorithmStandardInput, getNonSignificantInsight, preValidation } from '../util';

import type { ChangePointInfo, GetPatternInfo } from '../../types';

type ChangePointItem = {
  index: number;
  significance: number;
};

const SignificanceBenchmark = 0.85;

export const findChangePoints = (series: number[], significance: number = 0.15): ChangePointItem[] => {
  const results = changePoint.Bayesian(series);

  const changePointsResult: ChangePointItem[] = [];
  const benchmark = significance ? 1 - significance : SignificanceBenchmark;
  results.forEach((item) => {
    if (item?.index >= 0 && item?.significance >= benchmark) {
      changePointsResult.push(item);
    }
  });
  return changePointsResult;
};

export const getChangePointInfo: GetPatternInfo<ChangePointInfo> = (props) => {
  const valid = preValidation(props);
  const insightType = 'change_point';
  if (!valid) return getNonSignificantInsight({ insightType, infoType: 'verificationFailure' });

  const { data } = props;
  const { dimension, values, measure } = getAlgorithmStandardInput(props);
  const significance = get(props, 'options.algorithmParameter.changePoint.significance', 0.15);
  const changePoints = findChangePoints(values, significance);
  if (changePoints.length === 0) return getNonSignificantInsight({ insightType, infoType: 'noInsight' });

  const outliers: ChangePointInfo[] = changePoints.map((item) => {
    const { index, significance } = item;
    return {
      type: insightType,
      dimension,
      measure,
      significance,
      index,
      x: data[index][dimension],
      y: data[index][measure] as number,
      nonSignificantInsight: false,
    };
  });
  return outliers;
};
