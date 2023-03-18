import { groupBy } from 'lodash';

import { PatternInfo, InsightInfo, InsightType } from '../../types';
import {
  subjectsDescStrategy,
  trendStrategy,
  lowVarianceStrategy,
  outliersStrategy,
  changePointStrategy,
  majorityStrategy,
  correlationStrategy,
} from '../strategy';
import { PhrasesBuilder } from '../utils/phrases-builder';

import type { SubjectsDescInfo } from '../types';

export class InsightNarrativeGenerator {
  caption: PhrasesBuilder;

  summaries: PhrasesBuilder[];

  private globalVariableMap: SubjectsDescInfo;

  private patternGroups: Partial<Record<InsightType, PatternInfo[]>>;

  constructor(patterns: PatternInfo[], insight: InsightInfo<PatternInfo>) {
    this.prepareVariables(patterns, insight);
    this.applyStrategy();
  }

  protected prepareVariables(patterns: PatternInfo[], insight: InsightInfo<PatternInfo>) {
    // patterns group by insight type, as point pattern has more then one meta
    this.patternGroups = groupBy(patterns, 'type');

    this.globalVariableMap = {
      insightTypes: Object.keys(this.patternGroups) as InsightType[],
      subspace: insight.subspace,
      measure: insight.measures[0].field,
      measureMethod: insight.measures[0].method,
      breakdown: insight.dimensions[0].field,
    };
  }

  protected applyStrategy() {
    this.caption = subjectsDescStrategy(this.globalVariableMap);
    this.summaries = [];
    Object.keys(this.patternGroups).forEach((type) => {
      const patterns = this.patternGroups[type];
      if (patterns) {
        if (type === 'trend') {
          this.summaries.push(trendStrategy(patterns[0]));
        }
        if (type === 'majority') {
          this.summaries.push(majorityStrategy(patterns[0]));
        }
        if (type === 'low_variance') {
          this.summaries.push(lowVarianceStrategy(patterns[0]));
        }
        if (type === 'category_outlier' || type === 'time_series_outlier') {
          this.summaries.push(outliersStrategy(patterns));
        }
        if (type === 'change_point') {
          this.summaries.push(changePointStrategy(patterns[0]));
        }
        if (type === 'correlation') {
          this.summaries.push(correlationStrategy(patterns[0]));
        }
      }
    });
  }
}
