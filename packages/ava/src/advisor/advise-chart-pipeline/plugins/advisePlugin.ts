import { AdviseChartParams, AdviseChartPipeline, AdviseChartPluginInput, AdvisorPlugin } from '@advisor/types';

export class AdvisePlugin implements AdvisorPlugin<AdviseChartParams> {
  name = 'advise';

  apply = (pipeline: AdviseChartPipeline) => {
    pipeline.stages.advise.tapPromise(this.name, this.execute);
  };

  execute = async (input: AdviseChartPluginInput) => {
    // TODO: Implement advise logic
    const { dataStore } = input;
    const result = {};
    dataStore.advise.set('advise', result);
  };
}
