import { logError } from '@ava/utils';
import {
  AdviseChartParams,
  AdviseStageOutput,
  AdviseText,
  AdviseTextParams,
  AdvisorConfig,
  BasePipeline,
  Renderer,
  RenderParams,
} from '@ava/types';
import { extractData } from '@ava/extract';

import { AdviseChartPipeline } from './advise-chart-pipeline/pipeline';
import { AdviseTextPipeline } from './advise-text-pipeline/pipeline';

export class Advisor {
  static RENDERER: Renderer;

  static bindRenderer(renderer: Renderer) {
    Advisor.RENDERER = renderer;
  }

  config!: AdvisorConfig;

  adviseChartPipeline: BasePipeline<AdviseChartParams>;

  adviseTextPipeline: BasePipeline<AdviseTextParams>;

  constructor(config: AdvisorConfig = {}) {
    this.config = config;
    this.adviseChartPipeline = new AdviseChartPipeline({
      config,
    });
    this.adviseTextPipeline = new AdviseTextPipeline({
      config,
    });
  }

  async extract(params: AdviseChartParams) {
    const { purpose, data } = params;
    const input = purpose ?? data;
    const dataShards = await extractData(input, { llmConfig: this.config.llm });
    return dataShards;
  }

  // eslint-disable-next-line no-dupe-class-members
  advise(params: AdviseChartParams): Promise<AdviseStageOutput>;

  // eslint-disable-next-line no-dupe-class-members
  advise(params: AdviseTextParams): Promise<AdviseText>;

  // Actual implementation
  // eslint-disable-next-line no-dupe-class-members
  async advise(params: AdviseChartParams | AdviseTextParams): Promise<AdviseStageOutput | AdviseText> {
    const result = await this.adviseChartPipeline.execute(params as AdviseChartParams);
    return result;
    // recommend text
    // TODO: implement text recommendation
    // await this.adviseTextPipeline.execute(params as AdviseTextParams);
    // return {} as AdviseText;
  }

  render(params: RenderParams) {
    if (Advisor.RENDERER) {
      return Advisor.RENDERER(params);
    }
    logError('Chart render not configured');
    return null;
  }
}
