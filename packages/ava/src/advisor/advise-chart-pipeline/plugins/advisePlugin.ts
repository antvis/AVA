import { logError, logInDev, requestTboxLLM, requestOpenAiLLM, isOpenAi, isTbox } from '@ava/utils';
import {
  AdviseChartParams,
  AdviseChartPluginInput,
  AdvisorPlugin,
  ChartConfig,
  AdviseChart,
  IAdviseChartPipeline,
  FieldDataType,
} from '@ava/types';
import {
  generateAllChartConfigs,
  getChartConfigScoringPrompt,
  optimizeChartConfig,
  sortChartConfigs,
  transformChartEncode,
} from '@ava/advisor/chartAdvise';
import { AdviseChartPluginEnum } from '@ava/constants/pipeline';
import { DATA_SHAPE } from '@ava/data';

export class AdvisePlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartPluginEnum.AdvisePlugin;

  apply = (pipeline: IAdviseChartPipeline) => {
    pipeline.stages.advise.tapPromise(this.name, this.execute);
  };

  execute = async (input: AdviseChartPluginInput) => {
    const { dataStore, context } = input;
    const { excludes, includes, disableModel, forceType, purpose = '', llm } = context;
    const { dataShards } = dataStore.data;
    let allChartConfigs: ChartConfig[] = [];
    // create all valid chart configs using field data
    const shard = dataShards[0];
    allChartConfigs = generateAllChartConfigs(shard.metas, excludes, includes);
    logInDev.debug('All possible chart configs', JSON.stringify(allChartConfigs));

    // Use LLM to score all chart configs based on user purpose/data/metas
    let _llmCompleted = false;
    let _llmCostTime = '';
    const { metas } = shard;
    const data = shard.data as FieldDataType<DATA_SHAPE.PLAIN>;
    if (!forceType) {
      if (!disableModel) {
        try {
          const prompt = getChartConfigScoringPrompt({
            userInput: purpose,
            chartConfig: allChartConfigs,
            metas,
            data,
          });
          const startTime = performance.now();
          let LLMRes = '';
          if (isOpenAi(llm)) {
            LLMRes = await requestOpenAiLLM({ config: llm, prompt });
          } else if (isTbox(llm)) {
            LLMRes = await requestTboxLLM({ config: llm, prompt });
          } else {
            logError('LLM config is missing or invalid');
          }
          if (LLMRes) {
            logInDev.debug('chart configs after LLM scoring', LLMRes);
            allChartConfigs = sortChartConfigs(allChartConfigs, LLMRes);
            const endTime = performance.now();
            _llmCostTime = ((endTime - startTime) / 1000).toFixed(2);
            _llmCompleted = true;
          } else {
            logError('LLM scoring failed');
          }
        } catch (error) {
          logError('LLM scoring failed', error);
        }
      }
      // Optimize chart configuration based on rules
      const finalRes = optimizeChartConfig({
        chartConfigs: allChartConfigs,
        metas,
        data,
      });
      logInDev.debug('chart configs after optimization', JSON.stringify(finalRes));
      const result = {
        adviseCharts: finalRes,
        metas,
        data,
      };

      dataStore.advise = result;
    } else {
      // user specified chart type
      const finalRes: AdviseChart[] = allChartConfigs
        .filter((item) => item.type === forceType)
        .map((item) => ({
          type: item.type,
          encode: transformChartEncode(item.encode),
        }));

      const result = {
        adviseCharts: finalRes,
        metas,
        data,
      };
      dataStore.advise = result;
    }
  };

  advisePlain = async () => {
    // todo: 原来的推荐逻辑
  };

  adviseTree = () => {
    // 定向到树图的集合
    // todo: 确定哪些具体图表类型和参数结构，prompt & 知识库 里需要构建
  };

  adviseGraph = () => {
    // 定向到图集合
    // todo: 确定哪些图表类型和参数结构，prompt & 知识库 里需要构建
  };

  adviseFlow = () => {
    // todo: 定向到流向图的集合
  };
}
