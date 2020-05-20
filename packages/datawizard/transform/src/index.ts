/**
 * data transforms
 *
 * @packageDocumentation
 */

import { RowData } from './util/helper';
export { RowData };

export * from './aggregate';

export { Operations } from './util/statistics';

export {
  parse,
  TransformSchema,
  Action,
  ActionType,
  FillNullOptions,
  FillNullOptionsBySmart,
  FillNullOptionsByAgg,
  FillNullOptionsByValue,
  FillNullType,
  AGGREGATION,
  AggregationType,
  CONVERSION,
  ConversionType,
  FILL,
  FillType,
} from './parse';

export { autoTransform, autoSchema, RenameOption, AutoTransformResult } from './autoTransform';
