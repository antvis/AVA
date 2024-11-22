import { cloneDeep } from 'lodash';

import {
  type AdvisorPipelineContext,
  type DataAnalyzeInput,
  type DataAnalyzeOutput,
  type AdvisorPluginType,
  PipelineStage,
} from '../../../../types';

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
