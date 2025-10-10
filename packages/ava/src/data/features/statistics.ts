import moment from 'moment';
import { uniq } from 'lodash';

import {
  mean as meanSS,
  median as medianSS,
  quantile as quantileSS,
  standardDeviation as standardDeviationSS,
  variance as varianceSS,
} from '@ava/utils/statistics';
import { ALL_SUPPORT_TIME_FORMAT } from '@ava/constants';
import { COMMON_DATA_TYPE, FieldDataType, FieldMetaType } from '@ava/types/data';
import { logError } from '@ava/utils';

export const isArrayEmpty = (arr: any[] | undefined | null) => {
  return !arr || arr.length === 0;
};

export function isDateString(dateString) {
  return moment(dateString, ALL_SUPPORT_TIME_FORMAT, true).isValid();
}

function determineDataType(value: string | number | null | undefined): COMMON_DATA_TYPE {
  if (value === null || value === undefined) {
    return COMMON_DATA_TYPE.STRING;
  }

  if (typeof value === 'number') {
    return COMMON_DATA_TYPE.NUMBER;
  }

  if (typeof value === 'string' && isDateString(value)) {
    return COMMON_DATA_TYPE.DATE;
  }

  return COMMON_DATA_TYPE.STRING;
}

export function extractFieldMetadata(data: FieldDataType): FieldMetaType[] {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('The input data must be a non-empty array.');
  }

  const firstRecord = data[0];
  const fieldIds = Object.keys(firstRecord);

  return fieldIds.map((fieldId) => {
    let fieldValue = firstRecord[fieldId];
    if (fieldValue === null) {
      // Find the first non-empty row for the current field
      const validDataRow = data.find((row) => row[fieldId] !== null);
      fieldValue = validDataRow?.[fieldId] || null;
    }

    const dataType = determineDataType(fieldValue);

    return {
      id: fieldId,
      name: fieldId,
      dataType,
    };
  });
}

const isSorted = (arr: (number | null)[]): 'random' | 'asc' | 'desc' => {
  if (arr.length === 0) return 'random';
  if (arr.length === 1) return 'random';

  const getValue = (val: number | null): number => (val === null ? 0 : val);

  const allNull = arr.every((item) => item === null);
  if (allNull) return 'random';

  let sortDirection: 'asc' | 'desc' | undefined;

  // 寻找前两个不同的数值来确定排序方向
  for (let i = 0; i < arr.length - 1; i++) {
    const current = getValue(arr[i]);
    const next = getValue(arr[i + 1]);

    if (current !== next) {
      sortDirection = current < next ? 'asc' : 'desc';
      break;
    }
  }

  if (sortDirection === undefined) {
    return 'asc';
  }

  for (let i = 0; i < arr.length - 1; i++) {
    const current = getValue(arr[i]);
    const next = getValue(arr[i + 1]);

    if (sortDirection === 'asc') {
      if (current > next) {
        return 'random';
      }
    } else if (current < next) {
      return 'random';
    }
  }

  return sortDirection;
};

export const max = (numbers: number[]) => {
  return Math.max(...numbers);
};

export const min = (numbers: number[]) => {
  return Math.min(...numbers);
};

export const mean = (numbers: number[]) => {
  return meanSS(numbers);
};

export const median = (numbers: number[]): number => {
  return medianSS(numbers);
};

/**
 * @desc Quantile value
 * @param numbers
 * @param quantileNumber Quantile value, between 0-1
 * @returns
 */
export const quantile = (numbers: number[], quantileNumber: number) => {
  return quantileSS(numbers, quantileNumber);
};

export const variance = (numbers: number[]) => {
  return varianceSS(numbers);
};

export const standardDeviation = (numbers: number[]) => {
  return standardDeviationSS(numbers);
};

export const countDistinctCount = (dimension: string[]) => {
  return uniq(dimension).length;
};

export const computeStatistics = (data: FieldDataType, fieldMeta: FieldMetaType[]): FieldMetaType[] => {
  const fieldMetaMap = new Map<string, FieldMetaType>();
  fieldMeta.forEach((field) => {
    fieldMetaMap.set(field.id, { ...field, allData: [] });
  });

  try {
    data.forEach((row) => {
      const rowFieldIds = new Set(Object.keys(row));
      rowFieldIds.forEach((fieldId) => {
        if (fieldMetaMap.has(fieldId)) {
          const { allData, ...rest } = fieldMetaMap.get(fieldId);
          // @ts-ignore
          allData.push(row[fieldId]);
          fieldMetaMap.set(fieldId, {
            ...rest,
            allData,
          });
        }
      });
    });

    Array.from(fieldMetaMap.values()).forEach((value) => {
      const { dataType, allData } = value;
      if (dataType === COMMON_DATA_TYPE.NUMBER) {
        const finalAllData = allData as number[];
        const arraySortOrder = isSorted(finalAllData);
        const updatedValue = {
          ...value,
          statisticsFeature: {
            max: max(finalAllData),
            min: min(finalAllData),
            mean: mean(finalAllData),
            median: median(finalAllData),
            variance: variance(finalAllData),
            standardDeviation: standardDeviation(finalAllData),
            sorted: ['asc', 'desc'].includes(arraySortOrder),
          },
        };
        fieldMetaMap.set(value.id, updatedValue);
      } else if ([COMMON_DATA_TYPE.DATE, COMMON_DATA_TYPE.STRING].includes(dataType)) {
        const finalAllData = allData as string[];
        const updatedValue = {
          ...value,
          statisticsFeature: {
            distinctCount: countDistinctCount(finalAllData),
          },
        };
        fieldMetaMap.set(value.id, updatedValue);
      }
    });
  } catch (error) {
    logError('computeStatistics error:', error);
  }

  return Array.from(fieldMetaMap.values());
};

export const modifyFieldDataType = (params: { metas: FieldMetaType[]; data: FieldDataType }) => {
  const { data, metas } = params;
  return metas.map((item) => {
    const { dataType, id } = item;
    try {
      if (item.dataType === COMMON_DATA_TYPE.STRING) {
        // Determine whether character fields like '2025-01-01' are date fields
        const firstRecord = data[0];
        const isDateField = isDateString(firstRecord[id]);
        return {
          ...item,
          dataType: isDateField ? COMMON_DATA_TYPE.DATE : dataType,
        };
      }
    } catch (error) {
      logError('modifyFieldDataType error:', error);
    }

    return item;
  });
};

export const processFieldMetas = (params: { data: FieldDataType; metas: FieldMetaType[] }) => {
  const { data, metas } = params;
  let finalMetas = metas;
  if (!isArrayEmpty(data) && isArrayEmpty(finalMetas)) {
    // Given only raw data, compute the metadata and data features.
    const extractMetas = extractFieldMetadata(data);
    finalMetas = computeStatistics(data, extractMetas);
  } else if (!isArrayEmpty(finalMetas) && isArrayEmpty(data)) {
    // Give only metas, do noting
  } else if (!isArrayEmpty(data) && !isArrayEmpty(finalMetas)) {
    // Given both data and metas, compute the data features.
    finalMetas = modifyFieldDataType({
      data,
      metas: finalMetas,
    });
    finalMetas = computeStatistics(data, finalMetas);
  }

  return finalMetas;
};
