import { AdviseChartParams, AdviseChartPluginInput, AdvisorPlugin, SubscribeFunction } from '@advisor/types';

import { AdviseChartStageEnum } from '../constant';

export class AdvisePlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartStageEnum.AdvisePlugin;

  apply = (subscribe: SubscribeFunction) => {
    subscribe(this.name, this.execute);
  };

  execute = async (input: AdviseChartPluginInput) => {
    // TODO: Implement advise logic
    const { dataStore } = input;
    const result = {};
    dataStore.advise = result;
  };
}
