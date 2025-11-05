import { AsyncSeriesHook } from 'tapable';

import {
  AdviseChartParams,
  AdvisorConfig,
  AdvisorPlugin,
  BasePipeline,
  DataStore,
  Stages,
  AdviseChartPluginInput,
  AdviseStageOutput,
} from '../../types';
import { AdviseChartPluginEnum, AdviseChartStageEnum } from '../../constants';

import { AdvisePlugin, ExtractPlugin, GeneratePlugin } from './plugins';

export class AdviseChartPipeline implements BasePipeline<AdviseChartParams> {
  config: AdvisorConfig;

  pluginMap: Map<string, AdvisorPlugin<AdviseChartParams>>;

  stages: Stages<AdviseChartParams>;

  dataStore: DataStore;

  constructor(params: { config: AdvisorConfig }) {
    this.dataStore = {
      [AdviseChartStageEnum.Extract]: {},
      [AdviseChartStageEnum.Advise]: {} as AdviseStageOutput,
      [AdviseChartStageEnum.Generate]: {},
    };
    this.stages = {
      [AdviseChartStageEnum.Extract]: new AsyncSeriesHook(['input']),
      [AdviseChartStageEnum.Advise]: new AsyncSeriesHook(['input']),
      [AdviseChartStageEnum.Generate]: new AsyncSeriesHook(['input']),
    };
    const allPlugins = [new ExtractPlugin(), new AdvisePlugin(), new GeneratePlugin()];
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
    await this.stages.advise.promise({ ...pluginInput, curStage: AdviseChartStageEnum.Extract });

    // TODO: 最后一个阶段改成优化图表配置
    // await this.stages.generate.promise({ ...pluginInput, curStage: AdviseChartStageEnum.Generate });

    const result = this.dataStore.advise;

    return result;
  };
}
