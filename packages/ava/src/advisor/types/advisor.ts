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

type OpenAiLLM = BaseLLMConfig & {
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
type TboxLLM = BaseLLMConfig & {
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
}

export interface AdviseChartParams {
  /** raw data */
  data: Array<Record<string, string | number>>;
  /** field Metadata */
  metas?: Array<{
    /** field id */
    id: string;
    /** field name */
    name: string;
    /** field data type */
    dataType: string;
  }>;
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
}

export interface AdviseChart {
  /** chart type */
  chartType: string;
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
