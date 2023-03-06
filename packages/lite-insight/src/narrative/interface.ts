import {
  InsightType,
  Subspace,
  MeasureMethod,
  InsightInfo,
  HomogeneousPatternInfo,
  HomogeneousInsightType,
  PatternInfo,
  Language,
} from '../interface';

import { SYMBOL } from './constance';

export type VariableType = 'insightTypes';

export type SymbolType = keyof (typeof SYMBOL)['en-US'];

/** generate subject desc -- title */
export type SubjectsDescInfo = {
  subspace: Subspace;
  insightTypes: InsightType[];
  measure: string;
  measureMethod: MeasureMethod;
  breakdown: string;
};

export type HomogeneousInfo = {
  subspace: Subspace;
  measures: InsightInfo['measures'];
  breakdown: string;
  type: HomogeneousInsightType;
  childPattern: PatternInfo;
} & Pick<HomogeneousPatternInfo, 'commSet' | 'exc' | 'insightType'>;

export abstract class AbstractNarrativeGenerator<T> {
  protected lang: Language;

  constructor(patterns: T[], insight: InsightInfo<T>, lang: Language) {
    this.lang = lang;
    // step1: parse insight info && step2: data prepare
    this.prepareVariables(patterns, insight);
    // step3: apply strategy to generate narrative schema
    this.applyStrategy();
  }

  protected abstract prepareVariables(patterns: T[], insight: InsightInfo<T>): void;

  protected abstract applyStrategy(): void;
}
