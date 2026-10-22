import type { Semantic } from '@antv/ava/browser';

export interface AIDataset {
  name: string;
  rows: Record<string, unknown>[];
  semantic?: Semantic;
}
