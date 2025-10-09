import { logError, logInDev, requestTboxLLM, requestOpenAiLLM, isOpenAi, isTbox } from '@ava/utils';
import {
  AdviseChartParams,
  AdviseChartPluginInput,
  AdvisorPlugin,
  ChartConfig,
  FinalChartConfig,
  IAdviseChartPipeline,
} from '@ava/types';
import {
  generateAllChartConfigs,
  getChartConfigScoringPrompt,
  optimizeChartConfig,
  sortChartConfigs,
  transformChartEncode,
} from '@ava/advisor/chartAdvise';
import { AdviseChartPluginEnum } from '@ava/constants/pipeline';

export class AdvisePlugin implements AdvisorPlugin<AdviseChartParams> {
  name = AdviseChartPluginEnum.AdvisePlugin;

  apply = (pipeline: IAdviseChartPipeline) => {
    pipeline.stages.advise.tapPromise(this.name, this.execute);
  };

  execute = async (input: AdviseChartPluginInput) => {
    const { dataStore, context } = input;
    const { excludes, includes, disableModel, forceType, purpose = '', llm } = context;
    const { metas, data } = dataStore.data;
    let allChartConfigs: ChartConfig[] = [];
    // create all valid chart configs using field data
    allChartConfigs = generateAllChartConfigs(metas, excludes, includes);
    logInDev.debug('All possible chart configs', JSON.stringify(allChartConfigs));

    // Use LLM to score all chart configs based on user purpose/data/metas
    let llmCompleted = false;
    let llmCostTime = '';
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
            llmCostTime = ((endTime - startTime) / 1000).toFixed(2);
            llmCompleted = true;
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
        chartConfigs: finalRes,
        metas,
        data,
        llmCostTime,
        llmCompleted,
      };

      dataStore.advise = result;
    } else {
      // user specified chart type
      const finalRes: FinalChartConfig[] = allChartConfigs
        .filter((item) => item.type === forceType)
        .map((item) => ({
          type: item.type,
          encode: transformChartEncode(item.encode),
        }));

      const result = {
        chartConfigs: finalRes,
        metas,
        data,
        llmCostTime,
        llmCompleted,
      };
      dataStore.advise = result;
    }
  };
}
