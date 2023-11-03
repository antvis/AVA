import { get, isNil, isString } from 'lodash';

import { coefficientOfVariance, mean } from '../../../data';
import { getAlgorithmCommonInput, getNonSignificantInsight, preValidation } from '../util';

import type { GetPatternInfo, LowVarianceInfo, LowVarianceParameter } from '../../types';

type LowVarianceItem = {
  significance: number;
  mean: number;
};

// Coefficient of variation threshold
const CV_THRESHOLD = 0.15;

export function findLowVariance(values: number[], lowVarianceParameter?: LowVarianceParameter): LowVarianceItem | null {
  const cv = coefficientOfVariance(values);

  const cvThreshold = lowVarianceParameter?.cvThreshold || CV_THRESHOLD;
  if (cv >= cvThreshold) {
    return null;
  }
  // The smaller the CV is, the greater the significance is.
  const significance = 1 - cv;
  const meanValue = mean(values);

  return {
    significance,
    mean: meanValue,
  };
}

export const getLowVarianceInfo: GetPatternInfo<LowVarianceInfo> = (props) => {
  const valid = preValidation(props);
  const insightType = 'low_variance';
  if (isString(valid))
    return getNonSignificantInsight({ detailInfo: valid, insightType, infoType: 'verificationFailure' });
  const { dimension, values, measure } = getAlgorithmCommonInput(props);
  if (isNil(dimension) || isNil(measure))
    return getNonSignificantInsight({
      detailInfo: 'Measure or dimension is empty.',
      insightType,
      infoType: 'verificationFailure',
    });

  const lowVarianceParameter = get(props, 'options.algorithmParameter.lowVariance');
  const lowVariance = findLowVariance(values, lowVarianceParameter);
  if (lowVariance) {
    const { significance, mean } = lowVariance;
    return [
      {
        type: insightType,
        dimension,
        measure,
        significance,
        mean,
        significantInsight: true,
      },
    ];
  }
  const info = `The coefficient of variance of the data is greater than ${
    lowVarianceParameter?.cvThreshold || CV_THRESHOLD
  }. The data does not follow a uniform distribution.`;
  return getNonSignificantInsight({ insightType, infoType: 'noInsight', customInfo: { info } });
};
