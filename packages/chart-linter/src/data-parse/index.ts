import { isDateString } from '@antv/dw-analyzer/lib/is-date';
import { unique } from '@antv/dw-analyzer/lib/utils';
import { min, max } from '@antv/dw-analyzer/lib/statistic';
import { typeAll, FieldsInfo, isNumberFieldInfo } from '@antv/dw-analyzer';
import { isEmptyLike } from '../utils';
import { Field, Dataset, VegaLite, isDataset, isInlineData, isUrlData } from '../interfaces';

/**
 * Get all field from data and identify their types used in vega-lite.
 *
 * @param vl
 */
export async function getFieldsFromData(vl: VegaLite): Promise<Field[]> {
  const { data } = vl;

  if (isEmptyLike(data)) return [];

  if (isInlineData(data) && Array.isArray(data.values) && isDataset(data.values)) {
    return getFields(data.values);
  }

  if (isUrlData(data)) {
    const { url } = data;
    const dataFromURL = await fetch(url)
      .then((res) => res.json())
      .catch((e) => {
        console.error(e);
      });

    return getFields(dataFromURL);
  }

  return [];
}

/**
 * Get all fields.
 *
 * @param data JSON dataset in js array
 */
export function getFields(data: Dataset): Field[] {
  const fields: Field[] = [];

  if (!data || !data.length) return fields;

  const columnInfos: FieldsInfo = typeAll(data);

  columnInfos.forEach((columnInfo) => {
    const { type, name, distinct, recommendation } = columnInfo;

    const guessType = type === 'mixed' ? recommendation : type;

    switch (guessType) {
      case 'boolean':
        fields.push({
          field: name,
          fieldType: 'boolean',
          type: 'nominal',
          cardinality: distinct as number,
        });
        break;

      case 'date':
        fields.push({
          field: name,
          fieldType: 'datetime',
          type: 'temporal',
          cardinality: distinct as number,
        });
        break;

      case 'float':
      case 'integer': {
        const _field: Field = {
          field: name,
          fieldType: 'number',
          type: 'quantitative',
          cardinality: distinct as number,
        };
        if (isNumberFieldInfo(columnInfo)) {
          _field.min = columnInfo.minimum;
          _field.max = columnInfo.maximum;
        }
        fields.push(_field);
        break;
      }
      // TODO: handle empty columns
      case 'null':
      case 'string':
      default:
        fields.push({
          field: name,
          fieldType: 'string',
          type: 'nominal',
          cardinality: distinct as number,
        });
        break;
    }
  });

  return fields;
}

/**
 * Whether the string can be interpreted as a date.
 *
 * @param str
 *
 * @deprecated 估计不需要用到
 */
export function isDate(str: string): boolean {
  return isDateString(str);
}

/**
 * Whether a field(column) of data is a date field.
 *
 * @param values a field in string
 *
 * @deprecated 估计不需要用到
 */
export function isDateColumn(values: string[]): boolean {
  return values.every((value) => isDate(value));
}

/**
 * Return disctinct value amount of a column, for `enc_cardinality()`.
 *
 * @param values
 *
 * @deprecated 估计不需要用到
 */
export function getDistinct(values: any[]): number {
  return unique(values).length;
}

/**
 * Return data range of a quantitative column, for `extent()`.
 *
 * @param values
 * @returns [min, max]
 *
 * @deprecated 估计不需要用到
 */
export function getExtent(values: number[]): number[] {
  // TODO: [min, max] or {min, max}?
  return [min(values), max(values)];
}
