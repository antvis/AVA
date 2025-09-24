import { AdviseChartParams, IAdviseChartPipeline, AdviseChartPluginInput, AdvisorPlugin } from '@advisor/types';

export class GeneratePlugin implements AdvisorPlugin<AdviseChartParams> {
  name = 'generate';

  apply = (pipeline: IAdviseChartPipeline) => {
    pipeline.stages.generate.tapPromise(this.name, this.execute);
  };

  execute = async (input: AdviseChartPluginInput) => {
    // TODO: Implement generate logic
    const { dataStore } = input;
    const result = {};
    dataStore.generate.set('generate', result);
  };
}
