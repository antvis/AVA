import { Subspace, generateInsightVisualizationSpec } from '@antv/ava';

import { DISPLAY_CHARTS_PLUGIN_KEY, SUBSPACE_DESCRIPTION_PLUGIN_KEY } from '../constants';

import type { G2Spec } from '@antv/g2';
import type { NarrativeTextSpec, ParagraphSpec, InsightInfo, InsightVisualizationOptions } from '@antv/ava';

/**
 * generate description of data subspace (the conditions of data subset)
 * 描述数据子空间
 */
export const getSubspaceDescriptionSpec = (subspace: Subspace = []): ParagraphSpec => {
  const conditionDescriptions = subspace.map((condition) => {
    const { dimension, value } = condition;
    return `${dimension}=${value}`;
  });
  return {
    type: 'normal',
    phrases: [
      {
        type: 'custom',
        value: conditionDescriptions.join(','),
        metadata: {
          customType: SUBSPACE_DESCRIPTION_PLUGIN_KEY,
        },
      },
    ],
  };
};

/** generate narrative paragraphs and visualizations for insight data */
export const generateContentVisSpec = (
  insightInfo: InsightInfo,
  visualizationOptions: InsightVisualizationOptions
): NarrativeTextSpec => {
  if (!insightInfo) return {};
  const visualizationSpecs = generateInsightVisualizationSpec(insightInfo, visualizationOptions);

  if (visualizationSpecs) {
    const narrativeParagraphs: ParagraphSpec[] = [];
    const chartSpecs: G2Spec[] = [];

    if (insightInfo.subspace?.length) {
      const subspaceDescriptionSpec = getSubspaceDescriptionSpec(insightInfo.subspace);
      narrativeParagraphs.push(subspaceDescriptionSpec);
    }

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
