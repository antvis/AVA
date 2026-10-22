import type { AVA } from '@antv/ava/browser';
import type { AIDataset } from './types';

export async function loadDataset(ava: AVA, dataset: AIDataset) {
  await ava.source({ type: 'json', options: { data: dataset.rows } });
  if (dataset.semantic) await ava.semantic(undefined, () => dataset.semantic!);
}
