import { isString } from 'lodash';

import { pcorrtest } from '../../../data';
import { PCorrTestParameter } from '../../../data/statistics/types';
import { CorrelationInfo, GetPatternInfo } from '../../types';
import { getNonSignificantInsight, preValidation } from '../util';
import { DEFAULT_PCORRTEST_OPTIONS } from '../../../data/statistics/constants';

type CorrelationResult = {
  significance: number;
  pcorr: number;
};

export function findCorrelation(
  x: number[],
  y: number[],
  pCorrTestParameter?: PCorrTestParameter
): CorrelationResult | null {
  const testResult = pcorrtest(x, y, pCorrTestParameter);
  // @ts-ignore Type Result is missing the "pcorr"
  const { rejected, pcorr } = testResult;

  if (rejected) {
    return {
      pcorr,
      significance: Math.abs(pcorr),
    };
  }
  return null;
}

export const getCorrelationInfo: GetPatternInfo<CorrelationInfo> = (props) => {
  const valid = preValidation(props);
  const insightType = 'correlation';
  const { data, measures, dimensions, options } = props;
  if (isString(valid) || !dimensions)
    return getNonSignificantInsight({
      insightType,
      infoType: 'verificationFailure',
      ...(isString(valid) ? { detailInfo: valid } : {}),
    });
  const xField = measures[0].fieldName;
  const yField = measures[1].fieldName;
  const x = data.map((item) => item?.[xField] as number);
  const y = data.map((item) => item?.[yField] as number);
  const correlationParameter = options?.algorithmParameter?.correlation;
  const result = findCorrelation(x, y, correlationParameter);
  if (result) {
    return [
      {
        ...result,
        type: insightType,
        measures: [xField, yField],
        significantInsight: true,
      },
    ];
  }
  const info = `The Pearson product-moment correlation test does not pass at the specified significance level ${
    correlationParameter?.alpha ?? DEFAULT_PCORRTEST_OPTIONS.alpha
  }.`;
  return getNonSignificantInsight({ insightType, infoType: 'noInsight', customInfo: { info } });
};
