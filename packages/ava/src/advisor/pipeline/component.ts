import { isFunction, last } from 'lodash';

import type { AdvisorPluginType, AdvisorPipelineContext } from '../types';

/** 收集多个 plugin 的输出结果 */
type PluginResultMap<Output = any> = Record<string, Output>;

interface BaseComponentType<Input = any, Output = any> {
  name: string;
  /** 内部 plugin 数组的执行方式，目前仅并行执行，后续可扩展串行、瀑布型等，适应更多的插件编排方式 */
  executeType?: 'parallel';
  registerPlugin: (plugin: AdvisorPluginType) => void;
  unloadPlugin: (pluginName: string) => void;
  afterPluginsExecute?: (params: PluginResultMap<Output>, context?: AdvisorPipelineContext) => Output;
  execute: (input: Input) => Output;
  executeAsync: (input: Input) => Promise<Output>;
}

export type ComponentOptions<Input = any, Output = any> = {
  plugins?: AdvisorPluginType<Input, Output>[];
  afterPluginsExecute?: (params: PluginResultMap<Output>, context?: AdvisorPipelineContext) => Output;
  context?: AdvisorPipelineContext;
};

export class BaseComponent<Input = any, Output = any> implements BaseComponentType<Input, Output> {
  name: string;

  executeType: 'parallel';

  readonly context?: AdvisorPipelineContext;

  private plugins: AdvisorPluginType<Input, Output>[] = [];

  /** 是否存在异步插件 */
  private hasAsyncPlugin: boolean = false;

  afterPluginsExecute?: (params: PluginResultMap<Output>, context?: AdvisorPipelineContext) => Output;

  getPlugins() {
    return this.plugins;
  }

  get isAsync() {
    return this.hasAsyncPlugin;
  }

  constructor(name, options?: ComponentOptions) {
    this.name = name;
    this.afterPluginsExecute = options?.afterPluginsExecute ?? this.defaultAfterPluginsExecute;
    this.context = options?.context;
    this.hasAsyncPlugin = !!options?.plugins?.find((plugin) => this.isPluginAsync(plugin));
    options?.plugins?.forEach((plugin) => {
      this.registerPlugin(plugin);
    });
  }

  private defaultAfterPluginsExecute(params: Record<string, Output | null>) {
    if (this.plugins.length) {
      const lastPlugin = last(this.plugins);
      return params[lastPlugin.name];
    }
    return null;
  }

  private isPluginAsync(plugin: AdvisorPluginType) {
    // 检测插件是否为异步的
    if (plugin.type === 'async' || plugin.execute.constructor.name === 'AsyncFunction') {
      return true;
    }
    return false;
  }

  registerPlugin(plugin: AdvisorPluginType) {
    plugin.onLoad?.(this.context);
    if (this.isPluginAsync(plugin)) {
      this.hasAsyncPlugin = true;
    }
    const existPlugin = this.plugins.find((item) => item.name === plugin.name);
    if (existPlugin) {
      this.unloadPlugin(existPlugin.name);
    }
    this.plugins.push(plugin);
  }

  unloadPlugin(pluginName: string) {
    const plugin = this.plugins.find((item) => item.name === pluginName);
    if (plugin) {
      plugin.onUnload?.(this.context);
      this.plugins = this.plugins.filter((item) => item.name !== pluginName);
    }
  }

  private executeSinglePlugin(plugin: AdvisorPluginType, params: Input, result?: PluginResultMap) {
    plugin.onBeforeExecute?.(params, this.context);
    if (isFunction(plugin.condition) && !plugin.condition(params, this.context)) return null;
    if (this.isPluginAsync(plugin)) {
      return plugin.execute(params, this.context).then((output: Output) => {
        plugin.onAfterExecute?.(output, this.context);
        // eslint-disable-next-line no-param-reassign
        result[plugin.name] = output;
      });
    }
    const output = plugin.execute(params, this.context) as Output;
    plugin.onAfterExecute?.(output, this.context);
    // eslint-disable-next-line no-param-reassign
    result[plugin.name] = output;
    return output;
  }

  execute(params: Input): Output {
    if (this.hasAsyncPlugin) {
      // eslint-disable-next-line no-console
      console.warn('存在异步执行的插件，请使用 executeAsync');
    }
    const pluginsOutput = {};
    this.plugins.forEach((plugin) => {
      this.executeSinglePlugin(plugin, params, pluginsOutput);
    });
    return this.afterPluginsExecute?.(pluginsOutput, this.context);
  }

  async executeAsync(params: Input): Promise<Output> {
    if (!this.hasAsyncPlugin) {
      return Promise.resolve(this.execute(params));
    }
    const pluginsOutput = {};
    return Promise.all(
      this.plugins.map(async (plugin) => {
        await this.executeSinglePlugin(plugin, params, pluginsOutput);
      })
    ).then(async () => {
      return this.afterPluginsExecute?.(pluginsOutput, this.context);
    });
  }
}
