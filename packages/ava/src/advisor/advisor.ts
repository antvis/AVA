import { AdviseChartParams, AdviseChart, AdviseText, AdvisorConfig, BasePipeline, AdviseTextParams } from './types';
import { AdviseChartPipeline } from './advise-chart-pipeline/pipeline';
import { AdviseTextPipeline } from './advise-text-pipeline/pipeline';

export class Advisor {
  adviseChartPipeline: BasePipeline<AdviseChartParams>;

  adviseTextPipeLine: BasePipeline<AdviseTextParams>;

  constructor(config: AdvisorConfig = {}) {
    this.adviseChartPipeline = new AdviseChartPipeline({
      config,
    });
    this.adviseTextPipeLine = new AdviseTextPipeline({
      config,
    });
  }

  // Function overload declarations
  // eslint-disable-next-line no-dupe-class-members
  advise(params: AdviseChartParams): Promise<AdviseChart[]>;

  // eslint-disable-next-line no-dupe-class-members
  advise(params: AdviseTextParams): Promise<AdviseText>;

  // Actual implementation
  // eslint-disable-next-line no-dupe-class-members
  async advise(params: AdviseChartParams | AdviseTextParams): Promise<AdviseChart[] | AdviseText> {
    if ('data' in params) {
      // recommend chart
      await this.adviseChartPipeline.execute(params as AdviseChartParams);
      return [] as AdviseChart[];
    }
    // recommend text
    // TODO: implement text recommendation
    await this.adviseTextPipeLine.execute(params as AdviseTextParams);
    return {} as AdviseText;
  }
}
