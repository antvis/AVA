import { HomogeneousPatternInfo, InsightInfo } from '../../interface';
import { AbstractNarrativeGenerator, HomogeneousInfo } from '../interface';
import { homogeneousStrategy } from '../strategy';
import { PhrasesBuilder } from '../utils/phrases-builder';

export class HomogeneousNarrativeGenerator extends AbstractNarrativeGenerator<HomogeneousPatternInfo> {
  summary: PhrasesBuilder;

  private globalVariableMap: HomogeneousInfo;

  constructor(patterns: HomogeneousPatternInfo[], insight: InsightInfo<HomogeneousPatternInfo>) {
    super(patterns, insight);
  }

  protected prepareVariables(patterns: HomogeneousPatternInfo[], insight: InsightInfo<HomogeneousPatternInfo>) {
    const { type, insightType, childPatterns, commSet, exc } = patterns[0];
    this.globalVariableMap = {
      subspace: insight.subspace,
      measures: insight.measures,
      breakdown: insight.dimensions[0],
      type,
      insightType,
      commSet,
      exc,
      childPattern: childPatterns[0],
    };
  }

  protected applyStrategy() {
    this.summary = homogeneousStrategy(this.globalVariableMap);
  }
}
