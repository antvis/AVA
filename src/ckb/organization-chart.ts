import { z } from 'zod';
import { zodToJsonSchema } from '../utils/validator';
import { HeightSchema, TextureSchema, ThemeSchema, WidthSchema } from './base';

// The recursive schema is not supported by gemini, and other clients, so we use a non-recursive schema which can represent a tree structure with a fixed depth.
// Ref: https://github.com/antvis/mcp-server-chart/issues/155
// Ref: https://github.com/antvis/mcp-server-chart/issues/132
const OrganizationChartNodeSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  children: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        children: z
          .array(
            z.object({
              name: z.string(),
              description: z.string().optional(),
              children: z
                .array(
                  z.object({
                    name: z.string(),
                    description: z.string().optional(),
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

const schema = {
  data: OrganizationChartNodeSchema.describe(
    "Data for organization chart which is a hierarchical structure, such as, { name: 'CEO', description: 'Chief Executive Officer', children: [{ name: 'CTO', description: 'Chief Technology Officer', children: [{ name: 'Dev Manager', description: 'Development Manager' }] }] }, and the maximum depth is 3."
  ),
  orient: z
    .enum(['horizontal', 'vertical'])
    .default('vertical')
    .describe(
      'Orientation of the organization chart, either horizontal or vertical. Default is vertical, when the level of the chart is more than 3, it is recommended to use horizontal orientation.'
    ),
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

export const organizationChart = {
  name: 'organization-chart',
  description:
    'An organization chart is used to intuitively display the hierarchical structure and departmental relationships within an organization. It uses nodes and edges to represent different positions, departments, and their hierarchical relationships. Each node represents a position or department, and the edges represent superior-subordinate or peer relationships. It is presented in a tree structure, with the top level being the highest management, expanding downwards layer by layer to various departments and positions. Applicable scenarios: 1. To display the hierarchical structure of a company or team, clarifying the superior-subordinate relationships of various positions and departments; 2. To show the distribution of employee positions and departments; 3. In project management, to clarify the members and division of responsibilities of the project team; 4. For dependency analysis such as equity penetration and investment in upstream and downstream companies.',
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
