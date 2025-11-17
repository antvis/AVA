import { z } from 'zod';
import { zodToJsonSchema, validatedTreeDataSchema } from '../utils/validator';
import { HeightSchema, TextureSchema, ThemeSchema, WidthSchema } from './base';
import { FishboneNodeSchema } from './fishbone-diagram';

// Mind map node schema
// The recursive schema is not supported by gemini, and other clients, so we use a non-recursive schema which can represent a tree structure with a fixed depth.
// Ref: https://github.com/antvis/mcp-server-chart/issues/155
// Ref: https://github.com/antvis/mcp-server-chart/issues/132
const MindMapNodeSchema = FishboneNodeSchema;

// Mind map chart input schema
const schema = {
  data: MindMapNodeSchema.describe(
    "Data for mind map chart which is a hierarchical structure, such as, { name: 'main topic', children: [{ name: 'topic 1', children: [{ name:'subtopic 1-1' }] }, and the maximum depth is 3."
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

export const mindMap = {
  name: 'mind-map',
  description:
    'A mind map is a diagram used to organize and display information in the form of hierarchical branches with a central theme at its core. It is distributed on both sides of a central point, making reasonable use of space and clearly presenting the hierarchical relationship between the main trunk and its branches. It expands layer by layer, using nodes as units to classify concepts, tasks, or ideas. When the text content is complex, a mind map can help extract and structure key information, clarifying the relationship between the main topic and sub-topics.',
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
