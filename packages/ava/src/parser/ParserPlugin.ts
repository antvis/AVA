import { Parser } from './Parser';

import type { AdviseChartPipeline } from '@ava/advisor/advise-chart-pipeline/pipeline';

export class TextParserPlugin {
  parser!: Parser;

  constructor() {
    this.parser = new Parser();
  }

  apply(pipeline: AdviseChartPipeline) {
    pipeline.stages.data.tapPromise('TextParserPlugin', this.excute.bind(this));
  }

  async excute(ctx) {
    const input = ctx.dataStore.data?.input;
    if (typeof input === 'string') {
      const result = this.parser.parse();
      // set result to store
      return result;
    }
    return {
      data: input,
    };
  }
}
