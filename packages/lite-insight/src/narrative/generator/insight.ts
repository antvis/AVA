import _groupBy from 'lodash/groupBy';
import { PatternInfo, InsightInfo, InsightType } from '../../interface';
import { SubjectsDescInfo, AbstractNarrativeGenerator } from '../interface';
import {
  subjectsDescStrategy,
  trendStrategy,
  lowVarianceStrategy,
  outliersStrategy,
  changePointStrategy,
  majorityStrategy,
} from '../strategy';
import { PhrasesBuilder } from '../utils/phrases-builder';

export class InsightNarrativeGenerator extends AbstractNarrativeGenerator<PatternInfo> {
  caption: PhrasesBuilder;

  summaries: PhrasesBuilder[];

  private globalVariableMap: SubjectsDescInfo;

  private patternGroups: Partial<Record<InsightType, PatternInfo[]>>;

  constructor(patterns: PatternInfo[], insight: InsightInfo<PatternInfo>) {
    super(patterns, insight);
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
      }
    });
  }
}
