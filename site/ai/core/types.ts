import type { Semantic } from '@antv/ava/browser';

export interface AIDataset {
  name: string;
  rows: Record<string, unknown>[];
  sqlite?: Uint8Array;
  rowCount?: number;
  tableCount?: number;
  semantic?: Semantic;
}
