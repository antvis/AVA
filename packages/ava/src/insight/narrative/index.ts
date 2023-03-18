import InsightNarrativeStrategyFactory from './factory';

import type { HomogeneousInsightInfo } from './strategy/base';
import type { InsightInfo, VisualizationOptions, PatternInfo, HomogeneousPatternInfo } from '../types';

function isHomogeneousPattern(
  insightInfo: InsightInfo<PatternInfo> | HomogeneousPatternInfo
): insightInfo is HomogeneousPatternInfo {
  return 'childPatterns' in insightInfo;
}

export default function generateInsightNarrative(
  insightInfo: Omit<InsightInfo<PatternInfo>, 'visualizationSpecs'> | HomogeneousInsightInfo,
  options: VisualizationOptions
) {
  const insightType = isHomogeneousPattern(insightInfo) ? insightInfo?.type : insightInfo?.patterns[0]?.type;
  if (!insightType) throw Error('insight info has no insight type');

  const { lang } = options;

  const strategy = InsightNarrativeStrategyFactory.getStrategy(insightType);
  const result = strategy.generateTextSpec(insightInfo, lang);
  return result;
}
