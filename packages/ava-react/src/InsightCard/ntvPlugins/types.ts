import type { G2Spec } from '@antv/g2';
import type { CustomBlockElement } from '@antv/ava';

export type ChartsSchema = CustomBlockElement & {
  chartSpecs: G2Spec[];
};
