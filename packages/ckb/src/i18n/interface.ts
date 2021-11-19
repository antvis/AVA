import type {
  GraphicCategory,
  Family,
  Purpose,
  CoordinateSystem,
  Shape,
  Channel,
  LevelOfMeasurement,
  RecommendRating,
} from '../interface';
import type { ChartID } from '../chartID';

interface Concepts {
  family: Record<Family, string>;
  category: Record<GraphicCategory, string>;
  purpose: Record<Purpose, string>;
  coord: Record<CoordinateSystem, string>;
  shape: Record<Shape, string>;
  channel: Record<Channel, string>;
  lom: Record<LevelOfMeasurement, string>;
  recRate: Record<RecommendRating, string>;
}

/**
 * @public
 */
export interface TransKnowledgeProps {
  name: string;
  alias: string[];
  def: string;
}

export interface TranslateList {
  concepts: Concepts;
  chartTypes: Record<ChartID, TransKnowledgeProps>;
}
