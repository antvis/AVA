/* eslint-disable no-dupe-class-members */
import { AdviseChartParams, AdviseStageOutput, AdvisorConfig, DataShard } from '../types';
import { extractData } from '../extract';
import { logError } from '../utils';
import { getRenderer, type Spec } from '../bind';
import { adviseCharts } from '../advise';

/**
 * The 1st level advisor class.
 * Used to extract data, recommend charts, and render charts. All functionalities are AI-driven.
 */
export class Advisor {
  /**
   * Configuration for the advisor. Includes LLM settings, chart inclusion/exclusion lists.
   */
  private config!: AdvisorConfig;

  constructor(config: AdvisorConfig = {}) {
    this.config = config;
  }

  /**
   * Extract data shards from raw data or user query.
   *
   * Case 1 - User provides a text query, extract relevant data shards:
   *
      advisor.extract('What is the average age of people who work as engineers?');
   *
   * Case 2 - User provides a query with raw data:
   *
      advisor.extract(`帮我可视化以下数据：
        城市 类别 渠道 销售额 价格
        杭州 体育 A  100  80
        北京 体育 A  200  90
        上海 体育 B  150  85
        广州 体育 B  120  70
        深圳 体育 C  180  95
      `);
   *
   * Case 3 - User provides raw data, extract data shards directly:
   *
      advisor.extract({ type: 'A', value: 2 });
   */
  async extract(params: AdviseChartParams) {
    try {
      const { purpose, data } = params;
      const input = `${purpose}\n${JSON.stringify(data)}`;
      const dataShards = await extractData(input, { llmConfig: this.config.llm });
      return dataShards;
    } catch (e) {
      logError('LLM extract failed');
      return [];
    }
  }

  /**
   * Advise charts based on the data shards, which are extracted from the `advisor.extract` API.
   * This is the core function of the Advisor class, which leverages LLMs to recommend suitable chart types and encodings based on the provided data and user purpose.
   *
   * const advises = advisor.advise(dataShards);
   */
  async advise(dataShard: DataShard[]): Promise<AdviseStageOutput> {
    return adviseCharts(dataShard, this.config);
  }

  /**
   * Render the chart recommendation spec into a chart dom. We can use different renderers by customizing the renderer.
   *
   * Case 1 - Using default renderer (AVA built-in):
   *
      advisor.render({
        container: '#chart',
        spec: chartSpec,
      });
   *
   * Case 2 - Using custom renderer:
   *
      const customRenderer: Renderer = (container, spec) => { ... };
      bindRenderer(customRenderer);
      advisor.render({
        container: '#chart',
        spec: chartSpec,
      });
   *
   */
  render(container: string, spec: Spec) {
    const renderer = getRenderer();
    if (renderer) {
      return renderer(container, spec);
    }
    logError('Chart render not configured, please bind a renderer first, GPT-Vis is recommended.');
    return null;
  }
}
