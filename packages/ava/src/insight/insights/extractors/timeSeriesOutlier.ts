import { get, isNil, isString } from 'lodash';

import { distinct, lowess } from '../../../data';
import { LowessOutput } from '../../../data/statistics/types';
import { LOWESS_N_STEPS } from '../../constant';
import { getAlgorithmCommonInput, getNonSignificantInsight, preValidation } from '../util';

import { findOutliers } from './categoryOutlier';

import type { GetPatternInfo, OutlierParameter, TimeSeriesOutlierInfo } from '../../types';

type OutlierItem = {
  index: number;
  significance: number;
  value: number;
};

// detect the outliers using LOWESS
function findTimeSeriesOutliers(
  values: number[],
  outlierParameter?: OutlierParameter
): {
  outliers: OutlierItem[];
  baselines: LowessOutput['y'];
  thresholds: [number, number];
} {
  const indexes = Array(values.length)
    .fill(0)
    .map((_, index) => index);
  const baseline = lowess(indexes, values, { nSteps: LOWESS_N_STEPS });
  const residuals = values.map((item, index) => item - baseline.y[index]);
  const { outliers, thresholds } = findOutliers(residuals, outlierParameter);
  return { outliers, baselines: baseline.y, thresholds };
}

export const getTimeSeriesOutlierInfo: GetPatternInfo<TimeSeriesOutlierInfo> = (props) => {
  const valid = preValidation(props);
  const insightType = 'time_series_outlier';
  if (isString(valid))
    return getNonSignificantInsight({ detailInfo: valid, insightType, infoType: 'verificationFailure' });

  const { data } = props;
  const { dimension, values, measure } = getAlgorithmCommonInput(props);
  if (isNil(dimension) || isNil(measure))
    return getNonSignificantInsight({
      detailInfo: 'Measure or dimension is empty.',
      insightType,
      infoType: 'verificationFailure',
    });

  if (distinct(values) === 1) return getNonSignificantInsight({ insightType, infoType: 'noInsight' });

  const outlierParameter = get(props, 'options.algorithmParameter.outlier');
  const { outliers, baselines, thresholds } = findTimeSeriesOutliers(values, outlierParameter);

  if (outliers.length === 0)
    return getNonSignificantInsight({
      insightType,
      infoType: 'noInsight',
      customInfo: {
        baselines,
        thresholds,
        dimension,
        measure,
        info: 'No outliers were found.',
      },
    });

  const timeSeriesOutliers: TimeSeriesOutlierInfo[] = outliers.map((item) => {
    const { index, significance } = item;
    return {
      type: insightType,
      dimension,
      measure,
      significance,
      index,
      x: data[index][dimension],
      y: data[index][measure] as number,
      baselines,
      thresholds,
      significantInsight: true,
    };
  });
  return timeSeriesOutliers;
};
