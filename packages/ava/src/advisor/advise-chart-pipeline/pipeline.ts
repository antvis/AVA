import { AsyncSeriesHook } from 'tapable';

import {
  AdviseChart,
  AdviseChartParams,
  AdvisorConfig,
  AdvisorPlugin,
  BasePipeline,
  DataStore,
  Stages,
  AdviseChartPluginInput,
} from '@ava/types';
import { AdviseChartPluginEnum, AdviseChartStageEnum } from '@ava/constants';

import { AdvisePlugin, DataPlugin, ExtractPlugin, GeneratePlugin } from './plugins';

export class AdviseChartPipeline implements BasePipeline<AdviseChartParams> {
  config: AdvisorConfig;

  pluginMap: Map<string, AdvisorPlugin<AdviseChartParams>>;

  stages: Stages<AdviseChartParams>;

  dataStore: DataStore;

  constructor(params: { config: AdvisorConfig }) {
    this.dataStore = {
      [AdviseChartStageEnum.Extract]: {},
      [AdviseChartStageEnum.Data]: {
        data: [],
        metas: [],
      },
      [AdviseChartStageEnum.Advise]: {},
      [AdviseChartStageEnum.Generate]: {},
    };
    this.stages = {
      [AdviseChartStageEnum.Extract]: new AsyncSeriesHook(['input']),
      [AdviseChartStageEnum.Data]: new AsyncSeriesHook(['input']),
      [AdviseChartStageEnum.Advise]: new AsyncSeriesHook(['input']),
      [AdviseChartStageEnum.Generate]: new AsyncSeriesHook(['input']),
    };
    const allPlugins = [new ExtractPlugin(), new DataPlugin(), new AdvisePlugin(), new GeneratePlugin()];
    this.pluginMap = new Map();
    allPlugins.forEach((plugin) => {
      this.pluginMap.set(plugin.name, plugin);
    });
    this.config = params.config;
    this.init();
  }

  getPlugin = (name: AdviseChartPluginEnum) => {
    return this.pluginMap.get(name);
  };

  private init = () => {
    this.pluginMap.forEach((plugin) => {
      plugin.apply(this);
    });
  };

  execute = async (input: AdviseChartParams) => {
    const pluginInput: AdviseChartPluginInput = {
      dataStore: this.dataStore,
      context: {
        ...this.config,
        ...input,
      },
      curStage: '',
    };
    await this.stages.extract.promise({ ...pluginInput, curStage: AdviseChartStageEnum.Extract });

    await this.stages.data.promise({ ...pluginInput, curStage: AdviseChartStageEnum.Data });

    await this.stages.advise.promise({ ...pluginInput, curStage: AdviseChartStageEnum.Extract });

    // TODO: 最后一个阶段改成优化图表配置
    // await this.stages.generate.promise({ ...pluginInput, curStage: AdviseChartStageEnum.Generate });

    const result = this.dataStore.generate;

    return result as AdviseChart[];
  };
}
