import { typeAll } from '@antv/dw-analyzer';
import { RowData } from './util/helper';
import { parse, TransformSchema, AggregationType } from './parse';

/**
 * @beta
 */
export interface AutoTransformResult {
  result: RowData;
  schemas: TransformSchema[];
}

/**
 * @beta
 */
export type RenameOption = boolean | 'origin' | 'brackets' | 'underline' | Function;

/**
 * @beta
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
 * @beta
 */
export function autoSchema(data: RowData[], renameOption: RenameOption = 'brackets'): TransformSchema[] {
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
        type: 'sum',
        field: colName,
        as: rename(colName, 'sum', renameOption),
      });
    });
    schemas.push(schema);
  }

  return schemas;
}

/**
 * @beta
 */
export function autoTransform(data: RowData[], renameOption: RenameOption = 'brackets'): AutoTransformResult {
  const result: AutoTransformResult = {
    result: [],
    schemas: autoSchema(data, renameOption),
  };

  result.result = parse(data, result.schemas);

  return result;
}
