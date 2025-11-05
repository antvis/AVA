import { AsyncSeriesHook } from 'tapable';

import {
  AdviseText,
  AdviseTextParams,
  AdviseTextPluginInput,
  AdvisorConfig,
  AdvisorPlugin,
  BasePipeline,
  DataStore,
  Stages,
} from '../../types';

export class AdviseTextPipeline implements BasePipeline<AdviseTextParams> {
  config: AdvisorConfig;

  pluginMap: Map<string, AdvisorPlugin<AdviseTextParams>>;

  stages: Stages<AdviseTextParams>;

  dataStore: DataStore;

  constructor(params: { config: AdvisorConfig }) {
    this.dataStore = {
      extract: {},
      data: {
        data: [],
        metas: [],
      },
      // @ts-ignore
      advise: {},
      generate: {},
    };
    this.stages = {
      extract: new AsyncSeriesHook(['input']),
      // @ts-ignore
      data: new AsyncSeriesHook(['input']),
      advise: new AsyncSeriesHook(['input']),
      generate: new AsyncSeriesHook(['input']),
    };
    const allPlugins = [];
    this.pluginMap = new Map();
    allPlugins.forEach((plugin) => {
      this.pluginMap.set(plugin.name, plugin);
    });
    this.config = params.config;
    this.init();
  }

  private init = () => {
    this.pluginMap.forEach((plugin) => {
      plugin.apply(this);
    });
  };

  getPlugin = (name: string) => {
    return this.pluginMap.get(name);
  };

  execute = async (input: AdviseTextParams) => {
    const pluginInput: AdviseTextPluginInput = {
      dataStore: this.dataStore,
      context: {
        ...this.config,
        ...input,
      },
      curStage: '',
    };
    await this.stages.extract.promise(pluginInput);

    // @ts-ignore
    await this.stages.data.promise(pluginInput);

    await this.stages.advise.promise(pluginInput);

    await this.stages.generate.promise(pluginInput);

    return {} as AdviseText;
  };
}
