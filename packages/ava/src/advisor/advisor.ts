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

import { AdviseChartPipeline } from './advise-chart-pipeline/pipeline';
import { AdviseTextPipeline } from './advise-text-pipeline/pipeline';

let RENDERER: Renderer | null = null;

export function bindRenderer(fn: Renderer) {
  RENDERER = fn;
}

export class Advisor {
  adviseChartPipeline: BasePipeline<AdviseChartParams>;

  adviseTextPipeline: BasePipeline<AdviseTextParams>;

  constructor(config: AdvisorConfig = {}) {
    this.adviseChartPipeline = new AdviseChartPipeline({
      config,
    });
    this.adviseTextPipeline = new AdviseTextPipeline({
      config,
    });
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
    if (RENDERER) {
      return RENDERER(params);
    }
    logError('Chart render not configured');
    return null;
  }
}
