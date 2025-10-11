import { DataStore } from '@ava/data/model/plain/DataStore';
import { DataFrame } from '@ava/data/model/plain/DataFrame';

/**
 * 根据字段特征进行分片，返回 DataFrame 数组
 * 比如通过字段简单的相关性来进行分片
 *
 * @param ds
 */
export const toShardPlain = (ds: DataStore) => {
  return [new DataFrame(ds, { colIndexes: [0, 1] })];
};

/**
 * 通过数据特征来构建 prompt，用大模型来分片
 * @param ds
 */
export const getShardPlainPrompt = (ds: DataStore) => {
  return `${ds.data.length}`;
};
