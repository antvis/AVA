import {
  DataShard,
  Meta,
  TboxLLM,
  OpenAiLLM,
  PlainLikeDataType,
  HierarchyLikeDataType,
  RelationLikeDataType,
} from '@ava/types';

import { DATA_SHAPE } from './constants';
import { matchDataShape } from './infer';
import { getPlainShard } from './shard';
import { DataStore } from './model/DataStore';
import { Hierarchy } from './model/Hierarchy';
import { Relation } from './model/Relation';
import { extract } from './extract';

export const extractData: (
  input: string | Record<string, any> | Record<string, any>[],
  config?: {
    llmConfig?: TboxLLM | OpenAiLLM;
  }
) => Promise<DataShard[]> = async (input, config) => {
  const shards: DataShard[] = [];
  if (typeof input === 'string') {
    const res = extract(input, config?.llmConfig as TboxLLM);
    // todo: 校验和工程化处理
    return res;
  }
  const inferRes = matchDataShape(input);
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

    if (ds.columns.length >= 4 && config?.llmConfig) {
      const res = await getPlainShard(ds, config?.llmConfig);
      shards.push(...res);
    } else {
      shards.push({
        shape: DATA_SHAPE.PLAIN,
        data: input as PlainLikeDataType,
        metas,
      });
    }
  } else if (inferRes.shape === DATA_SHAPE.HIERARCHY) {
    const result = new Hierarchy(input as HierarchyLikeDataType);
    const metas = result.getFeatures();
    shards.push({
      shape: DATA_SHAPE.HIERARCHY,
      data: result.root as HierarchyLikeDataType,
      metas,
    });
  } else if (inferRes.shape === DATA_SHAPE.RELATION) {
    const relation = new Relation(inferRes.format.data as RelationLikeDataType);
    const features = relation.getFeatures();
    shards.push({
      shape: DATA_SHAPE.RELATION,
      data: inferRes.format.data,
      metas: [
        ...features.edgeFeatures.map((v) => {
          return {
            id: v.name,
            name: v.name,
            type: v.recommendation,
            statisticsFeature: v,
            fieldType: 'edge',
          };
        }),
        ...features.nodeFeatures.map((v) => {
          return {
            id: v.name,
            name: v.name,
            type: v.recommendation,
            statisticsFeature: v,
            fieldType: 'node',
          };
        }),
      ],
    });
  }

  return shards;
};
