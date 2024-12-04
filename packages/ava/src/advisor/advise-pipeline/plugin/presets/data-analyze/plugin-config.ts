import { cloneDeep } from 'lodash';
import { SyncHook, AsyncSeriesHook } from 'tapable';

import { type DataAnalyzeInput, type DataAnalyzeOutput } from '../../../../types';
import { AdvisorPlugin } from '../../../../pipeline/plugin';
import { type BasePipeline, DEFAULT_RES_KEY, ContextOptions } from '../../../../pipeline/types';

import { getDataProps } from './get-data-properties';
import { getSelectedData } from './get-selected-data';

type ArgType = ContextOptions<Map<string, DataAnalyzeOutput>>;

export const DEFAULT_DATA_PROCESSOR_PLUGIN_NAME = 'defaultDataProcessor';

export class DataAnalyzePlugin extends AdvisorPlugin<[DataAnalyzeInput, ArgType], void> {
  hooks!: {
    after: SyncHook<DataAnalyzeOutput, void>;
    afterAsync: AsyncSeriesHook<DataAnalyzeOutput, void>;
  };

  constructor() {
    super('DataAnalyzePlugin');
    this.hooks = {
      after: new SyncHook(['input']),
      afterAsync: new AsyncSeriesHook(['input']),
    };
  }

  run = (input: DataAnalyzeInput, config) => {
    const { context } = config;
    const { data, customDataProps } = input;
    const { fields } = context?.options || {};
    const copyData = cloneDeep(data);
    const dataProps = getDataProps(copyData, fields, customDataProps);
    const filteredData = getSelectedData({ data: copyData, fields });
    const pluginOutput = {
      data: filteredData,
      dataProps,
    };
    return pluginOutput;
  };

  execute = (input: DataAnalyzeInput, config) => {
    const { dataStore } = config;
    const result = this.run(input, config);
    dataStore.set(this.name, result);
    dataStore.set(DEFAULT_RES_KEY, result);
    this.hooks.after.call(result);
  };

  executeAsync = async (input: DataAnalyzeInput, config) => {
    const { dataStore } = config;
    const result = this.run(input, config);
    dataStore.set(this.name, result);
    dataStore.set(DEFAULT_RES_KEY, result);
    await this.hooks.afterAsync.promise(result);
  };

  apply = (pipeline: BasePipeline) => {
    pipeline.stages.before.tap(this.name, this.execute);
    pipeline.stages.beforeAsync.tapPromise(this.name, this.executeAsync);
  };
}
