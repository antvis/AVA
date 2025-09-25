import { AdviseChartParams, AdviseChartPluginInput, AdvisorPlugin, SubscribeFunction } from '@advisor/types';

import { AdviseChartPluginEnum } from '../constant';

export class AdvisePlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartPluginEnum.AdvisePlugin;

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
