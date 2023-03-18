import {
  InsightType,
  Subspace,
  MeasureMethod,
  InsightInfo,
  HomogeneousPatternInfo,
  HomogeneousInsightType,
  PatternInfo,
} from '../types';

import { SYMBOL } from './constants';

export type VariableType = 'insightTypes';

export type Language = 'zh-CN' | 'en-US';

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
} & Pick<HomogeneousPatternInfo, 'commonSet' | 'exceptions' | 'insightType'>;
