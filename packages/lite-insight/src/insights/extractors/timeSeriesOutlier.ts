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

type OutlierItem = {
  index: number;
  significance: number;
  value: number;
};

// detect the outliers using LOESS (locally weighted smoothing)
const getLoessOutliers = (values: number[]): OutlierCandidate[] => {
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

export const findTimeSeriesOutliers = (series: number[]): OutlierItem[] => {
  const outliers = getLoessOutliers(series);

  const results: OutlierItem[] = [];

  for (let i = 0; i < outliers.length; i += 1) {
    const candidate = outliers[i];
    const pValue = calculatePValue(candidate.fitted, candidate.value);
    const significance = 1 - pValue;

    if (significance > SignificanceBenchmark) {
      results.push({
        index: candidate.index,
        value: candidate.value,
        significance,
      });
    }
  }
  return results;
};

export const extractor = (data: Datum[], dimension: string, measure: string): OutlierInfo[] => {
  if (!data || data.length === 0) return [];
  const values = data.map((item) => item?.[measure] as number);
  const outliers = findTimeSeriesOutliers(values).map((item) => {
    const { index, significance } = item;
    return {
      type: 'time_series_outlier',
      dimension,
      measure,
      significance,
      index,
      x: data[index][dimension],
      y: data[index][measure] as number,
    };
  });
  return outliers;
};
