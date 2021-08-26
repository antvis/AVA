// @ts-ignore
import Loess from 'loess';
import { SignificanceBenchmark } from '../../constant';
import { Datum, OutlierInfo } from '../../interface';
import { calculatePValue } from '../util';

type OutlierCandidate = {
  index: number;
  outerPercent: number;
  value: number;
  fitted: number[]; // fitted curves
};

// detect the outliers using LOESS (locally weighted smoothing)
export const getLoessOutliers = (values: number[]): OutlierCandidate[] => {
  const indexes = Array(values.length)
    .fill(0)
    .map((_, index) => index);
  const data = { x: indexes, y: values };
  const options = { span: 0.5, band: 0.8, degree: 1 };
  const model = new Loess(data, options);
  const fit = model.predict();
  const fitted = fit.fitted as number[];
  const upperLimit = fitted.map((yhat, idx) => yhat + fit.halfwidth[idx]);
  const lowerLimit = fitted.map((yhat, idx) => yhat - fit.halfwidth[idx]);

  const candidates: OutlierCandidate[] = [];
  values.forEach((item, index) => {
    const lowerThreshold = lowerLimit[index];
    const upperThreshold = upperLimit[index];
    if (item < lowerThreshold || item > upperThreshold) {
      const span = upperThreshold - lowerThreshold;
      if (span) {
        candidates.push({
          index,
          value: item,
          outerPercent: (item < lowerThreshold ? lowerThreshold - item : item - upperThreshold) / span,
          fitted,
        });
      }
    }
  });

  return candidates.sort((a, b) => a.outerPercent - b.outerPercent);
};

export const findTimeSeriesOutliers = (data: Datum[], measureKey: string): OutlierInfo[] => {
  if (!data || data.length === 0) return [];
  const values = data.map((item) => item?.[measureKey] as number);

  const outliers = getLoessOutliers(values);

  const result: OutlierInfo[] = [];

  for (let i = 0; i < outliers.length; i += 1) {
    const candidate = outliers[i];
    const pValue = calculatePValue(candidate.fitted, candidate.value);
    const significance = 1 - pValue;

    if (significance > SignificanceBenchmark) {
      result.push({
        index: candidate.index,
        value: candidate.value,
        type: 'time_series_outlier',
        significance,
      });
    }
  }
  return result;
};
