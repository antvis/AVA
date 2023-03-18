import { NtvTypes } from '../../NarrativeTextVis';

import type { G2Spec } from '@antv/g2';

export type ChartsSchema = NtvTypes.CustomBlockElement & {
  value: {
    charts: G2Spec[];
  };
};
