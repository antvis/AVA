import { Renderer, UiConfig } from './render';
import { FieldDataType, Meta } from './data';

/**
 * Common LLM configuration properties
 */
type BaseLLMConfig = {
  /** LLM request max retry count */
  maxRetryCount?: number;
  /** LLM request timeout */
  timeout?: number;
  /** Max token in LLM Chart */
  maxTokens?: number;
};

export type OpenAiLLM = BaseLLMConfig & {
  /** LLM service url */
  url: string;
  /** model name */
  model: string;
  /** LLM service apiKey */
  apiKey: string;
};

/**
 * Ant group tbox LLM config, https://www.tbox.cn/
 */
export type TboxLLM = BaseLLMConfig & {
  /** tbox AI agent id */
  appId: string;
  /** tbox AI agent authorization key */
  authorization: string;
};

export interface AdvisorConfig {
  llm?: OpenAiLLM | TboxLLM;
  /** Allowed charts for recommendation */
  includes?: string[];
  /** Excluded charts from recommendation */
  excludes?: string[];
  /** Custom renderer for this advisor instance */
  renderer?: Renderer;
}

export interface AdviseChartParams {
  /** raw data */
  data: FieldDataType;
  /** field Metadata */
  metas?: Meta[];
  /** the user's visualization purpose, such as viewing data trends */
  purpose?: string;
  /** avoid using LLM */
  disableModel?: boolean;
  /** Allowed charts for recommendation */
  includes?: string[];
  /** Excluded charts from recommendation */
  excludes?: string[];
  /** If true: outputs recommendation explanation (slower), If false: no explanation output (faster). */
  outputExplanation?: boolean;
  /** force chart type, such as 'line', 'bar', 'pie' */
  forceType?: string;
  uiConfig?: UiConfig;
}

export interface AdviseChart {
  /** chart type */
  type: string;
  /** encode represents the mapping between visual channels and data fields. */
  encode: {
    [property: string]: string[];
  };
  /** chart recommendation score, Only outputs when outputExplanation is true */
  score?: number;
  /** reason for chart recommendation score, Only outputs when outputExplanation is true */
  explanation?: string;
}

export interface AdviseTextParams {
  /** text content to analyze */
  text?: string;
  /** analysis purpose */
  purpose?: string;
}

export interface AdviseText {
  /** text content */
  content?: string;
  /** text type */
  type?: string;
}
