import {
  AdviseChartParams,
  AdviseStageOutput,
  AdviseText,
  AdviseTextParams,
  AdvisorConfig,
  BasePipeline,
  RenderParams,
} from '@ava/types';
import { renderChart } from '@ava/render/render';

import { AdviseChartPipeline } from './advise-chart-pipeline/pipeline';
import { AdviseTextPipeline } from './advise-text-pipeline/pipeline';

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

  // Function overload declarations
  // eslint-disable-next-line no-dupe-class-members
  advise(params: AdviseChartParams): Promise<AdviseStageOutput>;

  // eslint-disable-next-line no-dupe-class-members
  advise(params: AdviseTextParams): Promise<AdviseText>;

  // Actual implementation
  // eslint-disable-next-line no-dupe-class-members
  async advise(params: AdviseChartParams | AdviseTextParams): Promise<AdviseStageOutput | AdviseText> {
    if ('data' in params) {
      // recommend chart
      const result = await this.adviseChartPipeline.execute(params as AdviseChartParams);
      return result;
    }
    // recommend text
    // TODO: implement text recommendation
    await this.adviseTextPipeline.execute(params as AdviseTextParams);
    return {} as AdviseText;
  }

  render(params: RenderParams) {
    return renderChart(params);
  }
}
