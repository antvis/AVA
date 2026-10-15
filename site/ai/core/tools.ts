import { MAX_QUESTION_LENGTH, MAX_CHART_INSTRUCTIONS_LENGTH, SUGGESTION_COUNT } from '../constants';
import { tool } from 'ai';
import { z } from 'zod';
import type { AnalysisResponse, AVA } from '@antv/ava/browser';
import type { PlaygroundDataset } from './types';

export function createTools({ ava, dataset }: { ava: AVA; dataset: PlaygroundDataset }) {
  return {
    source: tool({
      description: 'Load the user-selected dataset into AVA. This resets previous query results.',
      inputSchema: z.object({}),
      execute: async () => {
        await ava.source({ type: 'json', options: { data: dataset.rows } });
        return { name: dataset.name, rows: dataset.rows.length, engine: 'javascript' };
      },
    }),

    schema: tool({
      description: 'Inspect field names and types of the loaded dataset.',
      inputSchema: z.object({}),
      execute: () => ava.schema(),
    }),

    profile: tool({
      description: 'Inspect column statistics, distributions and missing values.',
      inputSchema: z.object({}),
      execute: () => ava.profile(),
    }),

    analyze: tool({
      description:
        'Analyze data with AVA using a complete natural-language query. Include filters, requested metrics and relevant follow-up context. AVA generates and executes the code and returns actual results.',
      inputSchema: z.object({
        query: z.string().trim().min(1).max(MAX_QUESTION_LENGTH),
      }),
      execute: ({ query }) => ava.analyze(query, { includeSummary: false }),
    }),

    visualize: tool({
      description:
        'Create or update a chart from the last executed query. Requires a successful analyze call; reuses the result when changing only chart style.',
      inputSchema: z.object({ instructions: z.string().max(MAX_CHART_INSTRUCTIONS_LENGTH) }),
      contextSchema: z.object({ latest: z.custom<AnalysisResponse>().optional() }),
      execute: async ({ instructions }, { context }) => {
        const { latest } = context;
        if (!latest) throw new Error('Execute analyze before visualize.');
        const chart = await ava.visualize({
          query: `${latest.query}\nChart instructions: ${instructions}`,
          data: latest.data,
        });
        if (!chart) throw new Error('No suitable chart could be generated.');
        return { result: latest, ...chart };
      },
      toModelOutput: ({ output }) => ({
        type: 'text',
        value: JSON.stringify({ rendered: true, chartType: output.chartType }),
      }),
    }),

    suggest: tool({
      description: 'Suggest three useful analysis questions about the current dataset.',
      inputSchema: z.object({}),
      execute: () => ava.suggest(SUGGESTION_COUNT),
    }),
  };
}
