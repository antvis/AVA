import { cloneDeep } from 'lodash';
import { SyncHook } from 'tapable';

import {
  type AdvisorPipelineContext,
  type DataAnalyzeInput,
  type DataAnalyzeOutput,
  type AdvisorPluginType,
  PipelineStage,
} from '../../../../types';
import { Plugin } from '../../../../pipeline/plugin';
import { type BasePipeline, PIPELINE_STAGE } from '../../../../pipeline/types';

import { getDataProps } from './get-data-properties';
import { getSelectedData } from './get-selected-data';

export const DEFAULT_DATA_PROCESSOR_PLUGIN_NAME = 'defaultDataProcessor';

export const dataAnalyzePlugin: AdvisorPluginType<DataAnalyzeInput, DataAnalyzeOutput> = {
  name: DEFAULT_DATA_PROCESSOR_PLUGIN_NAME,
  stage: PipelineStage.dataAnalyze,
  execute: (input: DataAnalyzeInput, context: AdvisorPipelineContext): DataAnalyzeOutput => {
    const { data, customDataProps } = input;
    const { fields } = context?.options || {};
    const copyData = cloneDeep(data);
    const dataProps = getDataProps(copyData, fields, customDataProps);
    const filteredData = getSelectedData({ data: copyData, fields });
    return {
      data: filteredData,
      dataProps,
    };
  },
};

export class DataAnalyzePlugin extends Plugin<[DataAnalyzeInput, any], DataAnalyzeOutput> {
  hooks!: {
    after: SyncHook<DataAnalyzeOutput, void>;
  };

  constructor() {
    super('DataAnalyzePlugin');
    this.hooks = {
      after: new SyncHook(),
    };
  }

  execute = (input: DataAnalyzeInput, pipeline: BasePipeline) => {
    const { data, customDataProps } = input;
    const { fields } = pipeline?.context?.options || {};
    const copyData = cloneDeep(data);
    const dataProps = getDataProps(copyData, fields, customDataProps);
    const filteredData = getSelectedData({ data: copyData, fields });
    const pluginOutput = {
      data: filteredData,
      dataProps,
    };
    pipeline.dataStore.set(this.name, pluginOutput);
    pipeline.dataStore.set(PIPELINE_STAGE.STAGE_BEFORE, pluginOutput);
    this.hooks.after.call(pluginOutput);
    return pluginOutput;
  };

  apply = (pipeline: BasePipeline) => {
    pipeline.stages.before.tap(this.name, this.execute);
  };
}
