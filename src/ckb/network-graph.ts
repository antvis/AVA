import { z } from 'zod';
import { zodToJsonSchema, validatedNodeEdgeDataSchema } from '../utils/validator';
import { EdgeSchema, HeightSchema, NodeSchema, TextureSchema, ThemeSchema, WidthSchema } from './base';

// Network graph input schema
const schema = {
  data: z
    .object({
      nodes: z.array(NodeSchema).nonempty({ message: 'At least one node is required.' }),
      edges: z.array(EdgeSchema),
    })
    .describe(
      "Data for network graph chart, such as, { nodes: [{ name: 'node1' }, { name: 'node2' }], edges: [{ source: 'node1', target: 'node2', name: 'edge1' }] }"
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

export const networkGraph = {
  name: 'network-graph',
  description:
    "A network graph is a graph that shows the relationships (edges) between entities (nodes). Through the connection of nodes and edges, it intuitively represents a complex network structure. Each node represents an entity, and each edge represents the relationship or connection between two nodes. The key to a network graph is to show 'who is connected to whom'. For example, a node can represent a person, and a line can represent whether two people know each other.",
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
