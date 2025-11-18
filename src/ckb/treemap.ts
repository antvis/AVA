import { z } from 'zod';
import { zodToJsonSchema } from '../utils/validator';
import {
  BackgroundColorSchema,
  HeightSchema,
  PaletteSchema,
  TextureSchema,
  ThemeSchema,
  TitleSchema,
  WidthSchema,
} from './base';

// Define recursive schema for hierarchical data.
// The recursive schema is not supported by gemini, and other clients, so we use a non-recursive schema which can represent a tree structure with a fixed depth.
// Ref: https://github.com/antvis/mcp-server-chart/issues/155
// Ref: https://github.com/antvis/mcp-server-chart/issues/132
const TreeNodeSchema = z.object({
  name: z.string(),
  value: z.number(),
  children: z
    .array(
      z.object({
        name: z.string(),
        value: z.number(),
        children: z
          .array(
            z.object({
              name: z.string(),
              value: z.number(),
            })
          )
          .optional(),
      })
    )
    .optional(),
});

// Treemap chart input schema
const schema = {
  data: z
    .array(TreeNodeSchema)
    .describe(
      "Data for treemap chart which is a hierarchical structure, such as, [{ name: 'Design', value: 70, children: [{ name: 'Tech', value: 20 }] }], and the maximum depth is 3."
    )
    .nonempty({ message: 'Treemap chart data cannot be empty.' }),
  style: z
    .object({
      backgroundColor: BackgroundColorSchema,
      palette: PaletteSchema,
      texture: TextureSchema,
    })
    .optional()
    .describe('Style configuration for the chart with a JSON object, optional.'),
  theme: ThemeSchema,
  width: WidthSchema,
  height: HeightSchema,
  title: TitleSchema,
};

export const treemap = {
  name: 'treemap',
  description:
    'A treemap is a visualization chart used to display hierarchical data, representing tree-structured data through a series of nested rectangles. The area of each rectangle is proportional to its corresponding value, and color is often used to distinguish different categories or levels. A treemap transforms a tree data structure into a planar space filled with rectangles, intuitively displaying the hierarchical relationships and numerical proportions of the data. Treemaps are particularly suitable for displaying large amounts of data with hierarchical relationships, such as file systems, organizational structures, budget allocations, and stock markets. Compared to traditional tree structure diagrams, treemaps can use space more effectively and have the function of showing proportions, allowing users to quickly understand the distribution and importance of the data.',
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
