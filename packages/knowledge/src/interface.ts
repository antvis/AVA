import { ChartID } from './chartID';

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
  'Others',
] as const;
export type Family = typeof FAMILY_OPTIONS[number];

export const PURPOSE_OPTIONS = ['Comparison', 'Trend', 'Distribution', 'Rank', 'Proportion', 'Composition'] as const;
export type Purpose = typeof PURPOSE_OPTIONS[number];

export const COORD_TYPE_OPTIONS = [
  'NumberLine',
  'Cartesian2D',
  'SymmetricCartesian',
  'Cartesian3D',
  'Polar',
  'NodeLink',
  'Radar',
] as const;
export type CoordinateSystem = typeof COORD_TYPE_OPTIONS[number];

export const GRAPHIC_CATEGORY_OPTIONS = ['Statistic', 'Diagram', 'Graph', 'Map'] as const;
export type GraphicCategory = typeof GRAPHIC_CATEGORY_OPTIONS[number];

export const SHAPE_OPTIONS = ['Lines', 'Bars', 'Round', 'Square', 'Area', 'Scatter', 'Symmetric'] as const;
export type Shape = typeof SHAPE_OPTIONS[number];

export const LOM_OPTIONS = ['Nominal', 'Ordinal', 'Interval', 'Discrete', 'Continuous', 'Time'] as const;
export type LevelOfMeasurement = typeof LOM_OPTIONS[number];

export interface DataPrerequisite {
  minQty: number;
  maxQty: number | '*';
  fieldConditions: LevelOfMeasurement[];
}

export interface DataPrerequisiteJSON {
  minQty: number;
  maxQty: number | '*';
  fieldConditions: string[];
}

export const CHANNEL_OPTIONS = [
  'Position',
  'Length',
  'Color',
  'Area',
  'Angle',
  'ArcLength',
  'Direction',
  'Size',
] as const;
export type Channel = typeof CHANNEL_OPTIONS[number];

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
}

export type ChartKnowledgeBase = Record<ChartID, ChartKnowledge>;

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
}

export type ChartKnowledgeBaseJSON = Record<string, ChartKnowledgeJSON>;
