import type { LanguageModel } from 'ai';
import type { EngineConfig } from './engines';

/**
 * LLM configuration
 */
export interface LLMConfig {
  /** Defaults to OpenAI-compatible Chat Completions. Gateway reads AI_GATEWAY_API_KEY. */
  provider?: 'openai' | 'gateway';
  /** Model name or a preconfigured AI SDK model instance. */
  model: string | LanguageModel;
  /** API key for the LLM provider */
  apiKey?: string;
  /** Optional API base URL */
  baseURL?: string;
  /** Maximum retries for retryable model API failures. Default 3. */
  maxRetries?: number;
}

/**
 * AVA configuration
 */
export interface AVAConfig {
  /** LLM configuration */
  llm: LLMConfig;
  /** Engine selection and options (defaults to the DuckDB engine when omitted) */
  engine?: EngineConfig;
}
