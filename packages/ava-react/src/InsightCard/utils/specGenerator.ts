import { DISPLAY_CHARTS_PLUGIN_KEY } from '../constants';

import type { NtvTypes } from '@antv/ava-react';
import type { InsightCardInfo } from '../types';

/** generate narrative paragraphs and visualizations for insight data */
export const generateNarrativeVisSpec = (insightInfo: InsightCardInfo): NtvTypes.NarrativeTextSpec => {
  const { visualizationSpecs } = insightInfo;
  if (visualizationSpecs) {
    const narrativeParagraphs: NtvTypes.ParagraphSpec[] = [];
    const charts: NtvTypes.ParagraphSpec[] = [];
    visualizationSpecs.forEach((visualizationSpec) => {
      const { narrativeSpec, chartSpec } = visualizationSpec;
      narrativeParagraphs.push(...narrativeSpec);
      charts.push({
        type: 'custom',
        customType: DISPLAY_CHARTS_PLUGIN_KEY,
        chartSpecs: [chartSpec],
      });
    });

    const insightContentSpec: NtvTypes.NarrativeTextSpec = {
      sections: [
        {
          paragraphs: [...narrativeParagraphs, ...charts],
        },
      ],
    };
    return insightContentSpec;
  }
  // todo 调用 insight module 中的方法生成 spec
  return {};
};
