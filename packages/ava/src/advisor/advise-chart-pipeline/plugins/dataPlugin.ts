import { AdviseChartParams, AdviseChartPluginInput, AdvisorPlugin, SubscribeFunction } from '@advisor/types';

import { AdviseChartStageEnum } from '../constant';

export class DataPlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartStageEnum.DataPlugin;

  apply = (subscribe: SubscribeFunction) => {
    subscribe(this.name, this.execute);
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
