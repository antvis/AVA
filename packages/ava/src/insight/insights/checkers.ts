import { intersection } from 'lodash';

import { Datum, SubjectInfo, InsightType, DataProperty } from '../types';
import { NumberFieldInfo } from '../../data';

import type { LevelOfMeasurement } from '../../ckb';

export type ExtractorChecker = (props: {
  data: Datum[];
  subjectInfo: SubjectInfo;
  fieldPropsMap: Record<string, DataProperty>;
  lom?: LevelOfMeasurement | LevelOfMeasurement[];
}) => true | string;

const fieldsQuantityChecker = (subjectInfo: SubjectInfo, dimensionsQuantity: number, measuresQuantity: number) => {
  const { dimensions, measures } = subjectInfo;
  if (dimensions.length === dimensionsQuantity && measures.length === measuresQuantity) return true;
  return false;
};

const generalCheckerFor1M1D: ExtractorChecker = ({ data, subjectInfo, fieldPropsMap, lom }) => {
  const { dimensions } = subjectInfo;
  // check data length
  if (data?.length < 3) return 'The data length is less than 3. ';
  // check field quantity
  if (!fieldsQuantityChecker(subjectInfo, 1, 1)) return 'The length of the measure or dimension is not 1. ';
  // check dimension type
  if (
    Array.isArray(lom)
      ? !intersection(fieldPropsMap[dimensions[0]]?.levelOfMeasurements, lom as LevelOfMeasurement[])?.length
      : !fieldPropsMap[dimensions[0]]?.levelOfMeasurements?.includes(lom as LevelOfMeasurement)
  )
    return `The type of the dimension field is not included in the option ${Array.isArray(lom) ? lom : [lom]}. `;
  return true;
};

export const trendChecker: ExtractorChecker = ({ data, subjectInfo, fieldPropsMap }) => {
  return generalCheckerFor1M1D({ data, subjectInfo, fieldPropsMap, lom: 'Time' });
};

export const categoryOutlierChecker: ExtractorChecker = ({ data, subjectInfo, fieldPropsMap }) => {
  return generalCheckerFor1M1D({ data, subjectInfo, fieldPropsMap, lom: ['Nominal', 'Discrete', 'Ordinal'] });
};

export const changePointChecker: ExtractorChecker = ({ data, subjectInfo, fieldPropsMap }) => {
  return generalCheckerFor1M1D({ data, subjectInfo, fieldPropsMap, lom: 'Time' });
};

export const timeSeriesChecker: ExtractorChecker = ({ data, subjectInfo, fieldPropsMap }) => {
  return generalCheckerFor1M1D({ data, subjectInfo, fieldPropsMap, lom: 'Time' });
};

export const majorityChecker: ExtractorChecker = ({ data, subjectInfo, fieldPropsMap }) => {
  const checkerFor1M1D = generalCheckerFor1M1D({
    data,
    subjectInfo,
    fieldPropsMap,
    lom: ['Nominal', 'Discrete', 'Ordinal', 'Time'],
  });
  if (checkerFor1M1D !== true) return checkerFor1M1D;
  const { measures } = subjectInfo;
  if (!['count', 'sum'].includes(measures[0].method)) return 'Measure is not aggregated in sum or count mode. ';
  return true;
};

export const lowVarianceChecker: ExtractorChecker = ({ data, subjectInfo, fieldPropsMap }) => {
  const checkerFor1M1D = generalCheckerFor1M1D({
    data,
    subjectInfo,
    fieldPropsMap,
    lom: ['Nominal', 'Discrete', 'Ordinal'],
  });
  if (checkerFor1M1D !== true) return checkerFor1M1D;
  const { measures } = subjectInfo;
  // 低方差检验使用变异系数 sigma/mean 作为检验统计量，要求均值不能为0
  if (['float', 'integer'].includes(fieldPropsMap[measures[0].fieldName].recommendation)) {
    if ((fieldPropsMap[measures[0].fieldName] as NumberFieldInfo).mean !== 0) return true;
    return 'The low variance test uses the coefficient of variation sigma/mean as the test statistic and requires that the mean cannot be 0. ';
  }
  return 'The recommended data type of measure is not float or integer. ';
};

export const correlationChecker: ExtractorChecker = ({ data, subjectInfo, fieldPropsMap }) => {
  const { measures } = subjectInfo;
  // check data length
  if (data?.length < 3) return 'The data length is less than 3. ';
  // check field quantity
  if (measures.length !== 2) return 'The length of the measure or dimension is not 2. ';
  if (
    !fieldPropsMap[measures[0].fieldName].levelOfMeasurements?.includes('Continuous') ||
    !fieldPropsMap[measures[1].fieldName].levelOfMeasurements?.includes('Continuous')
  )
    return 'Level of measure is not continuous. ';
  return true;
};

export const ExtractorCheckers: Partial<Record<InsightType, ExtractorChecker>> = {
  category_outlier: categoryOutlierChecker,
  trend: trendChecker,
  change_point: changePointChecker,
  time_series_outlier: timeSeriesChecker,
  low_variance: lowVarianceChecker,
  correlation: correlationChecker,
};
