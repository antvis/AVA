import regression from 'regression';
import { get } from 'lodash';

import { GetPatternInfo, TrendInfo } from '../../types';
import { trendDirection } from '../../algorithms';
import { getAlgorithmStandardInput, getNonSignificantInsight, preValidation } from '../util';

type TrendResult = {
  significance: number;
  trend: TrendInfo['trend'];
  regression: TrendInfo['regression'];
};

export function findTimeSeriesTrend(series: number[], significance: number = 0.05): TrendResult {
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
  if (!valid) return getNonSignificantInsight({ insightType, infoType: 'verificationFailure' });

  const { dimension, values, measure } = getAlgorithmStandardInput(props);
  const significance = get(props, 'options.algorithmParameter.trend.significance', 0.05);
  const result: TrendResult = findTimeSeriesTrend(values, significance);
  return [
    {
      ...result,
      type: 'trend',
      dimension,
      measure,
      nonSignificantInsight: result.trend === 'no trend',
    },
  ];
};
