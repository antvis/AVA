import { AdviseChartParams, AdviseChartPluginInput, AdvisorPlugin, SubscribeFunction } from '@advisor/types';

import { AdviseChartStageEnum } from '../constant';

export class GeneratePlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartStageEnum.GeneratePlugin;

  apply = (subscribe: SubscribeFunction) => {
    subscribe(this.name, this.execute);
  };

  execute = async (input: AdviseChartPluginInput) => {
    // TODO: Implement generate logic
    const { dataStore } = input;
    const result = {};
    dataStore.generate = result;
  };
}
