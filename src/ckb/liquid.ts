import { z } from 'zod';
import { zodToJsonSchema } from '../utils/validator';
import { BackgroundColorSchema, HeightSchema, TextureSchema, ThemeSchema, TitleSchema, WidthSchema } from './base';

const schema = {
  percent: z
    .number()
    .describe(
      'The percentage value to display in the liquid chart, should be a number between 0 and 1, where 1 represents 100%. For example, 0.75 represents 75%.'
    )
    .min(0, { message: 'Value must be at least 0.' })
    .max(1, { message: 'Value must be at most 1.' }),
  shape: z
    .enum(['circle', 'rect', 'pin', 'triangle'])
    .optional()
    .default('circle')
    .describe("The shape of the liquid chart, can be 'circle', 'rect', 'pin', or 'triangle'. Default is 'circle'."),
  style: z
    .object({
      backgroundColor: BackgroundColorSchema,
      texture: TextureSchema,
      color: z
        .string()
        .optional()
        .describe('Custom color for the liquid chart, if not specified, defaults to the theme color.'),
    })
    .optional()
    .describe('Style configuration for the chart with a JSON object, optional.'),
  theme: ThemeSchema,
  width: WidthSchema,
  height: HeightSchema,
  title: TitleSchema,
};

export const liquid = {
  name: 'liquid',
  description:
    'A liquid chart is a chart that uses a liquid filling effect to represent a numerical ratio. It usually uses a circular container as a carrier to intuitively display the current progress or proportion of a certain indicator through the liquid level height and wave dynamics. The height of the liquid represents the percentage of the value, and the wave effect enhances the visual expressiveness, making it suitable for displaying the completion or status of a single indicator.',
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
