import { isFunction, last } from 'lodash';

import type { AdvisorPluginType, AdvisorPipelineContext } from '../types';

/** 收集多个 plugin 的输出结果 */
type PluginResultMap<Output = any> = Record<string, Output>;

export class BaseComponent<Input = any, Output = any> {
  name: string;

  plugins: AdvisorPluginType<Input, Output>[] = [];

  /** 是否存在异步插件 */
  private hasAsyncPlugin: boolean = false;

  afterPluginsExecute?: (params: PluginResultMap<Output>, context?: AdvisorPipelineContext) => Output;

  context?: AdvisorPipelineContext;

  constructor(
    name,
    options?: {
      plugins?: AdvisorPluginType<Input, Output>[];
      afterPluginsExecute?: (params: PluginResultMap<Output>, context?: AdvisorPipelineContext) => Output;
      context?: AdvisorPipelineContext;
    }
  ) {
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

    this.plugins.push(plugin);
  }

  unloadPlugin(pluginName: string) {
    const plugin = this.plugins.find((item) => item.name === pluginName);
    if (plugin) {
      plugin.onUnload?.(this.context);
      this.plugins = this.plugins.filter((item) => item.name !== pluginName);
    }
  }

  execute(params: Input): Output {
    if (this.hasAsyncPlugin) {
      // eslint-disable-next-line no-console
      console.warn('存在异步执行的插件，请使用 executeAsync');
    }
    const pluginsOutput = {};
    this.plugins.forEach((plugin) => {
      plugin.onBeforeExecute?.(params, this.context);
      if (isFunction(plugin.condition) && !plugin.condition(params, this.context)) return;
      const output = plugin.execute(params, this.context) as Output;
      plugin.onAfterExecute?.(output, this.context);
      pluginsOutput[plugin.name] = output;
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
        plugin.onBeforeExecute?.(params, this.context);
        if (isFunction(plugin.condition) && !plugin.condition(params, this.context)) return;
        const output = (await plugin.execute(params, this.context)) as Output;
        plugin.onAfterExecute?.(output, this.context);
        pluginsOutput[plugin.name] = output;
      })
    ).then(async () => {
      return this.afterPluginsExecute?.(pluginsOutput, this.context);
    });
  }
}
