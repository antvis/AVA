import _groupBy from 'lodash/groupBy';
import _uniq from 'lodash/uniq';
import _flatten from 'lodash/flatten';
import Heap from 'heap-js';
import { PATTERN_TYPES, InsightScoreBenchmark, ImpactScoreWeight } from '../constant';
import { insightExtractors, ExtractorCheckers } from '../insights';
import { Datum, InsightOptions, Measure, InsightInfo, ImpactMeasure, SubjectInfo, InsightType, PatternInfo, HomogeneousPatternInfo } from '../interface';
import { aggregate } from '../utils/aggregate';
import {
  DataProperty,
  calculateImpactValue,
} from './preprocess';
import { extractHomogeneousPatternsForMeausres, extractHomogeneousPatternsForSiblingGroups, PatternCollection } from './homogeneous';

interface ReferenceInfo {
  fieldPropsMap: Record<string, DataProperty>;
  impactMeasureReferences: Record<string, number>;
}

/** calculate the Impact which reflects the importance of the subject of an insight against the entire dataset  */
const computeSubjectImpact = (
  data: Datum[],
  subjectInfo: SubjectInfo,
  impactMeasureReferences: ReferenceInfo['impactMeasureReferences'],
  measures?: ImpactMeasure[]
) => {
  if (!measures?.length || !subjectInfo) return 1;
  const impactValues = measures.map((measure) => {
    const measureValue = calculateImpactValue(data, measure);
    const referenceKey = `${measure.field}@${measure.method}`;
    const referenceValue = impactMeasureReferences[referenceKey];
    return measureValue / referenceValue;
  });
  return Math.max(...impactValues);
};

/** extract patterns from a specific subject */
const extractPatternsFromSubject = (
  data: Datum[],
  subjectInfo: SubjectInfo,
  fieldPropsMap: Record<string, DataProperty>,
  options?: InsightOptions
): PatternCollection => {
  const { measures, breakdown, } = subjectInfo;

  const enumInsightTypes = options?.insightTypes || PATTERN_TYPES;

  const patterns: Record<InsightType, PatternInfo[]> = {};


  enumInsightTypes.forEach((insightType) => {
    const insightExtractorChecker = ExtractorCheckers[insightType];
    let isValid = true;

    // Check whether the data requirements of the extractor are met
    if (insightExtractorChecker) {
      if (!insightExtractorChecker(data, subjectInfo, fieldPropsMap)) isValid = false;
    }
    const insightExtractor = insightExtractors[insightType];
    if (isValid && insightExtractor) {
      const extractedPatterns = insightExtractor(data, breakdown, measures[0]?.field);
      patterns[insightType] = extractedPatterns;
    } else {
      patterns[insightType] = null;
    }
  });

  return patterns;
};

/** recursive enumeration of insight subjects */
const enumerateInsightSubjectsRecursive = (
  data: Datum[],
  subjectInfo: SubjectInfo,
  referenceInfo: ReferenceInfo,
  insightsHeap: Heap<InsightInfo<PatternInfo>>,
  metaInsightsHeap: Heap<InsightInfo<HomogeneousPatternInfo>>,
  options?: InsightOptions
): InsightInfo<PatternInfo>[] => {
  const { fieldPropsMap, impactMeasureReferences } = referenceInfo;
  const subjectImportance = computeSubjectImpact(data, subjectInfo, impactMeasureReferences, options?.impactMeasures);

  // check the subject importance
  if (subjectImportance < InsightScoreBenchmark) {
    return [];
  }

  const impactScoreWeight = (options?.impactWeight >= 0 && options?.impactWeight < 1) ? options.impactWeight : ImpactScoreWeight;

  /** enumerate insights of the subject itself */
  const { breakdown, subspace, measures } = subjectInfo;

  const groupedData = _groupBy(data, breakdown);

  const insightsForMeasures = [];

  /** ① 1M1D pattern search  */
  const patternsForMeasures = [];
  measures.forEach((measure) => {
    const childSubjectInfo = { breakdown, subspace, measures: [measure] };

    const aggregatedData = aggregate(data, breakdown, [measure]);

    const patterns = extractPatternsFromSubject(aggregatedData, childSubjectInfo, fieldPropsMap, options);

    patternsForMeasures.push(patterns);

    const patternsArray = _flatten(Object.values(patterns).filter(item => item?.length > 0)).sort((a, b) => b.significance - a.significance);
    ;

    if (patternsArray.length) {
      const insight = {
        subspaces: [subspace],
        breakdowns: [breakdown],
        measures: [measure],
        patterns: patternsArray,
        data: aggregatedData,
        score: patternsArray[0].significance * (1 - impactScoreWeight) + subjectImportance * impactScoreWeight,
      };
      insightsForMeasures.push(insight);
      insightsHeap.add(insight);
    } else {
      insightsForMeasures.push(null);
    }
  });

  /** ② homogeneous patterns in measures */
  if (options?.homogeneous) {
    const homogeneousPatternsForMeasures = extractHomogeneousPatternsForMeausres(measures, patternsForMeasures);
    if (homogeneousPatternsForMeasures.length > 0) {
      const homogeneousInsights: InsightInfo<HomogeneousPatternInfo>[] = homogeneousPatternsForMeasures.map(pattern => ({
        subspaces: [subspace],
        breakdowns: [breakdown],
        measures,
        patterns: [pattern],
        data,
        score: pattern.significance * subjectImportance,
      }));
      metaInsightsHeap.addAll(homogeneousInsights);
    }
  }

  /** ③ TODO NM pattern search */

  /** ④ enumerate insights of the sibling group */
  const searchedDimensions = subspace.map((item) => item.dimension).concat(breakdown);
  const remainDimensionFields = (
    options?.dimensions ||
    Object.values(fieldPropsMap)
      .filter((item) => item.fieldType === 'dimension')
      .map((item) => item.name)
  ).filter((field) => !searchedDimensions.includes(field));

  const breakdownValues = _uniq(fieldPropsMap[breakdown].samples);
  if (remainDimensionFields.length === 0 || breakdownValues.length < 2) {
    return insightsForMeasures;
  }

  remainDimensionFields.forEach((dimension) => {
    const siblingGroupInsights = [];
    breakdownValues.forEach((value) => {
      const childSubspace = [...subspace, { dimension: breakdown, value }];
      const childInsights = enumerateInsightSubjectsRecursive(
        groupedData[value],
        {
          breakdown: dimension,
          subspace: childSubspace,
          measures,
        },
        referenceInfo,
        insightsHeap,
        metaInsightsHeap,
        options
      );
      siblingGroupInsights.push(childInsights);
    });

    /** ⑤ homogeneous patterns in sibling groups */
    if (options?.homogeneous) {
      const homogeneousPatternsForSiblingGroups = extractHomogeneousPatternsForSiblingGroups(measures, breakdownValues, siblingGroupInsights);
      homogeneousPatternsForSiblingGroups.forEach((patternGroup, measureIndex) => {
        const insightsForMeasure = patternGroup.map((pattern) => ({
          subspaces: [subspace],
          breakdowns: [breakdown, dimension],
          measures: [measures[measureIndex]],
          patterns: [pattern],
          data,
          score: pattern.significance * subjectImportance,
        }));
        metaInsightsHeap.addAll(insightsForMeasure);
      });
    }
  });

  return insightsForMeasures;
};

/** insight subject enumeration in the data */
export const enumerateInsights = (
  data: Datum[],
  dimensions: string[],
  measures: Measure[],
  referenceInfo: ReferenceInfo,
  insightsHeap: Heap<InsightInfo<PatternInfo>>,
  metaInsightsHeap: Heap<InsightInfo<HomogeneousPatternInfo>>,
  options: InsightOptions
) => {
  const initSubspace = [];

  dimensions.forEach((dimension) => {
    enumerateInsightSubjectsRecursive(
      data,
      {
        breakdown: dimension,
        measures,
        subspace: initSubspace,
      },
      referenceInfo,
      insightsHeap,
      metaInsightsHeap,
      options
    );
  });
};
