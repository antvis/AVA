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

const data = z.object({
  label: z.string().optional().describe("Label for the venn chart segment, such as 'A', 'B', or 'C'."),
  value: z.number().describe('Value for the venn chart segment, such as 10, 20, or 30.'),
  sets: z
    .array(z.string())
    .describe(
      "Array of set names that this segment belongs to, such as ['A', 'B'] for an intersection between sets A and B."
    ),
});

const schema = {
  data: z
    .array(data)
    .describe(
      "Data for venn chart, such as, [{ label: 'A', value: 10, sets: ['A'] }, { label: 'B', value: 20, sets: ['B'] }, { label: 'C', value: 30, sets: ['C'] }, { label: 'AB', value: 5, sets: ['A', 'B'] }]."
    )
    .nonempty({ message: 'Venn chart data cannot be empty.' }),
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

export const venn = {
  name: 'venn',
  description:
    'A Venn diagram is a chart that uses circles or other closed curves to represent sets and their relationships. A Venn diagram shows the intersection, union, and difference relationships between different sets through overlapping areas, and is a classic chart type for displaying set relationships in data visualization. Venn diagrams are particularly suitable for showing the relationships between different data sets, such as the overlapping relationships of user groups, the intersection of product features, and overlapping users in market analysis. Through intuitive circular areas and overlapping parts, complex set logic relationships can be clearly expressed. When it is necessary to analyze the commonalities and differences between multiple groups or categories, a Venn diagram is a very effective visualization tool. It can help users quickly understand the inclusion, intersection, and independence relationships between data.',
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
