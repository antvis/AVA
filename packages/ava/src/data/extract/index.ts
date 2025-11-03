import { requestTboxLLM } from '@ava/utils/llm';

import { getExtractPrompt } from './prompt';

import type { TboxLLM } from '@ava/types';

export const extract = async (input: string, config: TboxLLM) => {
  try {
    const res = await requestTboxLLM({
      config,
      prompt: getExtractPrompt(input),
    });
    return JSON.parse(res);
  } catch (e) {
    return [];
  }
};
