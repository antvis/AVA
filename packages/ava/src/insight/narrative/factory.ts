import * as insightNarrativeStrategies from './strategy';

import type { InsightType, HomogeneousInsightType } from '../types';
import type { InsightNarrativeStrategy } from './strategy/base';

export default class InsightNarrativeStrategyFactory {
  private static narrativeStrategyMap = new Map<InsightType | HomogeneousInsightType, InsightNarrativeStrategy>();

  static {
    Object.values(insightNarrativeStrategies).forEach((Strategy) => {
      this.narrativeStrategyMap.set(Strategy.insightType, new Strategy());
    });
  }

  static getStrategy(type: InsightType | HomogeneousInsightType) {
    const strategy = InsightNarrativeStrategyFactory.narrativeStrategyMap.get(type);
    if (!strategy) throw Error(`There is no description policy for this '${type}'.`);
    return strategy;
  }
}
