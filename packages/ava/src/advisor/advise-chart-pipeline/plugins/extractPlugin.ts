import { AdviseChartParams, AdviseChartPluginInput, AdvisorPlugin, IAdviseChartPipeline } from '@advisor/types';

import { AdviseChartPluginEnum } from '../constant';

export class ExtractPlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartPluginEnum.ExtractPlugin;

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
