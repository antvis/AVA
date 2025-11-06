import { requestLLM } from '../../utils';
import { getExtractPrompt } from '../../prompt';
import type { AdvisorConfig } from '../../types';

export const extract = async (input: string, config: AdvisorConfig['llm']) => {
  try {
    const res = await requestLLM({
      config,
      prompt: getExtractPrompt(input),
    });
    return JSON.parse(res);
  } catch (e) {
    return [];
  }
};
