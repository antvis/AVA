import { AdviseChartParams, IAdviseChartPipeline, AdviseChartPluginInput, AdvisorPlugin } from '@advisor/types';

export class ExtractPlugin implements AdvisorPlugin<AdviseChartParams> {
  name = 'extractPlugin';

  apply = (pipeline: IAdviseChartPipeline) => {
    pipeline.stages.extract.tapPromise(this.name, this.execute);
  };

  execute = async (input: AdviseChartPluginInput) => {
    // TODO: Implement extract logic
    const { dataStore } = input;
    const result = {};
    dataStore.extract = result;
  };
}
