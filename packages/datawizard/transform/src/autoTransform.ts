import { typeAll, isUnique } from '@antv/dw-analyzer';
import { RowData } from './util/helper';
import { parse, TransformSchema } from './parse';

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
export function autoTransform(data: RowData[]): AutoTransformResult {
  const result: AutoTransformResult = {
    result: [],
    schemas: [],
  };

  const schema: TransformSchema = {
    actions: [],
  };

  const dataAnalyze = typeAll(data);

  const toGroupBy: string[] = [];
  const toNotGroupBy: string[] = [];

  dataAnalyze.forEach((col) => {
    if (col.recommendation === 'string' && !isUnique(col)) {
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
        as: `SUM(${colName})`,
      });
    });
    result.schemas.push(schema);
  }

  result.result = parse(data, result.schemas);

  return result;
}
