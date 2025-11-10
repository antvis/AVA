import type { AdvisorConfig, AdviseStageOutput, Meta, PlainLikeDataType, DataShard } from '../types';

/**
 * @desc advise tree based on data shape
 */
export async function adviseTree(dataShards: DataShard[], _config: AdvisorConfig = {}): Promise<AdviseStageOutput> {
  // TODO: implement tree advise
  return [
    {
      metas: dataShards[0].metas as Meta[],
      data: dataShards[0].data as PlainLikeDataType,
      charts: [],
    },
  ];
}
