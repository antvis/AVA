import { logError } from '../utils';
import {
  AdviseChartParams,
  AdviseStageOutput,
  AdviseText,
  AdviseTextParams,
  AdvisorConfig,
  BasePipeline,
} from '../types';
import { extractData } from '../data';
import { AdviseChartPipeline } from './advise-chart-pipeline/pipeline';
import { RENDERER, type Spec } from '../bind';

/**
 * The 1st level advisor class.
 * Used to extract data, recommend charts, and render charts. All functionalities are AI-driven.
 */
export class Advisor {

  /**
   * Configuration for the advisor. Includes LLM settings, chart inclusion/exclusion lists.
   */
  private config!: AdvisorConfig;

  adviseChartPipeline: BasePipeline<AdviseChartParams>;

  constructor(config: AdvisorConfig = {}) {
    this.config = config;

    // Initialize pipelines.
    this.adviseChartPipeline = new AdviseChartPipeline({
      config,
    });
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
   * Case 2 - User provides raw data, extract data shards directly:
   * 
      advisor.extract({ type: 'A', value: 2 });
   */
  async extract(params: AdviseChartParams) {
    const { purpose, data } = params;
    const input = purpose ?? data;
    const dataShards = await extractData(input, { llmConfig: this.config.llm });
    return dataShards;
  }

  /**
   * Advise charts based on the data shards, which are extracted from the `advisor.extract` API.
   * This is the core function of the Advisor class, which leverages LLMs to recommend suitable chart types and encodings based on the provided data and user purpose.
   * 
   * const advises = advisor.advise(dataShards);
   */
  advise(params: AdviseChartParams): Promise<AdviseStageOutput>;
  advise(params: AdviseTextParams): Promise<AdviseText>;
  async advise(params: AdviseChartParams | AdviseTextParams): Promise<AdviseStageOutput | AdviseText> {
    const result = await this.adviseChartPipeline.execute(params as AdviseChartParams);
    return result;
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
  render(params: { container: string; spec: Spec }) {
    if (RENDERER) {
      const { container, spec } = params;
      return RENDERER(container, spec);
    }
    logError('Chart render not configured, please bind a renderer first, GPT-Vis is recommended.');
    return null;
  }
}
