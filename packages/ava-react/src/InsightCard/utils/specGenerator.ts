import { DISPLAY_CHARTS_PLUGIN_KEY } from '../constants';

import type { NtvTypes } from '@antv/ava-react';
import type { InsightData } from '../types';

/** generate narrative paragraphs and visualizations for insight data */
export const generateNarrativeVisSpec = (insightData: InsightData): NtvTypes.NarrativeTextSpec => {
  const { visualizationSpecs } = insightData;
  if (visualizationSpecs) {
    const { narrativeSpec, chartSpec } = visualizationSpecs;
    const insightContentSpec: NtvTypes.NarrativeTextSpec = {
      sections: [
        {
          paragraphs: [
            ...narrativeSpec,
            {
              type: 'custom',
              customType: DISPLAY_CHARTS_PLUGIN_KEY,
              chartSpecs: [chartSpec],
            },
          ],
        },
      ],
    };
    return insightContentSpec;
  }
  // todo 调用 insight module 中的方法生成 spec
  return {};
};
