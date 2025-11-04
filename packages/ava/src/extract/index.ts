import { DATA_SHAPE } from '@ava/extract/constants';
import { matchDataShape } from '@ava/extract/infer';
import { getPlainShard } from '@ava/extract/shard';
import { DataStore } from '@ava/extract/model/DataStore';
import { Hierarchy } from '@ava/extract/model/Hierarchy';
import { Relation } from '@ava/extract/model/Relation';
import { extract } from '@ava/extract/extract';

import type {
  DataShard,
  Meta,
  TboxLLM,
  OpenAiLLM,
  PlainLikeDataType,
  HierarchyLikeDataType,
  RelationLikeDataType,
} from '@ava/types';

export const extractData: (
  input: string | Record<string, any> | Record<string, any>[],
  config?: {
    llmConfig?: TboxLLM | OpenAiLLM;
  }
) => Promise<DataShard[]> = async (input, config) => {
  const shards: DataShard[] = [];
  if (typeof input === 'string') {
    const res = await extract(input, config?.llmConfig as TboxLLM);
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
    const result = new Hierarchy(inferRes.format.data as HierarchyLikeDataType);
    const metas = result.getFeatures();
    shards.push({
      shape: DATA_SHAPE.HIERARCHY,
      data: result.roots as HierarchyLikeDataType,
      metas,
    });
  } else if (inferRes.shape === DATA_SHAPE.RELATION) {
    const relation = new Relation(inferRes.format.data as RelationLikeDataType);
    const features = relation.getFeatures();
    shards.push({
      shape: DATA_SHAPE.RELATION,
      data: inferRes.format.data,
      // @ts-ignore
      metas: [
        ...features.edgeFeatures.map((v) => {
          return {
            id: v.name,
            name: v.name,
            dataType: v.recommendation,
            statisticsFeature: v,
          };
        }),
        ...features.nodeFeatures.map((v) => {
          return {
            id: v.name,
            name: v.name,
            dataType: v.recommendation,
            statisticsFeature: v,
          };
        }),
      ],
    });
  }

  return shards;
};
