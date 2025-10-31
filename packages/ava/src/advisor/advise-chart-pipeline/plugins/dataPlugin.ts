import _ from 'lodash';

import {
  AdviseChartParams,
  AdviseChartPluginInput,
  AdvisorPlugin,
  DataShard,
  IAdviseChartPipeline,
  Meta,
  TreeDataType,
} from '@ava/types';
import { AdviseChartPluginEnum } from '@ava/constants/pipeline';
import { matchDataShape, DATA_SHAPE, DataStore, Tree, Graph, getPlainShard } from '@ava/data';
import { logInDev } from '@ava/utils';

export class DataPlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartPluginEnum.DataPlugin;

  apply = (pipeline: IAdviseChartPipeline) => {
    pipeline.stages.data.tapPromise(this.name, this.execute);
  };

  execute = async (input: AdviseChartPluginInput) => {
    const { dataStore } = input;
    const { data, dataShards } = dataStore.extract;
    if (!dataShards) {
      const inferRes = matchDataShape(data);

      if (inferRes.shape === DATA_SHAPE.PLAIN) {
        const ds = new DataStore({
          data: inferRes.format.data,
          columns: inferRes.format.columns,
        });
        const features = await ds.getColumnFeatures();
        const metas: Meta[] = features.map((feature) => ({
          id: feature.name,
          name: feature.name,
          dataType: feature.types[0],
          allData: feature.rawData,
          statisticsFeature: feature,
        }));
        let dataShards: DataShard[] = [
          {
            shape: DATA_SHAPE.PLAIN,
            data,
            metas,
          },
        ];
        if (ds.columns.length >= 4) {
          // 满足条件就进行数据切片
          // TODO: @思莫
          dataShards = (await getPlainShard(ds, input.context.llm)) as DataShard[];
        }
        logInDev.debug('shards finnaly result: ', dataShards);
        dataStore.data = { dataShards };
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
        dataStore.data = { dataShards };
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
        dataStore.data = { dataShards };
      }
    } else {
      dataStore.data = {
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
