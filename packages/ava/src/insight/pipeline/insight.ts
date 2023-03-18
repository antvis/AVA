import Heap from 'heap-js';

import { InsightDefaultLimit } from '../constant';
import { aggregateWithSeries, aggregateWithMeasures } from '../utils/aggregate';

import { enumerateInsights } from './extract';
import { dataToDataProps, calculateImpactMeasureReferenceValues } from './preprocess';
import {
  generateHomogeneousInsightVisualizationAndNarrativeSpec,
  generateInsightVisualizationAndNarrativeSpec,
} from './visualize';
import { insightPriorityComparator, homogeneousInsightPriorityComparator } from './util';

import type {
  Datum,
  InsightOptions,
  Measure,
  InsightInfo,
  PatternInfo,
  HomogeneousPatternInfo,
  DataProperty,
} from '../types';

interface ReferenceInfo {
  fieldPropsMap: Record<string, DataProperty>;
  impactMeasureReferences: Record<string, number>;
}

type InsightsResult = {
  insights: InsightInfo<PatternInfo>[];
  homogeneousInsights?: InsightInfo<HomogeneousPatternInfo>[];
};

export function extractInsights(sourceData: Datum[], options?: InsightOptions): InsightsResult {
  // get data columns infomations (column type, statistics, etc.)
  const data = sourceData.filter((item) => !Object.values(item).some((v) => v === null || v === undefined));
  const dataProps = dataToDataProps(data);

  const fieldPropsMap: Record<string, DataProperty> = dataProps.reduce((acc, item) => {
    acc[item.name] = item;
    return acc;
  }, {});

  const impactMeasureReferences = calculateImpactMeasureReferenceValues(data, options?.impactMeasures);

  const referenceInfo: ReferenceInfo = {
    fieldPropsMap,
    impactMeasureReferences,
  };

  const measures: Measure[] =
    options?.measures ||
    dataProps
      .filter((item) => item.domainType === 'measure')
      .map((item) => ({
        fieldName: item.name,
        method: 'SUM',
      }));
  const dimensions =
    options?.dimensions.map((dimension) => dimension.fieldName) ||
    dataProps.filter((item) => item.domainType === 'dimension').map((item) => item.name);

  // init insights storage
  const insightsHeap = new Heap(insightPriorityComparator);
  const homogeneousInsightsHeap = new Heap(homogeneousInsightPriorityComparator);
  const insightsLimit = options?.limit || InsightDefaultLimit;
  insightsHeap.limit = insightsLimit;
  insightsHeap.init([]);
  homogeneousInsightsHeap.init([]);

  enumerateInsights(data, dimensions, measures, referenceInfo, insightsHeap, homogeneousInsightsHeap, options);

  // get top N results
  const insights: InsightInfo<PatternInfo>[] = [];
  const heapSize = insightsHeap.size();
  const insightsSize = heapSize > insightsLimit ? insightsLimit : heapSize;
  for (let i = 0; i < insightsSize; i += 1) {
    const top = insightsHeap.pop() as InsightInfo<PatternInfo>;
    insights.push(top);
  }

  const result: InsightsResult = { insights: insights.reverse() };

  if (options?.homogeneous) {
    const homogeneousInsightsResult: InsightInfo<HomogeneousPatternInfo>[] = [];
    const homogeneousHeapSize = homogeneousInsightsHeap.size();
    const homogeneousInsightsSize = homogeneousHeapSize > insightsLimit ? insightsLimit : homogeneousHeapSize;

    for (let i = 0; i < homogeneousInsightsSize; i += 1) {
      const top = homogeneousInsightsHeap.pop() as InsightInfo<HomogeneousPatternInfo>;
      homogeneousInsightsResult.push(top);
    }
    result.homogeneousInsights = homogeneousInsightsResult.reverse();
  }

  return result;
}

export function generateInsightsWithVisualizationSpec(
  extraction: InsightsResult,
  options?: InsightOptions
): InsightsResult {
  const { insights, homogeneousInsights } = extraction;
  const insightsWithVis = insights.map((item) => ({
    ...item,
    visualizationSpecs: generateInsightVisualizationAndNarrativeSpec(item, options?.visualization),
  }));
  const result: InsightsResult = { insights: insightsWithVis };
  if (homogeneousInsights && options?.homogeneous) {
    const homogeneousInsightsWithVis = homogeneousInsights.map((item) => {
      const visualizationSpecs = generateHomogeneousInsightVisualizationAndNarrativeSpec(item, options.visualization);
      const { data, measures, dimensions } = item;
      const insight = { ...item, visualizationSpecs };
      if (measures.length > 1) {
        insight.data = aggregateWithMeasures(data, dimensions[0].fieldName, measures);
      } else {
        insight.data = aggregateWithSeries(data, dimensions[0].fieldName, measures[0], dimensions[1].fieldName);
      }
      return insight;
    });
    result.homogeneousInsights = homogeneousInsightsWithVis;
  }
  return result;
}
