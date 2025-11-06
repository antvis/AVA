import { requestTboxLLM } from '../../../src/utils/llm';
import { getExtractPrompt } from '../../../src/extract/extract/prompt';

export const extract = async (value: string) => {
  const llmAuth = process.env.LLM_AUTH;
  const llmAppId = process.env.LLM_APP_ID;
  // @ts-ignore for debug at ci
  console.debug(process.env);
  if (process.env?.NODE_ENV === 'test' && llmAuth && llmAppId) {
    const query = getExtractPrompt(value);
    const result = await requestTboxLLM({
      config: {
        authorization: llmAuth,
        appId: llmAppId,
      },
      prompt: query,
    });
    return JSON.parse(result);
  }
  return {};
};
