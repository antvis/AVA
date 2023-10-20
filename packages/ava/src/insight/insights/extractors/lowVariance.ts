import { get } from 'lodash';

import { coefficientOfVariance, mean } from '../../../data';
import { getAlgorithmStandardInput, getNonSignificantInsight, preValidation } from '../util';

import type { GetPatternInfo, LowVarianceInfo, LowVarianceParams } from '../../types';

type LowVarianceItem = {
  significance: number;
  mean: number;
};

// Coefficient of variation threshold
const CV_THRESHOLD = 0.15;

export function findLowVariance(values: number[], params?: LowVarianceParams): LowVarianceItem | null {
  const cv = coefficientOfVariance(values);

  const cvThreshold = params?.cvThreshold || CV_THRESHOLD;
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
  if (!valid) return getNonSignificantInsight({ insightType, infoType: 'verificationFailure' });
  const { dimension, values, measure } = getAlgorithmStandardInput(props);
  const customOptions = get(props, 'options.algorithmParameter.lowVariance');
  const lowVariance = findLowVariance(values, customOptions);
  if (lowVariance) {
    const { significance, mean } = lowVariance;
    return [
      {
        type: insightType,
        dimension,
        measure,
        significance,
        mean,
        nonSignificantInsight: false,
      },
    ];
  }
  return getNonSignificantInsight({ insightType, infoType: 'noInsight' });
};
