import { get, orderBy } from 'lodash';

import { distinct, mean } from '../../../data';
import { categoryOutlier } from '../../algorithms';
import { IQR_K, SIGNIFICANCE_BENCHMARK } from '../../constant';
import { CategoryOutlierInfo, GetPatternInfo, OutlierParams } from '../../types';
import {
  calculatePValue,
  calculateOutlierThresholds,
  preValidation,
  getAlgorithmStandardInput,
  getNonSignificantInsight,
} from '../util';

type OutlierItem = {
  index: number;
  significance: number;
  value: number;
};

export const findOutliers = (
  values: number[],
  outlierOptions?: OutlierParams
): { outliers: OutlierItem[]; thresholds: [number, number] } => {
  const { method, iqrK, confidenceInterval = SIGNIFICANCE_BENCHMARK } = outlierOptions || {};
  const outliers: OutlierItem[] = [];
  const thresholds = [];
  const candidates = values.map((item, index) => {
    return { index, value: item };
  });
  if (method !== 'p-value') {
    const IQRResult = categoryOutlier.IQR(values, { k: iqrK ?? IQR_K });
    const lowerOutlierIndexes = IQRResult.lower.indexes;
    const upperOutlierIndexes = IQRResult.upper.indexes;
    [...lowerOutlierIndexes, ...upperOutlierIndexes].forEach((index) => {
      const value = values[index];
      const pValue = (candidates.findIndex((item) => item.value === value) + 1) / values.length;
      // two-sided
      const significance = pValue > 0.5 ? pValue : 1 - pValue;
      outliers.push({
        index,
        value,
        significance,
      });
    });
    thresholds.push(IQRResult.lower.threshold, IQRResult.upper.threshold);
  } else {
    const sortedCandidates = orderBy(candidates, (item) => Math.abs(mean(values) - item.value), ['desc']);
    thresholds.push(...calculateOutlierThresholds(values, confidenceInterval, 'two-sided'));

    for (let i = 0; i < sortedCandidates.length; i += 1) {
      const candidate = sortedCandidates[i];
      const { value, index } = candidate;
      const pValue = calculatePValue(values, value, 'two-sided');

      const significance = 1 - pValue;

      if (significance < confidenceInterval) {
        break;
      }

      outliers.push({
        index,
        value,
        significance,
      });
    }
  }

  return { outliers, thresholds: thresholds as [number, number] };
};

export const getCategoryOutlierInfo: GetPatternInfo<CategoryOutlierInfo> = (props) => {
  const valid = preValidation(props);
  const insightType = 'category_outlier';
  if (!valid) return getNonSignificantInsight({ insightType, infoType: 'verificationFailure' });
  const { dimension, values, measure } = getAlgorithmStandardInput(props);
  const noInsightResult = getNonSignificantInsight({ insightType, infoType: 'noInsight' });
  if (distinct(values) === 1) return noInsightResult;

  const { data } = props;
  const outlierOptions = get(props, 'options.algorithmParameter.outlier');
  const { outliers } = findOutliers(values, outlierOptions);
  if (outliers.length === 0) return noInsightResult;

  const categoryOutliers: CategoryOutlierInfo[] = outliers.map((item) => {
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
  return categoryOutliers;
};
