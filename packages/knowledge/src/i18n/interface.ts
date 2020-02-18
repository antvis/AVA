import { GraphicCategory, Family, Purpose, CoordinateSystem, Shape, Channel, LevelOfMeasurement } from '../interface';
import { ChartID } from '../chartID';

interface Concepts {
  family: Record<Family, string>;
  category: Record<GraphicCategory, string>;
  purpose: Record<Purpose, string>;
  coord: Record<CoordinateSystem, string>;
  shape: Record<Shape, string>;
  channel: Record<Channel, string>;
  lom: Record<LevelOfMeasurement, string>;
}

/**
 * @beta
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
