import { isFunction } from 'lodash';

import { chartType2EncodeRequirement } from '../../../../../ckb/encode';

import { mapFieldsToVisualEncode } from './encode-mapping';

import type {
  AdvisorPipelineContext,
  AdvisorPluginType,
  ChartEncodeMapping,
  ScoringResultForChartType,
  VisualEncoderInput,
  VisualEncoderOutput,
} from '../../../../types';

const getEncodeMapping = (
  params: VisualEncoderInput & {
    chartType: string;
  },
  context: AdvisorPipelineContext
): ChartEncodeMapping => {
  const { chartType, dataProps, data } = params;
  const chartKnowledgeBase = context?.advisor?.ckb;
  if (isFunction(chartKnowledgeBase[chartType]?.toEncode)) {
    return chartKnowledgeBase[chartType]?.toEncode({ data, dataProps, context });
  }
  const encode = mapFieldsToVisualEncode({
    fields: dataProps,
    encodeRequirements: chartKnowledgeBase[chartType]?.encodePres ?? chartType2EncodeRequirement[chartType],
  });
  return encode;
};

export const visualEncoderPlugin: AdvisorPluginType<VisualEncoderInput, VisualEncoderOutput> = {
  name: 'defaultVisualEncoder',
  stage: ['encode'],
  execute: (input, context) => {
    const { chartType } = input;
    const chartTypeRecommendations: ScoringResultForChartType[] =
      input?.chartTypeRecommendations ??
      (chartType
        ? [
            {
              chartType,
              score: 1,
            },
          ]
        : []);

    const advices = chartTypeRecommendations.map((chartTypeAdvice) => {
      const encode = getEncodeMapping(
        {
          ...input,
          chartType: chartTypeAdvice.chartType,
        },
        context
      );
      return {
        ...chartTypeAdvice,
        encode,
      };
    });
    return { chartTypeRecommendations: advices };
  },
};
