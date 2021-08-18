import pkg from '../package.json';
export const version = pkg.version;
export const name = pkg.name;

export { CKBJson, addChart } from './pack';
export { CKBOptions } from './options';
export {
  ChartKnowledge,
  DataPrerequisite,
  LevelOfMeasurement,
  Family,
  Purpose,
  CoordinateSystem,
  GraphicCategory,
  Shape,
  Channel,
  RecommendRating,
  ChartKnowledgeJSON,
  FAMILY_OPTIONS,
  PURPOSE_OPTIONS,
  COORD_TYPE_OPTIONS,
  GRAPHIC_CATEGORY_OPTIONS,
  SHAPE_OPTIONS,
  LOM_OPTIONS,
  CHANNEL_OPTIONS,
  RECOMMEND_RATING_OPTIONS,
  DataPrerequisiteJSON,
} from './interface';
export { Language } from './i18n';
export { TransKnowledgeProps } from './i18n/interface';
export { ChartID, CHART_ID_OPTIONS } from './chartID';
