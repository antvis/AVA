import _ from 'lodash';

import { Parser } from '@ava/parser';
import { AdviseChartParams, AdvisorPlugin, AdviseChartPluginInput } from '@ava/types';
import { AdviseChartPluginEnum } from '@ava/constants/pipeline';

export class ExtractPlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartPluginEnum.ExtractPlugin;

  parser!: Parser;

  constructor() {
    this.parser = new Parser();
  }

  apply(pipeline) {
    pipeline.stages.data.tapPromise('TextParserPlugin', this.execute.bind(this));
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
        // 解析出数据形状、结构和意图以及拆分，输出给 dataplugin 进行分片
        // const result = this.parser.parse();
        // 原始数据
        // ctx.dataStore.extract.data = result.data;
        // 通过 LLM 解析的分片结构
        // ctx.dataStore.extract.dataFrames = result.dataFrames;
      }
    }
  }
}
