import { AsyncSeriesWaterfallHook } from 'tapable';

import { AdviseParams, AdvisorPipelineContext, AdvisorPluginType, PipelineStage } from '../types';
import { dataAnalyzePlugin, specGeneratePlugin } from '../advise-pipeline';
import { chartRecommendPlugin } from '../advise-pipeline/plugin';

import { Stage } from './stage';

export class Pipeline<Input = AdviseParams, Output = any> {
  stages: Stage<any, any>[];

  stageManager: AsyncSeriesWaterfallHook<any, any>;

  plugins: AdvisorPluginType[] = [];

  context: AdvisorPipelineContext;

  constructor({
    plugins,
    stages,
    context,
  }: {
    plugins: AdvisorPluginType[];
    stages?: Stage<any, any>[];
    context?: AdvisorPipelineContext;
  }) {
    this.plugins = plugins;
    this.context = context;
    this.stages = stages ?? this.getDefaultStages();
    this.stageManager = new AsyncSeriesWaterfallHook(['initialParams']);

    this.stages.forEach((component) => {
      if (!component) return;
      this.stageManager.tapPromise(component.name, async (previousResult) => {
        const input = previousResult;
        const componentOutput = await component.executeAsync(input || {});

        return {
          ...input,
          ...componentOutput,
        };
      });
    });
  }

  getDefaultPlugins() {
    return [dataAnalyzePlugin, chartRecommendPlugin, specGeneratePlugin];
  }

  private getDefaultStages() {
    const defaultStageNames = [PipelineStage.dataAnalyze, PipelineStage.chartRecommend, PipelineStage.specGenerate];
    return defaultStageNames.map((stageName) => {
      const stagePlugins = this.plugins.filter((plugin) => plugin.stage === stageName);
      const stage = new Stage(stageName, { plugins: stagePlugins, context: this.context });
      return stage;
    });
  }

  async execute(params: Input): Promise<Output> {
    this.context = {
      ...this.context,
      ...params,
    };
    const result = await this.stageManager.promise(params);
    return result;
  }

  registerPlugins(plugins: AdvisorPluginType[] = []) {
    plugins.forEach((plugin) => {
      const stage = this.stages.find((stage) => stage.name === plugin.stage);
      if (stage) {
        this.plugins.push(plugin);
        stage.registerPlugin(plugin);
      }
    });
  }
}
