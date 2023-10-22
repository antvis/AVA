import { get, isString } from 'lodash';

import { getAlgorithmCommonInput, getNonSignificantInsight, preValidation } from '../util';

import type { GetPatternInfo, MajorityInfo, MajorityParameter } from '../../types';

type MajorityItem = {
  index: number;
  significance: number;
  value: number;
  proportion: number;
};

const DEFAULT_PROPORTION_LIMIT = 0.6;

export function findMajority(values: number[], majorityParameter?: MajorityParameter): MajorityItem | null {
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

  const proportionLimit = majorityParameter?.limit || DEFAULT_PROPORTION_LIMIT;
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
  if (isString(valid))
    return getNonSignificantInsight({ detailInfo: valid, insightType, infoType: 'verificationFailure' });
  const { data } = props;
  const { dimension, values, measure } = getAlgorithmCommonInput(props);
  const majorityParameter = get(props, 'options.algorithmParameter.majority');
  const majority = findMajority(values, majorityParameter);
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
        significantInsight: true,
      },
    ];
  }
  const info = `After disassembling with the given dimension, the proportion of the maximum value does not exceed ${
    majorityParameter?.limit || DEFAULT_PROPORTION_LIMIT
  }.`;
  return getNonSignificantInsight({
    insightType,
    infoType: 'noInsight',
    customInfo: { info, dimension, measure },
  });
};
