import { cloneDeep } from 'lodash';

import { getDataProps } from './get-data-properties';
import { getSelectedData } from './get-selected-data';

import type {
  AdvisorPipelineContext,
  DataProcessorInput,
  DataProcessorOutput,
  AdvisorPluginType,
} from '../../../../types';

export const dataProcessorPlugin: AdvisorPluginType<DataProcessorInput, DataProcessorOutput> = {
  name: 'defaultDataProcessor',
  stage: ['dataAnalyze'],
  execute: (input: DataProcessorInput, context: AdvisorPipelineContext): DataProcessorOutput => {
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
