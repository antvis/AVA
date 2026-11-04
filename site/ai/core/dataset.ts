import type { AVA } from '@antv/ava/browser';
import type { AIDataset } from './types';

export async function loadDataset(ava: AVA, dataset: AIDataset) {
  if (dataset.sqlite) {
    await import('./sqlite');
    await ava.source({ type: 'sqlite', options: { path: dataset.name } });
  } else {
    await ava.source({ type: 'json', options: { data: dataset.rows } });
  }
  if (dataset.semantic) await ava.semantic(undefined, () => dataset.semantic!);
}
