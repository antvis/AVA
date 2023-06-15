import type { InsightExtractorProp, MajorityInfo } from '../../types';

type MajorityItem = {
  index: number;
  significance: number;
  value: number;
  proportion: number;
};

type MajorityParams = {
  limit?: number;
};

const DEFAULT_PROPORTION_LIMIT = 0.6;

export function findMajority(values: number[], params?: MajorityParams): MajorityItem | null {
  let sum = 0;
  let max = -Infinity;
  let maxIndex = -1;
  for (let i = 0; i < values?.length; i += 1) {
    sum += values[i];
    if (values[i] > max) {
      max = values[i];
      maxIndex = i;
    }
  }

  const proportionLimit = params?.limit || DEFAULT_PROPORTION_LIMIT;
  if (sum === 0) return null;

  const proportion = max / sum;
  if (proportion > proportionLimit && proportion < 1) {
    return {
      index: maxIndex,
      value: max,
      proportion,
      significance: proportion,
    };
  }
  return null;
}

export function extractor({ data, dimensions, measures }: InsightExtractorProp): MajorityInfo[] {
  const dimension = dimensions[0];
  const measure = measures[0].fieldName;
  if (!data || data.length === 0) return [];
  const values = data.map((item) => item?.[measure] as number);
  const majority = findMajority(values);
  if (majority) {
    const { significance, index, proportion } = majority;
    return [
      {
        type: 'majority',
        dimension,
        measure,
        significance,
        index,
        proportion,
        x: data[index][dimension],
        y: data[index][measure] as number,
      },
    ];
  }
  return [];
}
