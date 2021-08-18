import { ChartID } from './chartID';

/**
 * @public
 */
export const FAMILY_OPTIONS = [
  'LineCharts',
  'ColumnCharts',
  'BarCharts',
  'PieCharts',
  'AreaCharts',
  'ScatterCharts',
  'FunnelCharts',
  'HeatmapCharts',
  'RadarCharts',
  'TreeGraph',
  'GeneralGraph',
  'PolygonLayer',
  'LineLayer',
  'PointLayer',
  'HeatmapLayer',
  'Table',
  'Others',
] as const;

/**
 * @public
 */
export type Family = typeof FAMILY_OPTIONS[number];

/**
 * @public
 */
export const PURPOSE_OPTIONS = [
  'Comparison',
  'Trend',
  'Distribution',
  'Rank',
  'Proportion',
  'Composition',
  'Relation',
  'Hierarchy',
  'Flow',
  'Spatial',
  'Anomaly',
  'Value',
] as const;

/**
 * @public
 */
export type Purpose = typeof PURPOSE_OPTIONS[number];

/**
 * @public
 */
export const COORD_TYPE_OPTIONS = [
  'NumberLine',
  'Cartesian2D',
  'SymmetricCartesian',
  'Cartesian3D',
  'Polar',
  'NodeLink',
  'Radar',
  'Geo',
  'Other',
] as const;

/**
 * @public
 */
export type CoordinateSystem = typeof COORD_TYPE_OPTIONS[number];

/**
 * @public
 */
export const GRAPHIC_CATEGORY_OPTIONS = ['Statistic', 'Diagram', 'Graph', 'Map', 'Other'] as const;

/**
 * @public
 */
export type GraphicCategory = typeof GRAPHIC_CATEGORY_OPTIONS[number];

/**
 * @public
 */
export const SHAPE_OPTIONS = [
  'Lines',
  'Bars',
  'Round',
  'Square',
  'Area',
  'Scatter',
  'Symmetric',
  'Network',
  'Map',
  'Other',
] as const;

/**
 * @public
 */
export type Shape = typeof SHAPE_OPTIONS[number];

/**
 * @public
 */
export const LOM_OPTIONS = ['Nominal', 'Ordinal', 'Interval', 'Discrete', 'Continuous', 'Time'] as const;

/**
 * @public
 */
export type LevelOfMeasurement = typeof LOM_OPTIONS[number];

/**
 * @public
 */
export interface DataPrerequisite {
  minQty: number;
  maxQty: number | '*';
  fieldConditions: LevelOfMeasurement[];
}

/**
 * @public
 */
export interface DataPrerequisiteJSON {
  minQty: number;
  maxQty: number | '*';
  fieldConditions: string[];
}

/**
 * @public
 */
export const CHANNEL_OPTIONS = [
  'Position',
  'Length',
  'Color',
  'Area',
  'Angle',
  'ArcLength',
  'Direction',
  'Size',
  'Opacity',
  'Stroke',
  'LineWidth',
  'Lightness',
] as const;

/**
 * @public
 */
export type Channel = typeof CHANNEL_OPTIONS[number];

/**
 * @public
 */
export const RECOMMEND_RATING_OPTIONS = ['Recommended', 'Use with Caution', 'Not Recommended'] as const;

/**
 * @public
 */
export type RecommendRating = typeof RECOMMEND_RATING_OPTIONS[number];

/**
 * @public
 */
export interface ChartKnowledge {
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
}

export type ChartKnowledgeBase = Record<ChartID, ChartKnowledge>;

/**
 * @public
 */
export interface ChartKnowledgeJSON {
  id: string;
  name: string;
  alias: string[];
  family: string[];
  def: string;
  purpose: string[];
  coord: string[];
  category: string[];
  shape: string[];
  dataPres: DataPrerequisiteJSON[];
  channel: string[];
  recRate: string;
}

export type ChartKnowledgeBaseJSON = Record<string, ChartKnowledgeJSON>;
