import { z } from 'zod';
import { zodToJsonSchema } from '../utils/validator';
import { FishboneNodeSchema } from './fishbone-diagram';

const schema = {
  data: FishboneNodeSchema.describe(
    "Data for the indented tree, representing a hierarchical structure. It should be an object with a 'name' and an optional 'children' array."
  ),
  theme: z.enum(['default', 'academy']).optional().default('default').describe('Theme for the chart.'),
};

export const indentedTree = {
  name: 'indented-tree',
  description:
    "An indented tree is a visualization method used to represent hierarchical data in a compact, easy-to-read format. It displays a tree-like structure where parent-child relationships are shown through indentation. Each child node is indented under its parent, clearly illustrating the data's nested structure and depth. This layout is highly intuitive for exploring hierarchies, such as file systems, organizational charts, or threaded conversations. It allows users to quickly understand the relationships between different levels of data.",
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
