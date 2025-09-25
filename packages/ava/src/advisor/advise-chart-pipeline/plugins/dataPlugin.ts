import { AdviseChartParams, AdviseChartPluginInput, AdvisorPlugin, IAdviseChartPipeline } from '@advisor/types';

import { AdviseChartPluginEnum } from '../constant';

export class DataPlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartPluginEnum.DataPlugin;

  apply = (pipeline: IAdviseChartPipeline) => {
    pipeline.stages.data.tapPromise(this.name, this.execute);
  };

  execute = async (input: AdviseChartPluginInput) => {
    // TODO: Implement data logic
    const { dataStore, context } = input;
    const result = {
      data: context.data,
      metas: context.metas,
    };
    dataStore.data = result;
  };
}
