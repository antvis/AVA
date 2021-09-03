import Heap from 'heap-js';
import { InsightDefaultLimit } from '../constant';
import { getInsightVisualizationSchema, getHomogeneousInsightVisualizationSchema } from '../visualization';
import { Datum, InsightOptions, Measure, InsightInfo, PatternInfo, HomogeneousPatternInfo } from '../interface';
import { aggregateWithSeries, aggregateWithMeasures } from '../utils/aggregate';
import {
  DataProperty,
  dataToDataProps,
  calculateImpactMeasureReferenceValues,
} from './preprocess';
import { enumerateInsights } from './insight';
import { insightPriorityComparator, homogeneousInsightPriorityComparator } from './util';

interface ReferenceInfo {
  fieldPropsMap: Record<string, DataProperty>;
  impactMeasureReferences: Record<string, number>;
}

type InsightsResult = {
  insights: InsightInfo<PatternInfo>[],
  homogeneousInsights?: InsightInfo<HomogeneousPatternInfo>[],
}

export const getDataInsights = (sourceData: Datum[], options?: InsightOptions): InsightsResult => {
  // get data columns infomations (column type, statistics, etc.)
  const data = sourceData.filter(item => !Object.values(item).some(v => v === null || v === undefined));
  const dataProps = dataToDataProps(data.filter(item => !Object.values(item).some(v => v === null || v === undefined)));
  const fieldPropsMap: Record<string, DataProperty> = dataProps.reduce((acc, item) => {
    acc[item.name] = item;
    return acc;
  }, {});

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
  const homogeneousInsightsHeap = new Heap(homogeneousInsightPriorityComparator);
  const insightsLimit = options?.limit || InsightDefaultLimit;
  insightsHeap.init([]);
  homogeneousInsightsHeap.init([]);

  enumerateInsights(data, dimensions, measures, referenceInfo, insightsHeap, homogeneousInsightsHeap, options);

  // get top N results
  const insightsResult = [];
  const heapSize = insightsHeap.size();
  const insightsSize = heapSize > insightsLimit ? insightsLimit : heapSize;
  for (let i = 0; i < insightsSize; i += 1) {
    const top = insightsHeap.pop();
    const visualizationSchemas = getInsightVisualizationSchema(top);
    insightsResult.push({ ...top, visualizationSchemas });
  }

  const result: InsightsResult = { insights: insightsResult };

  if (options?.homogeneous) {
    const homogeneousInsightsResult = [];
    const homogeneousHeapSize = homogeneousInsightsHeap.size();
    const homogeneousInsightsSize = homogeneousHeapSize > insightsLimit ? insightsLimit : homogeneousHeapSize;

    for (let i = 0; i < homogeneousInsightsSize; i += 1) {
      const top = homogeneousInsightsHeap.pop();
      const visualizationSchemas = getHomogeneousInsightVisualizationSchema(top);
      const { data, measures, breakdowns } = top;
      const insight = { ...top, visualizationSchemas };
      if (measures.length > 1) {
        insight.data = aggregateWithMeasures(data, breakdowns[0], measures);
      } else {
        insight.data = aggregateWithSeries(data, breakdowns[0], measures[0], breakdowns[1]);
      }
      homogeneousInsightsResult.push(insight);
    }
    result.homogeneousInsights = homogeneousInsightsResult;
  }
  return result;
};
