import _ from 'lodash';

import { Parser } from '@ava/parser';
import { AdviseChartParams, AdvisorPlugin, AdviseChartPluginInput, TboxLLM } from '@ava/types';
import { AdviseChartPluginEnum } from '@ava/constants/pipeline';

export class ExtractPlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartPluginEnum.ExtractPlugin;

  parser!: Parser;

  constructor() {
    this.parser = new Parser();
  }

  apply(pipeline) {
    pipeline.stages.extract.tapPromise('ExtractPlugin', this.execute.bind(this));
  }

  async execute(ctx: AdviseChartPluginInput) {
    const { purpose } = ctx.context;
    const { data } = ctx.context;
    if (!_.isNil(data)) {
      ctx.dataStore.extract.data = data;
      return;
    }
    if (typeof purpose === 'string') {
      try {
        const data = JSON.parse(purpose);
        ctx.dataStore.extract.data = data;
      } catch (e) {
        let res = await this.parser.parse(purpose, ctx.context.llm as TboxLLM);
        if (!Array.isArray(res)) {
          res = [res];
        }
        ctx.dataStore.extract.data = res.map((v) => v.data);
        ctx.dataStore.extract.dataShards = res;
      }
    }
  }
}
