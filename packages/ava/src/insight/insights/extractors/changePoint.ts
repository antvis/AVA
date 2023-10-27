import { get, isString } from 'lodash';

import { changePoint } from '../../algorithms';
import { getAlgorithmCommonInput, getNonSignificantInsight, preValidation } from '../util';
import { CHANGE_POINT_SIGNIFICANCE_BENCHMARK } from '../../constant';

import type { ChangePointInfo, CommonParameter, GetPatternInfo } from '../../types';

type ChangePointItem = {
  index: number;
  significance: number;
};

export const findChangePoints = (series: number[], changePointsParameter: CommonParameter): ChangePointItem[] => {
  const results = changePoint.Bayesian(series);

  const changePointsResult: ChangePointItem[] = [];
  // significanceBenchmark is equivalent to the confidence interval in hypothesis testing
  const significanceBenchmark = 1 - (changePointsParameter?.threshold ?? CHANGE_POINT_SIGNIFICANCE_BENCHMARK);
  results.forEach((item) => {
    // item.significance is similar to confidence interval
    if (item?.index >= 0 && item?.significance >= significanceBenchmark) {
      changePointsResult.push(item);
    }
  });
  return changePointsResult;
};

export const getChangePointInfo: GetPatternInfo<ChangePointInfo> = (props) => {
  const valid = preValidation(props);
  const insightType = 'change_point';
  if (isString(valid))
    return getNonSignificantInsight({ detailInfo: valid, insightType, infoType: 'verificationFailure' });

  const { data } = props;
  const { dimension, values, measure } = getAlgorithmCommonInput(props);
  const changePointsParameter = get(props, 'options.algorithmParameter.changePoint');
  const changePoints = findChangePoints(values, changePointsParameter);
  if (changePoints.length === 0) {
    const info = 'Bayesian Online Changepoint Detection does not pass.';
    return getNonSignificantInsight({ insightType, infoType: 'noInsight', customInfo: { info } });
  }

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
      significantInsight: true,
    };
  });
  return outliers;
};
