import { AdviseChartParams, AdviseChartPluginInput, AdvisorPlugin, IAdviseChartPipeline } from '@ava/types';
import { processFieldMetas } from '@ava/data/features/statistics';
import { AdviseChartPluginEnum } from '@ava/constants/pipeline';

export class DataPlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartPluginEnum.DataPlugin;

  apply = (pipeline: IAdviseChartPipeline) => {
    pipeline.stages.data.tapPromise(this.name, this.execute);
  };

  execute = async (input: AdviseChartPluginInput) => {
    const { dataStore, context } = input;
    const { data, metas } = context;
    const finalMetas = processFieldMetas({
      metas,
      data,
    });
    const result = {
      data: context.data,
      metas: finalMetas,
    };
    dataStore.data = result;
  };
}
