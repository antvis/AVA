import _ from 'lodash';

import {
  AdviseChartParams,
  AdviseChartPluginInput,
  AdvisorPlugin,
  DataShard,
  IAdviseChartPipeline,
  TreeDataType,
} from '@ava/types';
import { AdviseChartPluginEnum } from '@ava/constants/pipeline';
import { matchDataShape, DATA_SHAPE, DataStore, Tree, Graph, Flow } from '@ava/data';

export class DataPlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartPluginEnum.DataPlugin;

  apply = (pipeline: IAdviseChartPipeline) => {
    pipeline.stages.data.tapPromise(this.name, this.execute);
  };

  execute = async (input: AdviseChartPluginInput) => {
    const { data } = input.dataStore.extract;
    const { dataShards } = input.dataStore.extract;
    if (!dataShards) {
      const inferRes = matchDataShape(data);

      if (inferRes.shape === DATA_SHAPE.PLAIN) {
        const ds = new DataStore({
          data: inferRes.format.data,
          columns: inferRes.format.columns,
        });
        const features = await ds.getColumnFeatures();
        const metas = features.map((feature) => ({
          id: feature.name,
          dataType: feature.types[0],
          allData: feature.rawData,
          ...feature,
        }));
        const dataShards: DataShard[] = [
          {
            shape: DATA_SHAPE.TREE,
            data,
            metas,
          },
        ];
        input.dataStore.data = { dataShards };
      } else if (inferRes.shape === DATA_SHAPE.TREE) {
        const tree = new Tree(data as TreeDataType);
        const metas = tree.getFeatures();
        tree.getFeatures();
        const dataShards: DataShard[] = [
          {
            shape: DATA_SHAPE.TREE,
            data: tree.root as TreeDataType,
            metas,
          },
        ];
        input.dataStore.data = { dataShards };
      } else if (inferRes.shape === DATA_SHAPE.FLOW) {
        const flow = new Flow();
        flow.getFeatures();
      } else if (inferRes.shape === DATA_SHAPE.GRAPH) {
        const graph = new Graph(inferRes.format.data);
        const features = graph.getFeatures();
        const dataShards: DataShard[] = [
          {
            shape: DATA_SHAPE.GRAPH,
            data: inferRes.format.data,
            metas: [features],
          },
        ];
        input.dataStore.data = { dataShards };
      }
    } else {
      input.dataStore.data = {
        dataShards: dataShards.map((dataShard) => ({
          ...dataShard,
          metas: dataShard.metas.map((v) => ({
            ...v,
            id: v.name,
          })),
        })),
      };
    }
  };
}
