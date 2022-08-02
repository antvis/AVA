import _groupBy from 'lodash/groupBy';

import { PatternInfo, InsightInfo, InsightType, Language } from '../../interface';
import { SubjectsDescInfo, AbstractNarrativeGenerator } from '../interface';
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

export class InsightNarrativeGenerator extends AbstractNarrativeGenerator<PatternInfo> {
  caption: PhrasesBuilder;

  summaries: PhrasesBuilder[];

  private globalVariableMap: SubjectsDescInfo;

  private patternGroups: Partial<Record<InsightType, PatternInfo[]>>;

  constructor(patterns: PatternInfo[], insight: InsightInfo<PatternInfo>, lang: Language) {
    super(patterns, insight, lang);
  }

  protected prepareVariables(patterns: PatternInfo[], insight: InsightInfo<PatternInfo>) {
    // patterns group by insight type, as point pattern has more then one meta
    this.patternGroups = _groupBy(patterns, 'type');

    this.globalVariableMap = {
      insightTypes: Object.keys(this.patternGroups) as InsightType[],
      subspace: insight.subspace,
      measure: insight.measures[0].field,
      measureMethod: insight.measures[0].method,
      breakdown: insight.dimensions[0],
    };
  }

  protected applyStrategy() {
    this.caption = subjectsDescStrategy(this.globalVariableMap, this.lang);
    this.summaries = [];
    Object.keys(this.patternGroups).forEach((type) => {
      const patterns = this.patternGroups[type];
      if (patterns) {
        if (type === 'trend') {
          this.summaries.push(trendStrategy(patterns[0], this.lang));
        }
        if (type === 'majority') {
          this.summaries.push(majorityStrategy(patterns[0], this.lang));
        }
        if (type === 'low_variance') {
          this.summaries.push(lowVarianceStrategy(patterns[0], this.lang));
        }
        if (type === 'category_outlier' || type === 'time_series_outlier') {
          this.summaries.push(outliersStrategy(patterns, this.lang));
        }
        if (type === 'change_point') {
          this.summaries.push(changePointStrategy(patterns, this.lang));
        }
        if (type === 'correlation') {
          this.summaries.push(correlationStrategy(patterns[0], this.lang));
        }
      }
    });
  }
}
