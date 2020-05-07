import { RowData, assert } from './util/helper';
import { aggregate, AggregateParams } from './aggregate';
import { Operations } from './util/statistics';
import { partition } from './util/partition';
import { oneMoreValue } from './smartMock';

const tuple = <T extends string[]>(...args: T) => args;

/**
 * @beta
 */
export const AGGREGATION = tuple('sum', 'max', 'min', 'average', 'avg', 'median', 'count', 'distinct', 'countd');

/**
 * @beta
 */
export type AggregationType = typeof AGGREGATION[number];

/**
 * @beta
 */
export const CONVERSION = tuple('toString', 'toFloat', 'toInt');

/**
 * @beta
 */
export type ConversionType = typeof CONVERSION[number];

/**
 * @beta
 */
export const FILL = tuple('fillNull', 'removeNull');

/**
 * @beta
 */
export type FillType = typeof FILL[number];

/**
 * @beta
 */
export type FillNullType = 'bySmart' | 'byAgg' | 'byValue';

/**
 * @beta
 */
export interface FillNullOptionsBySmart {
  type: Extract<FillNullType, 'bySmart'>;
}

/**
 * @beta
 */
export interface FillNullOptionsByAgg {
  type: Extract<FillNullType, 'byAgg'>;
  cfg: {
    agg: AggregationType;
  };
}

/**
 * @beta
 */
export interface FillNullOptionsByValue {
  type: Extract<FillNullType, 'byValue'>;
  cfg: {
    value: string | number;
  };
}

/**
 * @beta
 */
export type FillNullOptions = FillNullOptionsBySmart | FillNullOptionsByAgg | FillNullOptionsByValue;

export function isFillNullOptionsBySmart(options: any): options is FillNullOptionsBySmart {
  return options.type === 'bySmart';
}
export function isFillNullOptionsByAgg(options: any): options is FillNullOptionsByAgg {
  return options.type === 'byAgg';
}
export function isFillNullOptionsByValue(options: any): options is FillNullOptionsByValue {
  return options.type === 'byValue';
}

/**
 * @beta
 */
export type ActionType = AggregationType | ConversionType | FillType;

/**
 * @beta
 */
export interface Action {
  type: ActionType;
  field: string | null;
  as: string | null;
  options?: FillNullOptions;
}

/**
 * @beta
 */
export interface TransformSchema {
  groupBy?: string[];
  actions: Action[];
}

const ACTION_TYPES: { [x: string]: ActionType[] } = { AGGREGATION, CONVERSION, FILL };

function converse(value: any, type: ConversionType): any {
  if (type === 'toString') {
    return String(value);
  }
  if (type === 'toFloat') {
    return parseFloat(value);
  }
  if (type === 'toInt') {
    return parseInt(value);
  }
  return value; // fail, return origin
}

function fillNull(data: RowData[], field: string, fillNullOptions: FillNullOptions): RowData[] | null {
  let result = null;

  if (isFillNullOptionsByValue(fillNullOptions)) {
    result = [];
    data.forEach((row) => {
      const newRow: RowData = { ...row };
      if (!newRow[field]) {
        newRow[field] = fillNullOptions.cfg.value;
      }
      result.push(newRow);
    });
  }

  if (isFillNullOptionsByAgg(fillNullOptions)) {
    result = [];
    const tempAgg = aggregate(
      data.filter((row) => !!row[field]),
      { as: [field], fields: [field], op: [fillNullOptions.cfg.agg] }
    );

    data.forEach((row) => {
      const newRow: RowData = { ...row };
      if (!newRow[field]) {
        newRow[field] = tempAgg[0][field];
      }
      result.push(newRow);
    });
  }

  if (isFillNullOptionsBySmart(fillNullOptions)) {
    result = [];
    const cleanField = data.map((row) => row[field]).filter((e) => !!e);
    data.forEach((row) => {
      const newRow: RowData = { ...row };
      if (!newRow[field]) {
        newRow[field] = oneMoreValue(cleanField);
      }
      result.push(newRow);
    });
  }

  return result;
}

function parseSingleSchema(data: RowData[], schema: TransformSchema): RowData[] {
  const { groupBy, actions } = schema;

  let result = data;

  if (groupBy) {
    const group = partition(data, [...groupBy]);
    result = Object.values(group).map((groupArray) => {
      assert(Array.isArray(groupArray) && groupArray.length > 0, `Invalid groupby!`);
      const newRow: RowData = {};
      groupBy.forEach((g) => {
        newRow[g] = groupArray[0][g];
      });
      return newRow;
    });
  }

  actions.forEach((action) => {
    const { type, field, as, options } = action;

    const actionCategory = Object.keys(ACTION_TYPES).find((cate) => ACTION_TYPES[cate].some((t) => t === type));

    let requiredAs = 'new_field';
    if (as) {
      requiredAs = as;
    } else if (field) {
      requiredAs = field;
    }

    if (actionCategory === 'AGGREGATION') {
      const aggregateParams: AggregateParams = {
        as: [requiredAs],
        op: [type as Operations],
      };
      if (field) {
        aggregateParams.fields = [field];
      }
      if (groupBy) {
        aggregateParams.groupBy = groupBy;
      }

      const tempAgg = aggregate(data, aggregateParams);
      result.forEach((row, index) => {
        row[requiredAs] = tempAgg[index][requiredAs];
      });
    }

    if (actionCategory === 'CONVERSION') {
      if (field) {
        const tempCon = data.map((row) => {
          const newRow = { ...row };
          newRow[requiredAs] = converse(row[field], type as ConversionType);
          return newRow;
        });

        result.forEach((row, index) => {
          row[requiredAs] = tempCon[index][requiredAs];
        });
      }
    }
    if (actionCategory === 'FILL') {
      if (type === 'removeNull') {
        if (field) {
          result = result.filter((row) => row[field]);
        }
      }
      if (type === 'fillNull') {
        if (field && options) {
          const attempt = fillNull(result, field, options);
          if (attempt) {
            result = attempt;
          }
        }
      }
    }
  });

  return result;
}

/**
 * @beta
 */
export function parse(data: RowData[], schemas: TransformSchema | TransformSchema[]): RowData[] {
  let result = data;
  const schemaArray = Array.isArray(schemas) ? schemas : [schemas];
  for (let i = 0; i < schemaArray.length; i++) {
    result = parseSingleSchema(result, schemaArray[i]);
  }
  return result;
}
