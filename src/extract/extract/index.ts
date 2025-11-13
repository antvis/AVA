import { requestLLM } from '../../utils';
import { getExtractPrompt } from '../../prompt';
import type { AdvisorConfig } from '../../types';

export const extractText = async (input: string, config: AdvisorConfig['llm']) => {
  try {
    const res = await requestLLM({
      config,
      prompt: getExtractPrompt(input),
    });
    // TODO: @思莫 需要从 prompt 层约束模型返回
    const jsonStr = res.replace(/```json|```|```JSON/g, '');
    return JSON.parse(jsonStr);
  } catch (e) {
    return [];
  }
};
