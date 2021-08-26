import _groupBy from 'lodash/groupBy';
import _uniq from 'lodash/uniq';
import Heap from 'heap-js';
import { INSIGHT_TYPES, InsightScoreBenchmark, InsightDefaultLimit } from '../constant';
import { insightExtractors, ExtractorCheckers } from '../insights';
import { getInsightVisualizationSchema } from '../visualization';
import {
  Datum,
  InsightOptions,
  Measure,
  InsightInfo,
  ImpactMeasure,
  SubjectInfo,
  PatternInfo,
  Subspace,
} from '../interface';
import { aggregate } from '../utils/aggregate';
import {
  DataProperty,
  dataToDataProps,
  calculateImpactMeasureReferenceValues,
  calculateImpactValue,
} from './preprocess';
import { insightPriorityComparator } from './util';

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
  if (!measures?.length) return 1;
  if (!subjectInfo) return 0;
  const impactValues = measures.map((measure) => {
    const measureValue = calculateImpactValue(data, measure);
    const referenceKey = `${measure.field}@${measure.method}`;
    const referenceValue = impactMeasureReferences[referenceKey];
    return measureValue / referenceValue;
  });
  return Math.max(...impactValues);
};

/** extract insights from a specific subject */
const extractInsightsFromSubject = (
  data: Datum[],
  subjectInfo: SubjectInfo,
  fieldPropsMap: Record<string, DataProperty>,
  options?: InsightOptions
) => {
  const { breakdown, subspace, measures } = subjectInfo;

  const enumInsightTypes = options?.insightTypes || INSIGHT_TYPES;

  const patterns: PatternInfo[] = [];

  const aggregatedData = aggregate(data, breakdown, measures);

  enumInsightTypes.forEach((insightType) => {
    const insightExtractorChecker = ExtractorCheckers[insightType];
    let isValid = true;

    // Check whether the data requirements of the extractor are met
    if (insightExtractorChecker) {
      if (!insightExtractorChecker(data, subjectInfo, fieldPropsMap)) isValid = false;
    }
    const insightExtractor = insightExtractors[insightType];
    if (isValid && insightExtractor) {
      const extractedPatterns = insightExtractor(aggregatedData, measures[0]?.field);
      patterns.push(...extractedPatterns);
    }
  });
  if (patterns.length === 0) return [];

  patterns.sort((a, b) => b.significance - a.significance);
  const insight = {
    subspaces: [subspace],
    breakdowns: [breakdown],
    measures,
    data: aggregatedData,
    patterns,
  };
  return [insight];
};

/** recursive enumeration of insight subjects */
const enumerateInsightSubjectsRecursive = (
  data: Datum[],
  subjectInfo: SubjectInfo,
  referenceInfo: ReferenceInfo,
  heap: Heap<InsightInfo>,
  options?: InsightOptions
) => {
  const { fieldPropsMap, impactMeasureReferences } = referenceInfo;
  const subjectImportance = computeSubjectImpact(data, subjectInfo, impactMeasureReferences, options?.impactMeasures);

  // check the subject importance
  if (subjectImportance < InsightScoreBenchmark) {
    return;
  }

  /** enumerate insights of the subject itself */
  const { breakdown, subspace, measures } = subjectInfo;

  const groupedData = _groupBy(data, breakdown);

  // TODO insight for multiple measures
  measures.forEach((measure) => {
    const childSubjectInfo = { breakdown, subspace, measures: [measure] };
    const extracted = extractInsightsFromSubject(data, childSubjectInfo, fieldPropsMap, options)?.map((insight) => ({
      ...insight,
      score: insight.patterns[0].significance * subjectImportance,
    }));
    heap.addAll(extracted);
  });

  /** enumerate insights of the sibling group */
  const searchedDimensions = subspace.map((item) => item.dimension).concat(breakdown);
  const remainDimensionFields = (
    options?.dimensions ||
    Object.values(fieldPropsMap)
      .filter((item) => item.fieldType === 'dimension')
      .map((item) => item.name)
  ).filter((field) => !searchedDimensions.includes(field));

  const breakdownValues = _uniq(fieldPropsMap[breakdown].samples as string[]);
  if (remainDimensionFields.length === 0 || breakdownValues.length < 2) {
    return;
  }
  breakdownValues.forEach((value) => {
    const childSubspace = [...subspace, { dimension: breakdown, value }];
    remainDimensionFields.forEach((dimension) => {
      enumerateInsightSubjectsRecursive(
        groupedData[value],
        {
          breakdown: dimension,
          subspace: childSubspace,
          measures,
        },
        referenceInfo,
        heap,
        options
      );
    });
  });
};

/** insight subject enumeration in the data */
const enumerateInsights = (
  data: Datum[],
  dimensions: string[],
  measures: Measure[],
  referenceInfo: ReferenceInfo,
  heap: Heap<InsightInfo>,
  options: InsightOptions
) => {
  const initSubspace: Subspace = [];

  dimensions.forEach((dimension) => {
    enumerateInsightSubjectsRecursive(
      data,
      {
        breakdown: dimension,
        measures,
        subspace: initSubspace,
      },
      referenceInfo,
      heap,
      options
    );
  });
};

// TODO insight Heap
export const getDataInsights = (data: Datum[], options: InsightOptions = {}): InsightInfo[] => {
  // get data columns infomations (column type, statistics, etc.)
  const dataProps = dataToDataProps(data);
  const fieldPropsMap = dataProps.reduce((acc, item) => {
    acc[item.name] = item;
    return acc;
  }, {} as Record<string, DataProperty>);

  const impactMeasureReferences = calculateImpactMeasureReferenceValues(data, options?.impactMeasures);

  const referenceInfo: ReferenceInfo = {
    fieldPropsMap,
    impactMeasureReferences,
  };

  // TODO measures  custom / default
  const measures: Measure[] =
    options?.measures ||
    dataProps
      .filter((item) => item.fieldType === 'measure')
      .map((item) => ({
        field: item.name,
        method: 'SUM',
      }));
  const dimensions =
    options?.dimensions || dataProps.filter((item) => item.fieldType === 'dimension').map((item) => item.name);

  // init insights storage
  const insightsHeap = new Heap(insightPriorityComparator);
  const insightsLimit = options?.limit || InsightDefaultLimit;
  insightsHeap.init([]);

  enumerateInsights(data, dimensions, measures, referenceInfo, insightsHeap, options);

  // get top N results
  const insightsResult: InsightInfo[] = [];
  const heapSize = insightsHeap.size();
  const insightsSize = heapSize > insightsLimit ? insightsLimit : heapSize;
  for (let i = 0; i < insightsSize; i += 1) {
    const top = insightsHeap.pop();
    if (!top) break;
    const visualizationSchemas = getInsightVisualizationSchema(top);
    insightsResult.push({ ...top, visualizationSchemas });
  }
  return insightsResult;
};
