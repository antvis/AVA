import { AdviseStageOutput, AdvisorConfig, DATA_SHAPE, DataShard } from '../types';
import { advisePlainCharts } from './plain';
import { adviseTree } from './tree';
import { adviseGraph } from './graph';

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
