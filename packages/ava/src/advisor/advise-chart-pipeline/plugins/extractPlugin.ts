import _ from 'lodash';

import { extractData } from '@ava/extract';
import { AdviseChartParams, AdvisorPlugin, AdviseChartPluginInput } from '@ava/types';
import { AdviseChartPluginEnum } from '@ava/constants/pipeline';

export class ExtractPlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartPluginEnum.ExtractPlugin;

  apply(pipeline) {
    pipeline.stages.extract.tapPromise('ExtractPlugin', this.execute.bind(this));
  }

  async execute(ctx: AdviseChartPluginInput) {
    try {
      const { purpose } = ctx.context;
      const { data } = ctx.context;
      const input = `${purpose}\n${JSON.stringify(data)}`;
      const dataShards = await extractData(input);
      ctx.dataStore.extract.dataShards = dataShards;
    } catch (e) {
      ctx.dataStore.extract.dataShards = [];
    }
  }
}
