import _intersection from 'lodash/intersection';
import { Datum, SubjectInfo, InsightType } from '../interface';
import { DataProperty } from '../pipeline/preprocess';

export type ExtractorChecker = (
  data: Datum[],
  subjectInfo: SubjectInfo,
  fieldPropsMap: Record<string, DataProperty>
) => boolean;

export const trendChecker: ExtractorChecker = (data, subjectInfo, fieldPropsMap) => {
  const { breakdown, measures } = subjectInfo;
  if (data?.length < 3) return false;
  if (!fieldPropsMap[breakdown]?.levelOfMeasurements?.includes('Time')) return false;
  if (measures.length !== 1) return false;
  return true;
};

export const categoryOutlierChecker: ExtractorChecker = (data, subjectInfo, fieldPropsMap) => {
  const { breakdown, measures } = subjectInfo;
  if (data?.length < 3) return false;
  if (!_intersection(fieldPropsMap[breakdown]?.levelOfMeasurements, ['Nominal', 'Discrete', 'Ordinal'])?.length)
    return false;
  if (measures.length !== 1) return false;
  return true;
};

export const changePointChecker: ExtractorChecker = (data, subjectInfo, fieldPropsMap) => {
  const { breakdown, measures } = subjectInfo;
  if (data?.length < 3) return false;
  if (!fieldPropsMap[breakdown]?.levelOfMeasurements?.includes('Time')) return false;
  if (measures.length !== 1) return false;
  return true;
};

export const timeSeriesChecker: ExtractorChecker = (data, subjectInfo, fieldPropsMap) => {
  const { breakdown, measures } = subjectInfo;
  if (data?.length < 3) return false;
  if (!fieldPropsMap[breakdown]?.levelOfMeasurements?.includes('Time')) return false;
  if (measures.length !== 1) return false;
  return true;
};

export const majorityChecker: ExtractorChecker = (data, subjectInfo, fieldPropsMap) => {
  const { breakdown, measures } = subjectInfo;
  if (data?.length < 3) return false;
  if (!_intersection(fieldPropsMap[breakdown]?.levelOfMeasurements, ['Nominal', 'Discrete', 'Ordinal'])?.length)
    return false;
  if (fieldPropsMap[breakdown]?.levelOfMeasurements?.includes('Time')) return false;
  if (measures.length !== 1) return false;
  if (!['count', 'sum'].includes(measures[0].method)) return false;
  return true;
};

export const lowVarianceChecker: ExtractorChecker = (data, subjectInfo, fieldPropsMap) => {
  const { breakdown, measures } = subjectInfo;
  if (data?.length < 3) return false;
  if (!_intersection(fieldPropsMap[breakdown]?.levelOfMeasurements, ['Nominal', 'Discrete', 'Ordinal'])?.length)
    return false;
  if (measures.length !== 1) return false;
  return true;
};

export const ExtractorCheckers: Record<InsightType, ExtractorChecker> = {
  category_outlier: categoryOutlierChecker,
  trend: trendChecker,
  change_point: changePointChecker,
  time_series_outlier: timeSeriesChecker,
  low_variance: lowVarianceChecker,
};
