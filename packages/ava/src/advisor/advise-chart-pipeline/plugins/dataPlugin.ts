import { AdviseChartParams, IAdviseChartPipeline, AdviseChartPluginInput, AdvisorPlugin } from '@advisor/types';

export class DataPlugin implements AdvisorPlugin<AdviseChartParams> {
  name = 'dataPlugin';

  apply = (pipeline: IAdviseChartPipeline) => {
    pipeline.stages.data.tapPromise(this.name, this.execute);
  };

  execute = async (input: AdviseChartPluginInput) => {
    // TODO: Implement data logic
    const { dataStore } = input;
    const result = {};
    dataStore.data = result;
  };
}
