import { map, mapValues, size } from 'lodash';

import { compare, intersects } from '../../../../utils';
import { isParentChild } from '../../../../../data';
import { findTopCorrFields } from '../../../../utils/top-corr-fields';

import type { DataPrerequisite } from '../../../../../ckb';
import type { EncodeRequirements } from '../../../../../ckb/encode';
import type { BasicDataPropertyForAdvice, ChartEncodeMapping } from '../../../../types';

// @todo chenluli encoding mapping 也考虑纳入规则系统中，可用规则系统来约束推荐逻辑
/** find matching fields for encode requirement */
function findAndMarkFields({
  requirement,
  fields,
  fieldUsage,
}: {
  requirement: DataPrerequisite;
  fields: BasicDataPropertyForAdvice[];
  fieldUsage: Set<string>;
}) {
  const matchingFields: BasicDataPropertyForAdvice[] = [];
  let count = requirement.minQty;
  requirement.fieldConditions.forEach((targetLoM) => {
    if (count <= 0) return;
    const filteredFields = fields
      .filter((field) => !fieldUsage.has(field.name) && field.levelOfMeasurements.includes(targetLoM))
      .slice(0, count);
    count -= filteredFields.length;
    matchingFields.push(...filteredFields);
    filteredFields.forEach((field) => fieldUsage.add(field.name));
  });

  // Use other type of fields if not enough matching fields
  if (count > 0) {
    const remainingFields = fields.filter((field) => !fieldUsage.has(field.name)).slice(0, count);
    matchingFields.push(...remainingFields);
    remainingFields.forEach((field) => fieldUsage.add(field.name));
  }
  return matchingFields;
}

export function mapFieldsToVisualEncode({
  fields = [],
  encodeRequirements = {},
}: {
  fields: BasicDataPropertyForAdvice[];
  encodeRequirements: EncodeRequirements;
}): ChartEncodeMapping {
  const encodeMapping: Record<string, BasicDataPropertyForAdvice[]> = {};
  const fieldUsage: Set<string> = new Set();
  const sortedFields = fields.sort(compare);

  // Iterate through each encode requirement
  // 遍历每个 encode 的满足条件，先满足每个 encode key 对字段的最小数目要求
  Object.entries(encodeRequirements).forEach(([encodeKey, requirement]) => {
    encodeMapping[encodeKey] = findAndMarkFields({ requirement, fields: sortedFields, fieldUsage });
  });

  // assign remaining fields to the available slot
  // 如果还有剩余字段没有映射上，则填充至最大数量还能满足的部分
  const isAcceptableQty = (encodeKey: string) => {
    const currentCount = size(encodeMapping[encodeKey]);
    const maxQty = encodeRequirements[encodeKey]?.maxQty;
    return maxQty === '*' || currentCount < maxQty;
  };
  sortedFields
    .filter((field) => !fieldUsage.has(field.name))
    .forEach((field) => {
      const matchingEncodeKey =
        Object.keys(encodeRequirements).find(
          (encodeKey) =>
            isAcceptableQty(encodeKey) &&
            intersects(field.levelOfMeasurements, encodeRequirements[encodeKey]?.fieldConditions)
        ) ?? Object.keys(encodeRequirements).find((encodeKey) => isAcceptableQty(encodeKey));

      if (matchingEncodeKey) {
        encodeMapping[matchingEncodeKey].push(field);
        fieldUsage.add(field.name);
      }
    });

  // todo 填充 slots 完成后，进一步优化调整
  // 1. 如果 x 轴和 series 都是 nominal 类型字段：distinct 大的作为 x 轴；如果有层级关系，则使用 parent 作为 x 轴；
  const xField = encodeMapping.x?.[0];
  const colorField = encodeMapping.color?.[0];
  if (
    size(encodeMapping.x) === 1 &&
    size(encodeMapping.color) === 1 &&
    xField.levelOfMeasurements?.includes('Nominal') &&
    colorField.levelOfMeasurements?.includes('Nominal')
  ) {
    if (isParentChild(colorField?.rawData, xField?.rawData) || colorField.distinct > xField.distinct) {
      encodeMapping.x = [colorField];
      encodeMapping.color = [xField];
    }
  }
  // 2. 如果 x, y, size 都是 interval 类型字段，则选 correlation 较大的作为 x,y 另一个作为 size
  const yField = encodeMapping.y?.[0];
  const sizeField = encodeMapping.size?.[0];
  if (
    size(encodeMapping.x) === 1 &&
    size(encodeMapping.y) === 1 &&
    size(encodeMapping.size) === 1 &&
    xField.levelOfMeasurements?.includes('Interval') &&
    yField.levelOfMeasurements?.includes('Interval') &&
    sizeField.levelOfMeasurements?.includes('Interval')
  ) {
    const { x, y, size } = findTopCorrFields([xField, yField, colorField]);
    encodeMapping.x = [x];
    encodeMapping.y = [y];
    encodeMapping.size = [size];
  }

  // check for unmet encoding requirements
  Object.entries(encodeRequirements).forEach(([key, requirement]) => {
    if (encodeMapping[key].length < requirement.minQty) {
      // eslint-disable-next-line no-console
      console.warn(
        `Requirement for ${key} not satisfied. Minimum required fields: ${requirement.minQty}, but got ${encodeMapping[key].length}.`
      );
    }
    const remainingFields = sortedFields.filter((field) => !fieldUsage.has(field.name));
    if (remainingFields.length) {
      // eslint-disable-next-line no-console
      console.warn(
        `No available visual encoding slots for remaining ${remainingFields.length} fields. Excess fields are ignored.`
      );
    }
  });
  return mapValues(encodeMapping, (fields) => map(fields, 'name'));
}
