import { AdviseChartParams, AdviseChartPluginInput, AdvisorPlugin, SubscribeFunction } from '@advisor/types';

import { AdviseChartStageEnum } from '../constant';

export class ExtractPlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartStageEnum.ExtractPlugin;

  apply = (subscribe: SubscribeFunction) => {
    subscribe(this.name, this.execute);
  };

  execute = async (input: AdviseChartPluginInput) => {
    // TODO: Implement extract logic
    const { dataStore } = input;
    const result = {};
    dataStore.extract = result;
  };
}
