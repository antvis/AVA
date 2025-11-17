import { z } from 'zod';
import { zodToJsonSchema, validatedNodeEdgeDataSchema } from '../utils/validator';
import { EdgeSchema, HeightSchema, NodeSchema, TextureSchema, ThemeSchema, WidthSchema } from './base';

// Flow diagram input schema
const schema = {
  data: z
    .object({
      nodes: z.array(NodeSchema).nonempty({ message: 'At least one node is required.' }),
      edges: z.array(EdgeSchema),
    })
    .describe(
      "Data for flow diagram chart, such as, { nodes: [{ name: 'node1' }, { name: 'node2' }], edges: [{ source: 'node1', target: 'node2', name: 'edge1' }] }."
    )
    // @ts-ignore
    .refine(validatedNodeEdgeDataSchema, {
      message: 'Invalid parameters',
      path: ['data', 'edges'],
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

export const flowDiagram = {
  name: 'flow-diagram',
  description:
    'A flowchart is used to intuitively represent the steps and decision points of a process or system. It shows the entire process from start to finish. Each node represents a specific step or decision point, and the edges represent the sequence and relationship between the steps. Edges only need to be named when there is a branching meaning. Applicable scenarios: 1. Suitable for scenarios that need to display linear processes or steps; 2. Planning and tracking project progress, clarifying the sequence and dependencies of tasks; 3. Building decision trees to show different decision points and path scenarios.',
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
