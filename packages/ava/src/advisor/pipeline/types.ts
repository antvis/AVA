import { AsyncSeriesHook, SyncHook, AsyncParallelHook } from 'tapable';

import { AdviseParams, AdvisorPipelineContext } from '../types';

import { Plugin } from './plugin';

export enum PIPELINE_STAGE {
  STAGE_BEFORE = 'STAGE_BEFORE',
  STAGE_RECOMMEND = 'STATE_RECOMMEND',
  STAGE_GENERATE = 'STAGE_GENERATE',
}

export type DataStore = Map<string, any>;

export class BasePipeline extends Plugin<[AdviseParams], any> {
  dataStore!: DataStore;

  context?: AdvisorPipelineContext;

  pluginMap!: Map<string, Plugin<any[], any>>;

  stages!: {
    // 执行之前的预处理，内置的插件有数据统计特征计算
    before: SyncHook<[AdviseParams, BasePipeline], any>;
    // 执行推荐，内置插件有基于ckb、rule的规则推荐
    recommend: AsyncParallelHook<[any, BasePipeline], any>;
    // 生成，内置插件有生成推荐结果以及日志插件（只消费 ckb 的结果）
    generate: AsyncSeriesHook<[any, BasePipeline], void>;
  };

  getPlugin: (name: string) => Plugin<any, any> | undefined;

  // 执行流程默认是异步的
  execute: (params: AdviseParams) => Promise<any>;
}
