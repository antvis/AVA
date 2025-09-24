import { AdviseChartParams, IAdviseChartPipeline, AdviseChartPluginInput, AdvisorPlugin } from '@advisor/types';

export class AdvisePlugin implements AdvisorPlugin<AdviseChartParams> {
  name = 'advisePlugin';

  apply = (pipeline: IAdviseChartPipeline) => {
    pipeline.stages.advise.tapPromise(this.name, this.execute);
  };

  execute = async (input: AdviseChartPluginInput) => {
    // TODO: Implement advise logic
    const { dataStore } = input;
    const result = {};
    dataStore.advise = result;
  };
}
