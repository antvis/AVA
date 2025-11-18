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

// Pie chart data schema
const data = z.object({
  category: z.string(),
  value: z.number(),
});

// Pie chart input schema
const schema = {
  data: z
    .array(data)
    .describe(
      "Data for pie chart, it should be an array of objects, each object contains a `category` field and a `value` field, such as, [{ category: '分类一', value: 27 }]."
    )
    .nonempty({ message: 'Pie chart data cannot be empty.' }),
  innerRadius: z
    .number()
    .default(0)
    .describe(
      'Set the innerRadius of pie chart, the value between 0 and 1. Set the pie chart as a donut chart. Set the value to 0.6 or number in [0 ,1] to enable it.'
    ),
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

export const pie = {
  name: 'pie',
  description:
    "A pie chart is a circular statistical chart that represents data as sectors of a whole circle, used to show the proportional relationship of each category to the total. The angle of each sector is proportional to the value it represents, and the entire pie chart represents the sum of the data. Pie charts are particularly suitable for showing the proportional relationship of categorical data and can intuitively display the relative importance of each part to the whole. By using different colored sectors to distinguish between categories, comparing the proportions of each category becomes simple and intuitive. When there are few categories (usually no more than 5-7) and the relationship of each part to the whole needs to be emphasized, a pie chart is a good choice. For cases with many categories, consider merging categories with small proportions into an 'other' category.",
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
