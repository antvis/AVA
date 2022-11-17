import * as constants from './constants';

import type { Data, Specification } from '../common/types';

/**
 * TS type of standard IDs for each chart type.
 * ---
 * 图表 ID 的 TS 类型
 *
 * @public
 */
export type ChartId = typeof constants.CHART_IDS[number];

/**
 * TS type of chart families.
 * ---
 * 所有图表家族的 TS 类型
 *
 * @public
 */
export type Family = typeof constants.FAMILIES[number];

/**
 * TS type of analysis purposes.
 * ---
 * 所有分析目的的 TS 类型
 *
 * @public
 */
export type Purpose = typeof constants.PURPOSES[number];

/**
 * TS type of coordinate systems.
 * ---
 * 所有坐标系的 TS 类型
 *
 * @public
 */
export type CoordinateSystem = typeof constants.COORDINATE_SYSTEMS[number];

/**
 * TS type of graphic categories.
 * ---
 * 所有图形大类的 TS 类型
 *
 * @public
 */
export type GraphicCategory = typeof constants.GRAPHIC_CATEGORIES[number];

/**
 * TS type of shapes.
 * ---
 * 所有形状的 TS 类型
 *
 * @public
 */
export type Shape = typeof constants.SHAPES[number];

/**
 * TS type of level of measurements.
 * ---
 * 所有度量水平的 TS 类型
 *
 * @public
 */
export type LevelOfMeasurement = typeof constants.LEVEL_OF_MEASUREMENTS[number];

/**
 * TS type of A prerequisite for being able to plot data for a specific chart type.
 * ---
 * 能绘制出某图表的数据的先决条件，它的 TS 类型
 *
 * @public
 */
export type DataPrerequisite = {
  /**
   * Minimum Quantity:
   * At least this many fields are required to draw a chart of this type.
   * ---
   * 最小数量：
   * 至少要这么多字段才能绘制出对应图表类型
   */
  minQty: number;
  /**
   * Maximum Quantity:
   * At most this many fields are required to draw a chart of this type.
   * '*' stands for infinite.
   * ---
   * 最大数量：
   * 超过这么多字段就不能或不适合绘制出对应图表类型
   */
  maxQty: number | '*';
  /**
   * Level of Measurements which the above quantities apply.
   * ---
   * 上述字段数量指的是这里定义的“度量水平”匹配的字段
   */
  fieldConditions: LevelOfMeasurement[];
};

/**
 * TS type of channels.
 * ---
 * 所有通道的 TS 类型
 *
 * @public
 */
export type Channel = typeof constants.CHANNELS[number];

/**
 * TS type of recommend ratings.
 * ---
 * 所有推荐评级
 *
 * @public
 * @see {@link ./constants.ts#RECOMMEND_RATINGS}
 */
export type RecommendRating = typeof constants.RECOMMEND_RATINGS[number];

/**
 * TS type of pure knowledge for a chart type.
 * Pure means it is the original English version and not for custom chart types.
 * ---
 * 原装图表类型的信息结构的 TS 类型，非自定义图标类型。
 *
 * @public
 */
export type PureChartKnowledge = {
  id: string;
  name: string;
  alias: string[];
  family: Family[];
  def: string;
  purpose: Purpose[];
  coord: CoordinateSystem[];
  category: GraphicCategory[];
  shape: Shape[];
  dataPres: DataPrerequisite[];
  channel: Channel[];
  recRate: RecommendRating;
};

/**
 * TS type of knowledge for a chart type.
 * Could be in any language or values（string), or for custom chart types(with a `toSpec` function).
 * ---
 * 图表类型的信息结构的 TS 类型，可能是不同语言版本, 值和图表类型本身可能是自定义的。自定义图标应当包含 toSpec 方法。
 *
 * @public
 */
export type ChartKnowledge = {
  id: string;
  name: string;
  alias: string[];
  family: string[];
  def: string;
  purpose: string[];
  coord: string[];
  category: string[];
  shape: string[];
  dataPres: (Omit<DataPrerequisite, 'fieldConditions'> & { fieldConditions: string[] })[];
  channel: string[];
  recRate: string;
  toSpec?: (data: Data, dataProps: any) => Specification | null;
};

/**
 * TS type of pure CKB(Chart Knowledge Base).
 * Pure means it is the original English version of CKB and without custom chart types.
 * ---
 * 整个图表知识库（CKB）的原装英文版本的 TS 类型，不带自定义图表类型。
 *
 * @public
 */
export type PureChartKnowledgeBase = Record<ChartId, PureChartKnowledge>;

/**
 * TS type of CKB(Chart Knowledge Base).
 * Could be in any language or contain custom chart types.
 * ---
 * 整个图表知识库（CKB）的 TS 类型，可能是不同语言版本以及可以带自定义图表类型
 *
 * @public
 */
export type ChartKnowledgeBase = Record<string, ChartKnowledge>;
