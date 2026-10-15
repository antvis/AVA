import { tool } from 'ai';
import { z } from 'zod';
import type { AnalysisResponse, AVA } from '@antv/ava/browser';
import type { AIDataset } from './types';

export function createTools({ ava, dataset }: { ava: AVA; dataset: AIDataset }) {
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
        query: z.string().trim().min(1).max(8_000),
      }),
      execute: ({ query }) => ava.analyze(query),
    }),

    visualize: tool({
      description:
        'Create or update a chart. Pass data directly when the user has supplied chart-ready records; otherwise omit data to reuse the latest analysis. Explicit data takes precedence. Never invent data; call analyze first when calculations or transformations are needed.',
      inputSchema: z.object({
        instructions: z.string().max(4_000),
        data: z.array(z.record(z.unknown())).optional(),
      }),
      contextSchema: z.object({ latest: z.custom<AnalysisResponse>().optional() }),
      execute: async ({ instructions, data }, { context }) => {
        const { latest } = context;
        const result: Pick<AnalysisResponse, 'query' | 'data' | 'sql'> | undefined =
          data !== undefined ? { query: instructions, data } : latest;

        if (!result) throw new Error('Provide data or call analyze before visualize.');

        const chart = await ava.visualize({
          query: data !== undefined ? instructions : `${result.query}\nChart instructions: ${instructions}`,
          data: result.data,
        });

        if (!chart) throw new Error('No suitable chart could be generated.');

        return { result, ...chart };
      },
      toModelOutput: ({ output }) => ({
        type: 'text',
        value: JSON.stringify({ rendered: true, chartType: output.chartType }),
      }),
    }),

    suggest: tool({
      description: 'Suggest three useful analysis questions about the current dataset.',
      inputSchema: z.object({}),
      execute: () => ava.suggest(3),
    }),
  };
}
