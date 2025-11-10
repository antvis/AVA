import type { AdvisorConfig, AdviseStageOutput, Meta, PlainLikeDataType, DataShard } from '../types';

/**
 * @desc advise graph based on data shape
 */
export async function adviseGraph(dataShards: DataShard[], _config: AdvisorConfig = {}): Promise<AdviseStageOutput> {
  // TODO: implement graph advise
  return [
    {
      metas: dataShards[0].metas as Meta[],
      data: dataShards[0].data as PlainLikeDataType,
      charts: [],
    },
  ];
}
