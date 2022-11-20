import type {
  GraphicCategory,
  Family,
  Purpose,
  CoordinateSystem,
  Shape,
  Channel,
  LevelOfMeasurement,
  RecommendRating,
  ChartId,
} from '../types';

/**
 * TS type of translated terms for all concepts (properties) involved in chart knowledge.
 *
 * 图表信息中涉及到的所有概念（属性）的翻译词汇表的 TS 类型
 */
type Concepts = {
  /** Chart families */
  family: Record<Family, string>;
  /** Graphic categories */
  category: Record<GraphicCategory, string>;
  /** Analysis purposes */
  purpose: Record<Purpose, string>;
  /** Coordinate systems */
  coord: Record<CoordinateSystem, string>;
  /** Shapes */
  shape: Record<Shape, string>;
  /** Encoding channels */
  channel: Record<Channel, string>;
  /** Level of measurements */
  lom: Record<LevelOfMeasurement, string>;
  /** Recommend ratings */
  recRate: Record<RecommendRating, string>;
};

/**
 * TS type of properties that need to be internationalised in each chart knowledge.
 *
 * 图表知识中需要被国际化的属性的 TS 类型
 */
export type TransKnowledgeProps = {
  name: string;
  alias: string[];
  def: string;
};

/**
 * TS type of complete translation dictionary of a CKB.
 *
 * 完整的翻译内容结构的 TS 类型
 */
export type CkbDictionary = {
  concepts: Concepts;
  chartTypes: Record<ChartId, TransKnowledgeProps>;
};

/**
 * Language Code other than en-US.
 */
export type I18nLanguage = 'zh-CN';

/**
 * Language Code
 */
export type Language = 'en-US' & I18nLanguage;
