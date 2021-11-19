import _groupBy from 'lodash/groupBy';
import _uniq from 'lodash/uniq';
import _flatten from 'lodash/flatten';
import Heap from 'heap-js';
import { PATTERN_TYPES, InsightScoreBenchmark, ImpactScoreWeight } from '../constant';
import { insightExtractors, ExtractorCheckers } from '../insights';
import {
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
} from '../interface';
import { aggregate } from '../utils/aggregate';
import { DataProperty, calculateImpactValue } from './preprocess';
import {
  extractHomogeneousPatternsForMeausres,
  extractHomogeneousPatternsForSiblingGroups,
  PatternCollection,
} from './homogeneous';
import { addInsightsToHeap } from './util';

interface ReferenceInfo {
  fieldPropsMap: Record<string, DataProperty>;
  impactMeasureReferences: Record<string, number>;
}

/** calculate the Impact which reflects the importance of the subject of an insight against the entire dataset  */
const computeSubspaceImpact = (
  data: Datum[],
  subspace: Subspace,
  impactMeasureReferences: ReferenceInfo['impactMeasureReferences'],
  measures?: ImpactMeasure[]
) => {
  if (!measures?.length || !subspace) return 1;
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
  const { measures, dimensions } = subjectInfo;

  const enumInsightTypes = options?.insightTypes || PATTERN_TYPES;

  const patterns: Partial<Record<InsightType, PatternInfo[]>> = {};

  enumInsightTypes.forEach((insightType) => {
    const insightExtractorChecker = ExtractorCheckers[insightType];
    let isValid = true;

    // Check whether the data requirements of the extractor are met
    if (insightExtractorChecker) {
      if (!insightExtractorChecker(data, subjectInfo, fieldPropsMap)) isValid = false;
    }
    const insightExtractor = insightExtractors[insightType];
    if (isValid && insightExtractor) {
      const extractedPatterns = insightExtractor(data, dimensions, measures);
      patterns[insightType as InsightType] = extractedPatterns as PatternInfo[];
    } else {
      patterns[insightType as InsightType] = null;
    }
  });

  return patterns;
};

export const extractInsightsFor1M1DCombination = (
  data: Datum[],
  dimensions: string[],
  measures: Measure[],
  subspace: Subspace,
  referenceInfo: ReferenceInfo,
  options: InsightOptions
): InsightInfo<PatternInfo>[][] => {
  const { fieldPropsMap } = referenceInfo;

  const insights = [];

  dimensions.forEach((dimension) => {
    const insightsPerDim = [];
    const collectionForDimension = [];

    const isTimeField = fieldPropsMap[dimension].levelOfMeasurements.includes('Time');
    measures.forEach((measure) => {
      const childSubjectInfo = { dimensions: [dimension], subspace, measures: [measure] };
      const aggregatedData = aggregate(data, dimension, [measure], isTimeField);

      const patterns = extractPatternsFromSubject(aggregatedData, childSubjectInfo, fieldPropsMap, options);

      collectionForDimension.push(patterns);

      const patternsArray = _flatten(Object.values(patterns).filter((item) => item?.length > 0)).sort(
        (a, b) => b.significance - a.significance
      );
      if (patternsArray.length) {
        const insight = {
          subspace,
          dimensions: [dimension],
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
};

/** recursive extraction in data subspace */
export const extractInsightsFromSubspace = (
  data: Datum[],
  dimensions: string[],
  measures: Measure[],
  subspace: Subspace,
  referenceInfo: ReferenceInfo,
  insightsHeap: Heap<InsightInfo<PatternInfo>>,
  homogeneousInsightsHeap: Heap<InsightInfo<HomogeneousPatternInfo>>,
  options: InsightOptions
): InsightInfo<PatternInfo>[] => {
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
    options?.impactWeight >= 0 && options?.impactWeight < 1 ? options.impactWeight : ImpactScoreWeight;
  const optimalScore = subspaceImpact * impactScoreWeight + 1 * (1 - impactScoreWeight);
  if (insightsHeap.length >= insightsHeap.limit) {
    const minScoreInHeap = insightsHeap.peek()?.score;
    if (optimalScore <= minScoreInHeap) {
      return [];
    }
  }

  /** insight extraction */
  const insights = [];
  // TODO Combination 1:  1D(dimension) or 1M(measure)

  // Combination 2: 1M * 1D */
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
      .filter((item) => !!item)
      .map((item) => ({ ...item, score: item.score * (1 - impactScoreWeight) + subspaceImpact * impactScoreWeight }));
    insights.push(...insightsPerDim);
    addInsightsToHeap(insightsForMeasures, insightsHeap);
  });

  // TODO Combination 3: nM * nD

  /**  extract homegenehous insight in measures */
  if (options?.homogeneous) {
    insightsFor1M1DCombination.forEach((insightsPerDim, dimIndex) => {
      const homogeneousPatternsForMeasures = extractHomogeneousPatternsForMeausres(measures, insightsPerDim);
      if (homogeneousPatternsForMeasures.length > 0) {
        const homogeneousInsights: InsightInfo<HomogeneousPatternInfo>[] = homogeneousPatternsForMeasures.map(
          (pattern) => ({
            subspace,
            dimensions: [dimensions[dimIndex]],
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
      options?.dimensions ||
      Object.values(fieldPropsMap)
        .filter((item) => item.fieldType === 'dimension')
        .map((item) => item.name)
    ).filter((field) => !searchedDimensions.includes(field));

    if (remainDimensionFields.length > 0) {
      remainDimensionFields.forEach((dimension) => {
        const siblingGroupInsights: InsightInfo<PatternInfo>[][] = [];
        const groupedData = _groupBy(data, dimension);
        const breakdownValues: string[] = _uniq(fieldPropsMap[dimension].rawData);

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
                return siblingItem.find((insight) => {
                  return (
                    !!insight &&
                    insight.dimensions.length === 1 &&
                    insight.dimensions[0] === dim &&
                    insight.measures.length === 1 &&
                    insight.measures[0].field === measure.field
                  );
                });
              });

              const homogeneousPatternsForSiblingGroups = extractHomogeneousPatternsForSiblingGroups(
                breakdownValues,
                siblingGroupInsightsArr
              );
              const insightsForSiblingGroup = homogeneousPatternsForSiblingGroups.map((pattern) => ({
                subspace,
                dimensions: [dimension, dim],
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
};
