import { get } from 'lodash';

import { getAlgorithmStandardInput, getNonSignificantInsight, preValidation } from '../util';

import type { GetPatternInfo, MajorityInfo, MajorityParams } from '../../types';

type MajorityItem = {
  index: number;
  significance: number;
  value: number;
  proportion: number;
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

export const getMajorityInfo: GetPatternInfo<MajorityInfo> = (props) => {
  const valid = preValidation(props);
  const insightType = 'majority';
  if (!valid) return getNonSignificantInsight({ insightType, infoType: 'verificationFailure' });
  const { data } = props;
  const { dimension, values, measure } = getAlgorithmStandardInput(props);
  const customOptions = get(props, 'options.algorithmParameter.majority');
  const majority = findMajority(values, customOptions);
  if (majority) {
    const { significance, index, proportion } = majority;
    return [
      {
        type: insightType,
        dimension,
        measure,
        significance,
        index,
        proportion,
        x: data[index][dimension],
        y: data[index][measure] as number,
        nonSignificantInsight: false,
      },
    ];
  }
  return getNonSignificantInsight({ insightType, infoType: 'noInsight' });
};
