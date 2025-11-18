import { z } from 'zod';
import { zodToJsonSchema } from '../utils/validator';
import {
  AxisXTitleSchema,
  AxisYTitleSchema,
  BackgroundColorSchema,
  HeightSchema,
  PaletteSchema,
  TextureSchema,
  ThemeSchema,
  TitleSchema,
  WidthSchema,
} from './base';

// Scatter chart data schema
const data = z.object({
  x: z.number(),
  y: z.number(),
  group: z.string().optional().describe('Group name for the data point.'),
});

// Scatter chart input schema
const schema = {
  data: z
    .array(data)
    .describe('Data for scatter chart, such as, [{ x: 10, y: 15 }].')
    .nonempty({ message: 'Scatter chart data cannot be empty.' }),
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
  axisXTitle: AxisXTitleSchema,
  axisYTitle: AxisYTitleSchema,
};

export const scatter = {
  name: 'scatter',
  description:
    'A scatter plot is a visualization chart that displays the relationship between two continuous variables as points on a two-dimensional coordinate plane. The position of each data point is determined by the values of two variables, with one variable determining the horizontal position (x-axis) and the other determining the vertical position (y-axis). A scatter plot is different from a line chart; a scatter plot is mainly used to explore and display the correlation, distribution patterns, and identification of outliers between variables, while a line chart is more suitable for showing the trend changes of continuous data.',
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
