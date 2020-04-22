import * as statistics from './util/statistics';
import { partition } from './util/partition';
import { RowData, assert } from './util/helper';
import { Operations } from './util/statistics';

/**
 * @public
 */
export interface AggregateParams {
  as: string[];
  fields?: string[];
  groupBy?: string | string[];
  op: Operations[];
}
/**
 *
 * @param rows - 数据
 * @param options - 参数
 *
 * @public
 */
export function aggregate(rows: RowData[], options: AggregateParams): RowData[] {
  const { fields, op } = options;
  fields && assert(Array.isArray(fields), `Invalid fields: it must be an array with one or more strings!`);
  !fields &&
    assert(
      op.every((item) => item === 'count'),
      `operations must all be 'count' when fields is empty`
    );
  assert(op.length === options.as.length, `Invalid as: it's length must be the same as operations!`);
  const groups = partition(rows, options.groupBy);
  const results: RowData[] = [];
  for (const group of Object.values(groups)) {
    const result = { ...group[0] };
    op.forEach((operation, i) => {
      const outputName = options.as[i];
      const field = fields ? fields[i] : undefined;
      result[outputName] = statistics[operation](field ? group.map((item: any) => item[field]) : group);
    });
    results.push(result);
  }
  return results;
}
