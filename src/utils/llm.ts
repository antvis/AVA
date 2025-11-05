import axios from 'axios';
import { get } from 'lodash';
import OpenAI from 'openai';

import { logError, sleep } from './common';

import type { OpenAiLLM, TboxLLM } from '../types';

const DEFAULT_MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT = 60000;
const DEFAULT_DELAY = 500;

/**
 * @desc Tbox LLM 非流式请求接口
 */
export const requestTboxLLM = async (params: { config: TboxLLM; prompt: string }): Promise<string> => {
  const { config, prompt } = params;
  const { appId, authorization, maxRetryCount = DEFAULT_MAX_RETRY_COUNT, timeout = DEFAULT_TIMEOUT } = config;
  let attempt = 0;
  const delay = DEFAULT_DELAY;
  const data = JSON.stringify({
    appId,
    userId: '1',
    stream: false,
    inputs: {
      input: prompt,
    },
  });

  while (attempt <= maxRetryCount) {
    try {
      const res = await axios.request({
        method: 'POST',
        maxBodyLength: Infinity,
        timeout,
        url: 'https://api.tbox.cn/api/completion',
        headers: {
          Authorization: authorization,
          'Content-Type': 'text/json',
          Accept: 'text/event-stream',
        },
        data,
      });
      return get(res, 'data.data.result[0].chunk', '');
    } catch (e) {
      logError(`请求tbox API失败，重试次数: ${attempt}, ${e}`);
      if (attempt >= maxRetryCount) {
        return '';
      }
      attempt += 1;
      await sleep(delay);
    }
  }
  return '';
};

/**
 * @desc OpenAI LLM 非流式请求接口
 */
export const requestOpenAiLLM = async (params: { config: OpenAiLLM; prompt: string }): Promise<string> => {
  const { config, prompt } = params;
  const { url, model, apiKey, maxRetryCount = DEFAULT_MAX_RETRY_COUNT, timeout = DEFAULT_TIMEOUT, maxTokens } = config;

  // TODO: 考虑dangerouslyAllowBrowser如何处理
  const client = new OpenAI({ apiKey, baseURL: url, dangerouslyAllowBrowser: true });

  let attempt = 0;
  const delay = DEFAULT_DELAY;

  const shouldRetry = (err: any): boolean => {
    const status: number | undefined = err?.status ?? err?.response?.status;
    if (status === undefined) return true; // network error
    if (status === 429) return true; // rate limited
    return status >= 500 && status < 600; // server errors
  };

  while (attempt <= maxRetryCount) {
    try {
      const requestPromise = client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        ...(maxTokens ? { max_tokens: maxTokens } : {}),
      });

      const result = await Promise.race([
        requestPromise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('OpenAI request timeout')), timeout)),
      ]);

      const content = get(result, 'choices[0].message.content', '');
      return content || '';
    } catch (e) {
      logError(`请求 OpenAI API 失败，重试次数: ${attempt}, ${e}`);
      if (!shouldRetry(e) || attempt >= maxRetryCount) {
        return '';
      }

      attempt += 1;
      await sleep(delay);
    }
  }
  return '';
};

export const isOpenAi = (l: OpenAiLLM | TboxLLM | undefined): l is OpenAiLLM =>
  !!l && 'apiKey' in l && 'model' in l && 'url' in l;

export const isTbox = (l: OpenAiLLM | TboxLLM | undefined): l is TboxLLM => !!l && 'appId' in l && 'authorization' in l;

export const requestLLM = async (params: { config: OpenAiLLM | TboxLLM; prompt: string }): Promise<string> => {
  const { config, prompt } = params;
  if (isOpenAi(params.config)) {
    return requestOpenAiLLM({ config: config as OpenAiLLM, prompt });
  }
  return requestTboxLLM({ config: config as TboxLLM, prompt });
};
