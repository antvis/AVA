import _ from 'lodash';

import { extractData } from '../../../extract';
import { AdviseChartParams, AdvisorPlugin, AdviseChartPluginInput } from '../../../types';
import { AdviseChartPluginEnum } from '../../../constants/pipeline';

export class ExtractPlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartPluginEnum.ExtractPlugin;

  apply(pipeline) {
    pipeline.stages.extract.tapPromise('ExtractPlugin', this.execute.bind(this));
  }

  async execute(ctx: AdviseChartPluginInput) {
    try {
      const { data, llm, purpose } = ctx.context;
      const input = `${purpose}\n${JSON.stringify(data)}`;
      const dataShards = await extractData(input, { llmConfig: llm });
      ctx.dataStore.extract.dataShards = dataShards;
    } catch (e) {
      ctx.dataStore.extract.dataShards = [];
    }
  }
}
