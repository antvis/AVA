import _intersection from 'lodash/intersection';
import { Datum, SubjectInfo, InsightType } from '../interface';
import { DataProperty } from '../pipeline/preprocess';
import type { LevelOfMeasurement } from '@antv/ckb';

export type ExtractorChecker = (
  data: Datum[],
  subjectInfo: SubjectInfo,
  fieldPropsMap: Record<string, DataProperty>,
  lom?: LevelOfMeasurement | LevelOfMeasurement[]
) => boolean;

const generalChecker: ExtractorChecker = (data, subjectInfo, fieldPropsMap, lom) => {
  const { breakdown, measures } = subjectInfo;
  if (data?.length < 3) return false;
  if (
    Array.isArray(lom)
      ? !_intersection(fieldPropsMap[breakdown]?.levelOfMeasurements, lom as LevelOfMeasurement[])?.length
      : !fieldPropsMap[breakdown]?.levelOfMeasurements?.includes(lom as LevelOfMeasurement)
  )
    return false;
  if (measures.length !== 1) return false;
  return true;
};

export const trendChecker: ExtractorChecker = (data, subjectInfo, fieldPropsMap) => {
  return generalChecker(data, subjectInfo, fieldPropsMap, 'Time');
};

export const categoryOutlierChecker: ExtractorChecker = (data, subjectInfo, fieldPropsMap) => {
  return generalChecker(data, subjectInfo, fieldPropsMap, ['Nominal', 'Discrete', 'Ordinal']);
};

export const changePointChecker: ExtractorChecker = (data, subjectInfo, fieldPropsMap) => {
  return generalChecker(data, subjectInfo, fieldPropsMap, 'Time');
};

export const timeSeriesChecker: ExtractorChecker = (data, subjectInfo, fieldPropsMap) => {
  return generalChecker(data, subjectInfo, fieldPropsMap, 'Time');
};

export const majorityChecker: ExtractorChecker = (data, subjectInfo, fieldPropsMap) => {
  if (!generalChecker(data, subjectInfo, fieldPropsMap, ['Nominal', 'Discrete', 'Ordinal', 'Time'])) return false;
  const { measures } = subjectInfo;
  if (!['count', 'sum'].includes(measures[0].method)) return false;
  return true;
};

export const lowVarianceChecker: ExtractorChecker = (data, subjectInfo, fieldPropsMap) => {
  return generalChecker(data, subjectInfo, fieldPropsMap, ['Nominal', 'Discrete', 'Ordinal']);
};

export const ExtractorCheckers: Record<InsightType, ExtractorChecker> = {
  category_outlier: categoryOutlierChecker,
  trend: trendChecker,
  change_point: changePointChecker,
  time_series_outlier: timeSeriesChecker,
  low_variance: lowVarianceChecker,
};
