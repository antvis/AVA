import { AsyncParallelHook, SyncHook } from 'tapable';
import { last } from 'lodash';

import type { AdvisorPluginType, AdvisorPipelineContext } from '../types';

/** 收集多个 plugin 的输出结果 */
type PluginResultMap<Output = any> = Record<string, Output>;

export class BaseComponent<Input = any, Output = any> {
  name: string;

  plugins: AdvisorPluginType<Input, Output>[] = [];

  /** 是否存在异步插件 */
  private hasAsyncPlugin: boolean;

  pluginManager: AsyncParallelHook<[Input, PluginResultMap<Output>], Output>;

  syncPluginManager: SyncHook<[Input, PluginResultMap<Output>], Output>;

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
    this.pluginManager = new AsyncParallelHook(['data', 'results']);
    this.syncPluginManager = new SyncHook(['data', 'results']);
    this.context = options?.context;
    this.hasAsyncPlugin = !!options?.plugins?.find((plugin) => this.isPluginAsync(plugin));
    options?.plugins?.forEach((plugin) => {
      this.registerPlugin(plugin);
    });
  }

  private defaultAfterPluginsExecute(params: Record<string, Output>) {
    return last(Object.values(params));
  }

  private isPluginAsync(plugin: AdvisorPluginType) {
    // 检测插件是否为异步的，并设置hasAsyncPlugin标志位
    if (plugin.execute.constructor.name === 'AsyncFunction') {
      return true;
    }
    return false;
  }

  // 处理 之前都是同步的插件，新追加注册一个异步的插件 的情况 -- 需要执行的地方就不能用
  registerPlugin(plugin: AdvisorPluginType) {
    plugin.onLoad?.(this.context);
    this.plugins.push(plugin);
    if (this.isPluginAsync(plugin)) {
      this.hasAsyncPlugin = true;
    }

    if (this.hasAsyncPlugin) {
      this.pluginManager.tapPromise(plugin.name, async (input, outputs = {}) => {
        plugin.onBeforeExecute?.(input, this.context);
        const output = await plugin.execute(input, this.context);
        plugin.onAfterExecute?.(output, this.context);
        /* eslint-disable no-param-reassign */
        outputs[plugin.name] = output;
      });
    } else {
      this.syncPluginManager.tap(plugin.name, (input, outputs = {}) => {
        plugin.onBeforeExecute?.(input, this.context);
        const output = plugin.execute(input, this.context);
        plugin.onAfterExecute?.(output, this.context);
        /* eslint-disable no-param-reassign */
        outputs[plugin.name] = output;
        return output;
      });
    }
  }

  unloadPlugin(pluginName: string) {
    const plugin = this.plugins.find((item) => item.name === pluginName);
    if (plugin) {
      plugin.onUnload?.(this.context);
      this.plugins = this.plugins.filter((item) => item.name !== pluginName);
    }
  }

  execute(params: Input): Output | Promise<Output> {
    if (this.hasAsyncPlugin) {
      // console.warn('存在异步执行的插件，建议使用 executeAsync')
      const pluginsOutput = {};
      return this.pluginManager.promise(params, pluginsOutput).then(async () => {
        return this.afterPluginsExecute?.(pluginsOutput, this.context);
      });
    }
    const pluginsOutput = {};
    this.syncPluginManager.call(params, pluginsOutput);
    return this.afterPluginsExecute?.(pluginsOutput, this.context);
  }
}
