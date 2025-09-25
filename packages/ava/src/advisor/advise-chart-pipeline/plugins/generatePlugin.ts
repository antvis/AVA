import { AdviseChartParams, AdviseChartPluginInput, AdvisorPlugin, IAdviseChartPipeline } from '@advisor/types';

import { AdviseChartPluginEnum } from '../constant';

export class GeneratePlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartPluginEnum.GeneratePlugin;

  apply = (pipeline: IAdviseChartPipeline) => {
    pipeline.stages.generate.tapPromise(this.name, this.execute);
  };

  execute = async (input: AdviseChartPluginInput) => {
    // TODO: Implement generate logic
    const { dataStore } = input;
    const result = {};
    dataStore.generate = result;
  };
}
