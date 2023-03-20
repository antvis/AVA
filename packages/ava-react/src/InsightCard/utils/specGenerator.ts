import { InsightTypes, generateInsightVisualizationSpec } from '@antv/ava';

import { DISPLAY_CHARTS_PLUGIN_KEY } from '../constants';

import type { InsightCardInfo } from '../types';
import type { G2Spec } from '@antv/g2';
import type { NarrativeTextSpec, ParagraphSpec } from '@antv/ava';

/** generate narrative paragraphs and visualizations for insight data */
export const generateContentVisSpec = (
  insightInfo: InsightCardInfo,
  visualizationOptions: InsightTypes.VisualizationOptions
): NarrativeTextSpec => {
  const visualizationSpecs = generateInsightVisualizationSpec(insightInfo, visualizationOptions);
  if (visualizationSpecs) {
    const narrativeParagraphs: ParagraphSpec[] = [];
    const chartSpecs: G2Spec[] = [];
    visualizationSpecs.forEach((visualizationSpec) => {
      const { narrativeSpec, chartSpec } = visualizationSpec;
      narrativeParagraphs.push(...narrativeSpec);
      chartSpecs.push(chartSpec);
    });

    const insightContentSpec: NarrativeTextSpec = {
      sections: [
        {
          paragraphs: [
            ...narrativeParagraphs,
            {
              type: 'custom',
              customType: DISPLAY_CHARTS_PLUGIN_KEY,
              chartSpecs,
            },
          ],
        },
      ],
    };
    return insightContentSpec;
  }

  return {};
};
