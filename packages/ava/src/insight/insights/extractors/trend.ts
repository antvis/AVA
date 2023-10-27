import regression from 'regression';
import { get, isString } from 'lodash';

import { CommonParameter, GetPatternInfo, TrendInfo } from '../../types';
import { trendDirection } from '../../algorithms';
import { getAlgorithmCommonInput, getNonSignificantInsight, preValidation } from '../util';
import { SIGNIFICANCE_LEVEL } from '../../constant';

type TrendResult = {
  significance: number;
  trend: TrendInfo['trend'];
  regression: TrendInfo['regression'];
};

export function findTimeSeriesTrend(series: number[], trendParameter: CommonParameter): TrendResult {
  const significance = trendParameter?.threshold ?? SIGNIFICANCE_LEVEL;
  const testResult = trendDirection.mkTest(series, significance);
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
}

export const getTrendInfo: GetPatternInfo<TrendInfo> = (props) => {
  const valid = preValidation(props);
  const insightType = 'trend';
  if (isString(valid))
    return getNonSignificantInsight({ detailInfo: valid, insightType, infoType: 'verificationFailure' });

  const { dimension, values, measure } = getAlgorithmCommonInput(props);
  const trendParameter = get(props, 'options.algorithmParameter.trend');
  const result: TrendResult = findTimeSeriesTrend(values, trendParameter);
  return [
    {
      ...result,
      type: 'trend',
      dimension,
      measure,
      ...(result.trend === 'no trend'
        ? {
            significantInsight: false,
            info: `The Mann-Kendall (MK) test does not pass at the specified significance level ${
              trendParameter?.threshold ?? SIGNIFICANCE_LEVEL
            }.`,
          }
        : {
            significantInsight: true,
          }),
    },
  ];
};
