/* eslint-disable no-dupe-class-members */
import { AdviseStageOutput, AVAConfig, AVAContext, DataShard, Spec } from '../types';
import { extract } from '../extract';
import { logError, logInDev } from '../utils';
import { getRenderer } from '../bind';
import { adviseCharts } from '../advise';
import { isEmpty, isObject } from 'lodash';

/**
 * The 1st level ava class.
 * Used to extract data, recommend charts, and render charts. All functionalities are AI-driven.
 */
export class AVA {
  /**
   * Configuration for the ava. Includes LLM settings, chart inclusion/exclusion lists.
   */
  private config!: AVAContext;

  /**
   * Whether the data shards have been extracted.
   */
  private extracted: boolean = false;

  constructor(config: AVAConfig) {
    this.config = { ...config, input: '' };
  }

  /**
   * Extract data shards from raw data or user query.
   *
   * Case 1 - User provides a text query, extract relevant data shards:
   *
      ava.extract('What is the average age of people who work as engineers?');
   *
   * Case 2 - User provides a query with raw data:
   *
      ava.extract(`帮我可视化以下数据：
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
      ava.extract({ type: 'A', value: 2 });
   */
  async extract(input: string = '') {
    try {
      this.config = {
        ...this.config,
        input,
      };
      const dataShards = await extract(input, { llmConfig: this.config.llm });
      logInDev.debug('LLM extract dataShards', dataShards);
      this.extracted = true;
      return dataShards || [];
    } catch (e) {
      this.extracted = false;
      logError('LLM extract failed');
      return [];
    }
  }

  /**
   * Advise charts based on the data shards, which are extracted from the `ava.extract` API.
   * This is the core function of the AVA class, which leverages LLMs to recommend suitable chart types and encodings based on the provided data and user purpose.
   *
   * const advises = ava.advise(dataShards);
   */
  async advise(query: DataShard[] | string): Promise<AdviseStageOutput> {
    let finalQuery = query;
    if (this.extracted) {
      // If data extraction was performed but resulted in an empty array of shards, fall back to the original input for recommendations
      finalQuery = isEmpty(query) ? this.config.input : query;
    } else {
      // If no data extraction was performed, use the original input for recommendations
      finalQuery = isObject(query) ? JSON.stringify(query) : query;
    }
    return adviseCharts(finalQuery, this.config);
  }

  /**
   * Render the chart recommendation spec into a chart dom. We can use different renderers by customizing the renderer.
   *
   * Case 1 - Using default renderer (AVA built-in):
   *
      ava.render({
        container: '#chart',
        spec: chartSpec,
      });
   *
   * Case 2 - Using custom renderer:
   *
      const customRenderer: Renderer = (container, spec) => { ... };
      bindRenderer(customRenderer);
      ava.render({
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
