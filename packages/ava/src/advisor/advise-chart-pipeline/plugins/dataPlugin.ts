import { AdviseChartParams, AdviseChartPluginInput, AdvisorPlugin, IAdviseChartPipeline } from '@ava/types';
// import { processFieldMetas } from '@ava/data/features/statistics';
import { AdviseChartPluginEnum } from '@ava/constants/pipeline';
import { inferDataShape, DATA_SHAPE, DataStore, Tree, Graph, Flow } from '@ava/data';

export class DataPlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartPluginEnum.DataPlugin;

  apply = (pipeline: IAdviseChartPipeline) => {
    pipeline.stages.data.tapPromise(this.name, this.execute);
  };

  execute = async (input: AdviseChartPluginInput) => {
    const { data } = input.dataStore.extract;
    const { dataShards } = input.dataStore.extract;
    if (!dataShards) {
      // 1. 先判定 input 的 shape，
      const inferRes = inferDataShape(data);
      let metas = [];
      if (inferRes.shape === DATA_SHAPE.PLAIN) {
        // todo: 将
        const ds = new DataStore({
          data: inferRes.format.data,
          columns: inferRes.format.columns,
        });
        const features = await ds.getColumnFeatures();
        metas = features.map((feature) => ({
          id: feature.name,
          dataType: feature.types[0],
          allData: feature.rawData,
          ...feature,
        }));
      } else if (inferRes.shape === DATA_SHAPE.TREE) {
        const tree = new Tree();
        tree.getFeatures();
      } else if (inferRes.shape === DATA_SHAPE.FLOW) {
        const flow = new Flow();
        flow.getFeatures();
      } else if (inferRes.shape === DATA_SHAPE.GRAPH) {
        // todo: 需要改造 Graph，来传入 infer 过程中已经计算过的 feature
        const graph = new Graph(inferRes.format.data);
        graph.getFeatures();
      }
      input.dataStore.data = {
        dataShards: [
          {
            shape: inferRes.shape,
            data,
            metas,
          },
        ],
      };
    } else {
      // todo: 遍历通过模型生成的 datashards，补齐 feature 和 metas 等
      input.dataStore.data = {
        dataShards: [
          {
            shape: DATA_SHAPE.PLAIN,
            data,
            // todo: 从 data 中抽取 metas
            metas: [],
          },
        ],
      };
    }
  };
}
