import { DirectChatTransport, generateId, isStepCount, ToolLoopAgent } from 'ai';
import type { InferAgentUIMessage, ModelMessage } from 'ai';
import { AVA } from '@antv/ava/browser';
import type { AnalysisResponse, LLMConfig } from '@antv/ava/browser';
import { CHAT_SYSTEM_PROMPT, MAX_MODEL_RETRIES, MAX_CHAT_STEPS, SUGGESTION_COUNT } from '../constants';
import type { PlaygroundDataset } from './types';
import { createModel } from './model';
import { createTools } from './tools';
import { uniqueStrings } from '../../lib/strings';

function getCompletedToolsSinceLastSource(messages: readonly ModelMessage[]): Set<string> {
  const completed = new Set<string>();
  for (const message of messages) {
    if (message.role !== 'tool') continue;
    for (const part of message.content) {
      if (part.type !== 'tool-result') continue;
      if (part.toolName === 'source') completed.clear();
      completed.delete(part.toolName);
      if (part.output.type !== 'error-text' && part.output.type !== 'error-json') completed.add(part.toolName);
    }
  }
  return completed;
}

type AvaFactory = (config: LLMConfig) => AVA;

export function createPlaygroundSession(
  config: LLMConfig,
  dataset: PlaygroundDataset,
  createAva: AvaFactory = (llm) => new AVA({ llm, engine: { type: 'javascript' } })
) {
  const model = createModel(config);
  const ava = createAva({ ...config, model, maxRetries: MAX_MODEL_RETRIES });
  const tools = createTools({ ava, dataset });
  // Keep the latest analysis available to tools across turns.
  let toolsContext: { visualize: { latest?: AnalysisResponse } } = { visualize: {} };

  const agent = new ToolLoopAgent({
    model,
    tools,
    toolsContext,
    instructions: `${CHAT_SYSTEM_PROMPT} Dataset: ${dataset.name}.`,
    maxRetries: MAX_MODEL_RETRIES,
    stopWhen: isStepCount(MAX_CHAT_STEPS),
    providerOptions: { openai: { parallelToolCalls: false } },
    onStepEnd: ({ toolCalls, toolResults }) => {
      for (const call of toolCalls) {
        if (call.toolName === 'source') toolsContext = { visualize: {} };
        if (call.toolName === 'analyze') {
          const result = toolResults.find((result) => result.toolCallId === call.toolCallId);
          toolsContext = {
            visualize: { latest: result?.toolName === 'analyze' && !result.dynamic ? result.output : undefined },
          };
        }
      }
    },
    prepareStep: ({ messages, initialMessages, steps, responseMessages }) => {
      const completed = getCompletedToolsSinceLastSource(messages);
      const prerequisites = ['source', 'schema', 'profile'] as const;
      const prerequisiteFailed = responseMessages.some(
        (message) =>
          message.role === 'tool' &&
          message.content.some(
            (part) =>
              part.type === 'tool-result' &&
              prerequisites.some((name) => name === part.toolName) &&
              (part.output.type === 'error-text' || part.output.type === 'error-json')
          )
      );
      if (prerequisiteFailed) return { toolsContext, toolChoice: 'none' };
      const required = prerequisites.find((name) => !completed.has(name));
      if (required) return { toolsContext, toolChoice: { type: 'tool', toolName: required }, activeTools: [required] };

      const activeTools = (Object.keys(tools) as (keyof typeof tools)[]).filter(
        (name) => name !== 'visualize' || completed.has('analyze')
      );
      const last = initialMessages[initialMessages.length - 1];
      const content =
        typeof last?.content === 'string'
          ? last.content
          : last?.content
              .filter((part) => part.type === 'text')
              .map((part) => part.text)
              .join(' ') ?? '';
      const token = content.trim().split(/\s/)[0];
      const command = activeTools.find((name) => token === `/${name}`);
      const commandSent = steps.some((step) => step.toolCalls.some((call) => call.toolName === command));
      return {
        toolsContext,
        activeTools,
        toolChoice: command && !commandSent ? { type: 'tool', toolName: command } : 'auto',
      };
    },
  });

  async function suggest() {
    if (!ava.engine) {
      await ava.source({ type: 'json', options: { data: dataset.rows } });
    }
    const result = await ava.suggest(SUGGESTION_COUNT);
    const questions = uniqueStrings(result.map((item) => item?.query)).slice(0, SUGGESTION_COUNT);
    if (!questions.length) throw new Error('No suggested questions were returned. Please try again.');
    return questions;
  }

  return {
    id: generateId(),
    agent,
    transport: new DirectChatTransport({
      agent,
      onError: (error) => (error instanceof Error ? error.message : String(error)),
    }),
    suggest,
    dispose: () => ava.dispose(),
  };
}

export type PlaygroundUIMessage = InferAgentUIMessage<ReturnType<typeof createPlaygroundSession>['agent']>;
