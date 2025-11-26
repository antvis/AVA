import type { InsightType, InsightInfo, Language, HomogeneousInsightType, HomogeneousPatternInfo } from '../../types';
import type { ParagraphSpec, Structure, StructureTemp } from '../../../ntv/types';

export type HomogeneousInsightInfo = HomogeneousPatternInfo & Omit<InsightInfo, 'patterns'>;

export abstract class InsightNarrativeStrategy<
  P = any // `any` allow input all insight
> {
  static insightType: InsightType | HomogeneousInsightType;

  protected static structures: Record<Language, Structure[]>;

  protected static structureTemps?: Record<Language, StructureTemp[]>;

  abstract generateTextSpec(insightInfo: InsightInfo<P> | HomogeneousInsightInfo, lang: Language): ParagraphSpec[];

  // TODO support text
  // abstract generateStr(lang: Language): string[];
}
