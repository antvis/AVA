import { groupBy, uniq, flatten, isString } from 'lodash';
import Heap from 'heap-js';

import { PATTERN_TYPES, InsightScoreBenchmark, ImpactScoreWeight } from '../constant';
import { insightExtractor, ExtractorCheckers } from '../insights';
import { aggregate } from '../utils/aggregate';
import {
  extractHomogeneousPatternsForMeasures,
  extractHomogeneousPatternsForSiblingGroups,
  PatternCollection,
} from '../insights/extractors/homogeneous';

import { calculateImpactValue } from './preprocess';
import { addInsightsToHeap } from './util';

import type {
  Datum,
  InsightOptions,
  Measure,
  Subspace,
  InsightInfo,
  ImpactMeasure,
  SubjectInfo,
  InsightType,
  PatternInfo,
  HomogeneousPatternInfo,
  DataProperty,
  InsightExtractorOptions,
} from '../types';

interface ReferenceInfo {
  fieldPropsMap: Record<string, DataProperty>;
  impactMeasureReferences: Record<string, number>;
}

/** calculate the Impact which reflects the importance of the subject of an insight against the entire dataset  */
function computeSubspaceImpact(
  data: Datum[],
  subspace: Subspace,
  impactMeasureReferences: ReferenceInfo['impactMeasureReferences'],
  measures?: ImpactMeasure[]
) {
  if (!measures?.length || !subspace) return 1;
  const impactValues = measures.map((measure) => {
    const measureValue = calculateImpactValue(data, measure);
    const referenceKey = `${measure.fieldName}@${measure.method}`;
    const referenceValue = impactMeasureReferences[referenceKey];
    return measureValue / referenceValue;
  });
  return Math.max(...impactValues);
}

/** extract patterns from a specific subject */
function extractPatternsFromSubject(
  data: Datum[],
  subjectInfo: SubjectInfo,
  fieldPropsMap: Record<string, DataProperty>,
  options?: InsightOptions
): PatternCollection {
  const { measures, dimensions } = subjectInfo;

  const enumInsightTypes = options?.insightTypes || PATTERN_TYPES;

  const patterns: Partial<Record<InsightType, PatternInfo[]>> = {};

  enumInsightTypes.forEach((insightType) => {
    const insightExtractorChecker = ExtractorCheckers[insightType];
    let isValid = true;

    // Check whether the data requirements of the extractor are met
    if (insightExtractorChecker) {
      if (isString(insightExtractorChecker({ data, subjectInfo, fieldPropsMap }))) isValid = false;
    }
    if (isValid && insightExtractor) {
      const { algorithmParameter, dataProcessInfo } = options || {};
      const extractorOptions: InsightExtractorOptions = {
        algorithmParameter,
        dataProcessInfo,
        // Validation has been done in method extractInsights
        dataValidation: false,
        // Select only significant insights
        filterInsight: true,
      };
      const extractedPatterns = insightExtractor({
        data,
        dimensions,
        measures,
        insightType,
        options: extractorOptions,
      });
      patterns[insightType as InsightType] = extractedPatterns as PatternInfo[];
    } else {
      patterns[insightType as InsightType] = undefined;
    }
  });

  return patterns;
}

export function extractInsightsFor1M1DCombination(
  data: Datum[],
  dimensions: string[],
  measures: Measure[],
  subspace: Subspace,
  referenceInfo: ReferenceInfo,
  options: InsightOptions
): (InsightInfo<PatternInfo> | null)[][] {
  const { fieldPropsMap } = referenceInfo;

  const insights: (InsightInfo<PatternInfo> | null)[][] = [];

  dimensions.forEach((dimension) => {
    const insightsPerDim: (InsightInfo<PatternInfo> | null)[] = [];

    const isTimeField = fieldPropsMap[dimension]?.levelOfMeasurements?.includes('Time');
    measures.forEach((measure) => {
      const childSubjectInfo = { dimensions: [dimension], subspace, measures: [measure] };
      const aggregatedData = aggregate(data, dimension, [measure], isTimeField);

      const patterns = extractPatternsFromSubject(aggregatedData, childSubjectInfo, fieldPropsMap, options);

      const patternsArray = flatten(Object.values(patterns).filter((item) => item?.length > 0)).sort(
        (a, b) => b.significance - a.significance
      );
      if (patternsArray.length) {
        const insight = {
          subspace,
          dimensions: [
            {
              fieldName: dimension,
            },
          ],
          measures: [measure],
          patterns: patternsArray,
          data: aggregatedData,
          score: patternsArray[0].significance,
        };
        insightsPerDim.push(insight);
      } else {
        insightsPerDim.push(null);
      }
    });

    insights.push(insightsPerDim);
  });

  return insights;
}

export function extractInsightsForCorrelation(
  data: Datum[],
  dimensions: string[],
  measures: Measure[],
  subspace: Subspace,
  referenceInfo: ReferenceInfo,
  options: InsightOptions
): InsightInfo<PatternInfo>[] {
  const { fieldPropsMap } = referenceInfo;

  const insights: InsightInfo<PatternInfo>[] = [];

  const measureNum = measures.length;
  if (measureNum >= 2) {
    for (let i = 0; i < measureNum - 1; i += 1) {
      for (let j = i + 1; j < measureNum; j += 1) {
        const childSubjectInfo = { dimensions, subspace, measures: [measures[i], measures[j]] };

        const patterns = extractPatternsFromSubject(data, childSubjectInfo, fieldPropsMap, {
          ...options,
          insightTypes: ['correlation'],
        });

        const patternsArray = patterns?.correlation?.sort((a, b) => b.significance - a.significance);
        if (patternsArray?.length) {
          const insight = {
            subspace,
            dimensions: dimensions.map((d) => ({ fieldName: d })),
            measures: [measures[i], measures[j]],
            patterns: patternsArray,
            data,
            score: patternsArray[0].significance,
          };
          insights.push(insight);
        }
      }
    }
  }
  return insights;
}

/** recursive extraction in data subspace */
export function extractInsightsFromSubspace(
  data: Datum[],
  dimensions: string[],
  measures: Measure[],
  subspace: Subspace,
  referenceInfo: ReferenceInfo,
  insightsHeap: Heap<InsightInfo<PatternInfo>>,
  homogeneousInsightsHeap: Heap<InsightInfo<HomogeneousPatternInfo>>,
  options: InsightOptions
): (InsightInfo<PatternInfo> | null)[] {
  /** subspace pruning */
  if (!data?.length) {
    return [];
  }

  // calculate impact score
  const { impactMeasureReferences, fieldPropsMap } = referenceInfo;
  const subspaceImpact = computeSubspaceImpact(data, subspace, impactMeasureReferences, options?.impactMeasures);

  // pruning1: check the subpace impact limit
  if (subspaceImpact < InsightScoreBenchmark) {
    return [];
  }

  // pruning2: check if the impact score is greater than the minimum score in heap
  const impactScoreWeight =
    !!options?.impactWeight && options.impactWeight >= 0 && options.impactWeight < 1
      ? options.impactWeight
      : ImpactScoreWeight;
  const optimalScore = subspaceImpact * impactScoreWeight + 1 * (1 - impactScoreWeight);
  if (insightsHeap.length >= insightsHeap.limit) {
    const minScoreInHeap = insightsHeap.peek()?.score as number;
    if (optimalScore <= minScoreInHeap) {
      return [];
    }
  }

  /** insight extraction */
  const insights: (InsightInfo<PatternInfo> | null)[] = [];

  /** Combination: 1M * 1D */
  const insightsFor1M1DCombination = extractInsightsFor1M1DCombination(
    data,
    dimensions,
    measures,
    subspace,
    referenceInfo,
    options
  );
  insightsFor1M1DCombination.forEach((insightsPerDim) => {
    const insightsForMeasures = insightsPerDim
      .filter((item): item is InsightInfo<PatternInfo> => !!item)
      .map((item) => ({ ...item, score: item.score * (1 - impactScoreWeight) + subspaceImpact * impactScoreWeight }));
    insights.push(...insightsPerDim);
    addInsightsToHeap(insightsForMeasures, insightsHeap);
  });

  // Combination 3: 1M * 1M */
  if ((options.insightTypes || PATTERN_TYPES).includes('correlation')) {
    const extracted = extractInsightsForCorrelation(data, dimensions, measures, subspace, referenceInfo, options);
    const insightsForCorrelation = extracted?.map((item) => ({
      ...item,
      score: item.score * (1 - impactScoreWeight) + subspaceImpact * impactScoreWeight,
    }));
    addInsightsToHeap(insightsForCorrelation, insightsHeap);
  }

  /**  extract homogeneous insight in measures */
  if (options?.homogeneous) {
    insightsFor1M1DCombination.forEach((insightsPerDim, dimIndex) => {
      const homogeneousPatternsForMeasures = extractHomogeneousPatternsForMeasures(measures, insightsPerDim);
      if (homogeneousPatternsForMeasures.length > 0) {
        const homogeneousInsights: InsightInfo<HomogeneousPatternInfo>[] = homogeneousPatternsForMeasures.map(
          (pattern) => ({
            subspace,
            dimensions: [{ fieldName: dimensions[dimIndex] }],
            measures,
            patterns: [pattern],
            data,
            score: pattern.significance * (1 - impactScoreWeight) + subspaceImpact * impactScoreWeight,
          })
        );
        homogeneousInsightsHeap.addAll(homogeneousInsights);
      }
    });
  }

  /** subspace search */
  if (!options?.ignoreSubspace) {
    const searchedDimensions = subspace.map((item) => item.dimension);
    const remainDimensionFields = (
      options?.dimensions?.map((dimension) => dimension.fieldName) ||
      Object.values(fieldPropsMap)
        .filter((item) => item.domainType === 'dimension')
        .map((item) => item.name)
    ).filter((field) => !searchedDimensions.includes(field));

    if (remainDimensionFields.length > 0) {
      remainDimensionFields.forEach((dimension) => {
        const siblingGroupInsights: (InsightInfo<PatternInfo> | null)[][] = [];
        const groupedData = groupBy(data, dimension);
        const breakdownValues: string[] = uniq(fieldPropsMap[dimension].rawData);

        const dimensionsInSubspace = remainDimensionFields.filter((item) => item !== dimension);
        if (breakdownValues.length > 1) {
          breakdownValues.forEach((value) => {
            const childSubspace = [...subspace, { dimension, value }];

            const subspaceInsights = extractInsightsFromSubspace(
              groupedData[value],
              dimensionsInSubspace,
              measures,
              childSubspace,
              referenceInfo,
              insightsHeap,
              homogeneousInsightsHeap,
              options
            );
            siblingGroupInsights.push(subspaceInsights);
          });
        }

        /** extract homegenehous insight in sibling group */
        if (options?.homogeneous) {
          dimensionsInSubspace.forEach((dim) => {
            measures.forEach((measure) => {
              const siblingGroupInsightsArr = siblingGroupInsights.map((siblingItem) => {
                return (
                  siblingItem.find((insight) => {
                    return (
                      !!insight &&
                      insight.dimensions.length === 1 &&
                      insight.dimensions[0].fieldName === dim &&
                      insight.measures.length === 1 &&
                      insight.measures[0].fieldName === measure.fieldName
                    );
                  }) || null
                );
              });

              const homogeneousPatternsForSiblingGroups = extractHomogeneousPatternsForSiblingGroups(
                breakdownValues,
                siblingGroupInsightsArr
              );
              const insightsForSiblingGroup = homogeneousPatternsForSiblingGroups.map((pattern) => ({
                subspace,
                dimensions: [{ fieldName: dimension }, { fieldName: dim }],
                measures: [measure],
                patterns: [pattern],
                data,
                score: pattern.significance * (1 - impactScoreWeight) + subspaceImpact * impactScoreWeight,
              }));
              homogeneousInsightsHeap.addAll(insightsForSiblingGroup);
            });
          });
        }
      });
    }
  }

  return insights;
}

/** insight subject enumeration in the data */
export function enumerateInsights(
  data: Datum[],
  dimensions: string[],
  measures: Measure[],
  referenceInfo: ReferenceInfo,
  insightsHeap: Heap<InsightInfo<PatternInfo>>,
  metaInsightsHeap: Heap<InsightInfo<HomogeneousPatternInfo>>,
  options: InsightOptions = {}
) {
  const initSubspace = [];

  extractInsightsFromSubspace(
    data,
    dimensions,
    measures,
    initSubspace,
    referenceInfo,
    insightsHeap,
    metaInsightsHeap,
    options
  );
}
