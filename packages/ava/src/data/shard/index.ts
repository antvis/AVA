import _ from 'lodash';

import { DataStore } from '@ava/data/model/plain/DataStore';
import { DataFrame } from '@ava/data/model/plain/DataFrame';
import { requestLLM } from '@ava/utils/llm';
import { OpenAiLLM, TboxLLM } from '@ava/types';
import { logInDev } from '@ava/utils';

import { getShardPrompt, type Output } from './prompt';

/**
 * 根据字段特征进行分片，返回 DataFrame 数组
 * 比如通过字段简单的相关性来进行分片
 *
 * @param ds
 */
export const getPlainShard = async (ds: DataStore, config: TboxLLM | OpenAiLLM) => {
  const features = (await ds.getColumnFeatures()).map((v) => _.omit(v, ['rawData']));
  const prompt = getShardPrompt({
    columns: ds.columns,
    features,
  });
  logInDev.debug('data shard prompt: ', prompt);
  const modelResult = await requestLLM({
    prompt,
    config,
  });
  try {
    const res = JSON.parse(modelResult as string) as Output;
    logInDev.debug(res.analysis);
    const dataShards = await Promise.all(
      res.analysis.map(async (v) => {
        const df = new DataFrame(ds, {
          colIndexes: v.columns.map((v) => {
            logInDev.debug(v, ds.getColumnIndex(v));
            return ds.getColumnIndex(v);
          }),
        });
        const shardData = await df.toShard();
        return {
          ...shardData,
          purpose: [
            {
              purposeDesc: v.desc,
            },
          ],
        };
      })
    );
    return dataShards;
  } catch (e) {
    return [];
  }
};
