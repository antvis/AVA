import { mean } from 'lodash';

import { standardDeviation, cdf, normalDistributionQuantile, max, min } from '../../data';
import {
  AlgorithmStandardInput,
  DataProperty,
  InsightExtractorProps,
  InsightType,
  NoPatternInfo,
  PatternInfo,
  PreValidationProps,
} from '../types';
import { dataToDataProps } from '../pipeline/preprocess';
import { NO_PATTERN_INFO, VERIFICATION_FAILURE_INFO } from '../constant';

import { ExtractorCheckers } from './checkers';

export const calculatePValue = (
  values: number[],
  target: number,
  alternative: 'two-sided' | 'less' | 'greater' = 'two-sided'
) => {
  const meanValue = mean(values);
  const std = standardDeviation(values);
  const cdfValue = cdf(target, meanValue, std);
  if (alternative === 'two-sided') return cdfValue < 0.5 ? 2 * cdfValue : 2 * (1 - cdfValue);
  if (alternative === 'less') return cdfValue;
  return 1 - cdfValue;
};

export const calculateOutlierThresholds = (
  values: number[],
  significance: number,
  alternative: 'two-sided' | 'less' | 'greater' = 'two-sided'
): [number, number] => {
  const meanValue = mean(values);
  const std = standardDeviation(values);
  const p = 1 - significance;
  if (alternative === 'greater') return [normalDistributionQuantile(significance, meanValue, std), max(values)];
  if (alternative === 'less') return [min(values), normalDistributionQuantile(p, meanValue, std)];
  return [
    normalDistributionQuantile(p / 2, meanValue, std),
    normalDistributionQuantile(significance + p / 2, meanValue, std),
  ];
};

export const getAlgorithmStandardInput = ({
  data,
  dimensions,
  measures,
}: InsightExtractorProps): AlgorithmStandardInput => {
  const dimension = dimensions[0];
  const measure = measures[0].fieldName;
  const values = data.map((item) => item?.[measure] as number);
  return { dimension, measure, values };
};

export const preValidation = ({ data, dimensions, measures, options, insightType }: PreValidationProps) => {
  const { dataValidation = false, dataProcessInfo } = options || {};
  if (!data || data.length === 0) return false;
  if (!dataValidation) return true;
  const filteredData = data.filter((item) => !Object.values(item).some((v) => v === null || v === undefined));
  const dataProps = dataToDataProps(filteredData, dataProcessInfo);
  const fieldPropsMap: Record<string, DataProperty> = dataProps.reduce((acc, item) => {
    acc[item.name] = item;
    return acc;
  }, {});
  const checker = ExtractorCheckers[insightType];
  if (!checker) return true;
  const valid = checker({
    data,
    subjectInfo: { dimensions, measures, subspace: [] },
    fieldPropsMap,
  });
  return valid;
};

export const getNonSignificantInsight = ({
  infoType,
  insightType,
  customInfo = {},
}: {
  insightType: InsightType;
  infoType: 'verificationFailure' | 'noInsight';
  customInfo?: Record<string, any>;
}): [NoPatternInfo] => {
  return [
    {
      nonSignificantInsight: true,
      type: insightType,
      info: infoType === 'noInsight' ? NO_PATTERN_INFO : VERIFICATION_FAILURE_INFO,
      ...customInfo,
    },
  ];
};

export const pickValidPattern = (infos: PatternInfo[] = []): PatternInfo[] => {
  return infos.filter((info) => !info.nonSignificantInsight);
};
