import { typeAll } from '@antv/dw-analyzer';
import { RowData } from './util/helper';
import { parse, TransformSchema, AggregationType } from './parse';

/**
 * @public
 */
export interface AutoTransformResult {
  result: RowData[];
  schemas: TransformSchema[];
}

/**
 * @public
 */
export type RenameOption = boolean | 'origin' | 'brackets' | 'underline' | Function;

/**
 * @public
 */
export function rename(originStr: string, aggType: AggregationType, option: RenameOption = 'brackets'): string {
  if (option === false || option === 'origin') {
    return originStr;
  }

  if (option === true || option === 'brackets' || !option) {
    return `${aggType.toUpperCase()}(${originStr})`;
  }

  if (option === 'underline') {
    return `${aggType.toUpperCase()}_${originStr}`;
  }

  if (typeof option === 'function') {
    return String(option(originStr, aggType));
  }

  throw new Error(`Invalid rename option ${option}`);
}

/**
 * @public
 */
export function autoSchema(
  data: RowData[],
  renameOption: RenameOption = 'brackets',
  defaultAgg: AggregationType = 'sum'
): TransformSchema[] {
  const schemas: TransformSchema[] = [];

  const schema: TransformSchema = {
    actions: [],
  };

  const dataAnalyze = typeAll(data);

  const toGroupBy: string[] = [];
  const toNotGroupBy: string[] = [];

  dataAnalyze.forEach((col) => {
    if (['string', 'date', 'boolean'].includes(col.recommendation)) {
      toGroupBy.push(col.name);
    } else {
      toNotGroupBy.push(col.name);
    }
  });

  if (toGroupBy.length) {
    schema.groupBy = toGroupBy;
    toNotGroupBy.forEach((colName) => {
      schema.actions.push({
        type: defaultAgg,
        field: colName,
        as: rename(colName, defaultAgg, renameOption),
      });
    });
    schemas.push(schema);
  }

  return schemas;
}

/**
 * @public
 */
export function autoTransform(
  data: RowData[],
  renameOption: RenameOption = 'brackets',
  defaultAgg: AggregationType = 'sum'
): AutoTransformResult {
  const result: AutoTransformResult = {
    result: [],
    schemas: autoSchema(data, renameOption, defaultAgg),
  };

  result.result = parse(data, result.schemas);

  return result;
}
