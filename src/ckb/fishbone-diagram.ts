import { z } from 'zod';
import { zodToJsonSchema, type TreeDataType, validatedTreeDataSchema } from '../utils/validator';
import { HeightSchema, TextureSchema, ThemeSchema, WidthSchema } from './base';

// Fishbone node schema
// The recursive schema is not supported by gemini, and other clients, so we use a non-recursive schema which can represent a tree structure with a fixed depth.
// Ref: https://github.com/antvis/mcp-server-chart/issues/155
// Ref: https://github.com/antvis/mcp-server-chart/issues/132
// @ts-ignore
export const FishboneNodeSchema: z.ZodType<TreeDataType> = z.object({
  name: z.string(),
  children: z
    .array(
      z.object({
        name: z.string(),
        children: z
          .array(
            z.object({
              name: z.string(),
              children: z
                .array(
                  z.object({
                    name: z.string(),
                  })
                )
                .optional(),
            })
          )
          .optional(),
      })
    )
    .optional(),
});

// Fishbone diagram input schema
const schema = {
  data: FishboneNodeSchema.describe(
    "Data for fishbone diagram chart which is a hierarchical structure, such as, { name: 'main topic', children: [{ name: 'topic 1', children: [{ name: 'subtopic 1-1' }] }] }, and the maximum depth is 3."
  ).refine(validatedTreeDataSchema, {
    message: 'Invalid parameters: node name is not unique.',
    path: ['data'],
  }),
  style: z
    .object({
      texture: TextureSchema,
    })
    .optional()
    .describe('Style configuration for the chart with a JSON object, optional.'),
  theme: ThemeSchema,
  width: WidthSchema,
  height: HeightSchema,
};

export const fishboneDiagram = {
  name: 'fishbone-diagram',
  description:
    'A fishbone diagram is a chart that uses a core problem as the fish head and analyzes and displays the causes or results of the problem in the form of fishbone branches. It utilizes the structure of a fishbone to break down the problem into multiple categories and further subdivides specific causes or results under each category, thereby clearly presenting a complete picture of the problem. It uses nodes as units and delves deeper level by level to classify problems, causes, or results. When a problem is complex and involves multiple aspects, a fishbone diagram can help sort out and structure key information, clarifying the causal relationship between the main problem and its underlying factors.',
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
