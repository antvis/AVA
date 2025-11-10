import type { AdvisorConfig, AdviseStageOutput, DataShard } from '../types';
import { DATA_SHAPE } from '../types';
import { adviseGraph } from './advise-graph';
import { advisePlainCharts } from './advise-plain-chart';
import { adviseTree } from './advise-tree';

/**
 * @desc advise charts based on data shape
 */
export async function adviseCharts(dataShards: DataShard[], config: AdvisorConfig = {}): Promise<AdviseStageOutput> {
  const shard = dataShards[0];
  switch (shard.shape) {
    case DATA_SHAPE.PLAIN:
      return advisePlainCharts(dataShards, config);
    case DATA_SHAPE.HIERARCHY:
      return adviseTree(dataShards, config);
    case DATA_SHAPE.RELATION:
      return adviseGraph(dataShards, config);
    default:
      return [];
  }
}
