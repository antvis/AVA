import _ from 'lodash';

import { DATA_SHAPE } from '../types';
import { DataStore } from './model/DataStore';
import { Hierarchy } from './model/Hierarchy';
import { Relation } from './model/Relation';
import { extractText } from './extract';

import type {
  DataShard,
  PlainLikeDataType,
  HierarchyLikeDataType,
  RelationLikeDataType,
  AdvisorConfig,
} from '../types';

const computeFeatures = (shard: DataShard): DataShard => {
  let featuresMap = {};
  if (shard.shape === DATA_SHAPE.PLAIN) {
    const metaIds = shard.metas.map((meta) => meta.id);
    const ds = new DataStore({
      data: (shard.data as PlainLikeDataType).map((record) => {
        return metaIds.map((id) => record[id]);
      }),
      columns: metaIds,
    });
    const features = ds.getColumnFeatures();
    featuresMap = _.keyBy(features, 'name');
  } else if (shard.shape === DATA_SHAPE.HIERARCHY) {
    const result = new Hierarchy(shard.data as HierarchyLikeDataType);
    const features = result.getFeatures();
    featuresMap = _.keyBy(features, 'name');
  } else if (shard.shape === DATA_SHAPE.RELATION) {
    const relation = new Relation(shard.data as RelationLikeDataType);
    const features = relation.getFeatures();
    featuresMap = _.keyBy(features, 'name');
  }
  return {
    ...shard,
    metas: shard.metas.map((meta) => {
      return {
        ...meta,
        statisticsFeature: featuresMap[meta.id],
      };
    }),
  };
};

export const extract = async (
  input: string,
  config?: {
    llmConfig?: AdvisorConfig['llm'];
  }
) => {
  // extract with llm
  let dataShards = await extractText(input, config?.llmConfig);
  if (!_.isArray(dataShards)) {
    dataShards = [dataShards];
  }

  // compute features
  dataShards = dataShards.map((shard) => {
    return computeFeatures(shard);
  });

  return dataShards;
};
