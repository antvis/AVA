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

// Area chart data schema
const data = z.object({
  time: z.string(),
  value: z.number(),
  group: z.string().optional(),
});

// Area chart input schema
const schema = {
  data: z
    .array(data)
    .describe("Data for area chart, such as, [{ time: '2018', value: 99.9 }].")
    .nonempty({ message: 'Area chart data cannot be empty.' }),
  stack: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether stacking is enabled. When enabled, area charts require a 'group' field in the data."),
  style: z
    .object({
      backgroundColor: BackgroundColorSchema,
      palette: PaletteSchema,
      texture: TextureSchema,
      lineWidth: z.number().optional().describe('Line width for the lines of chart, such as 4.'),
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

export const area = {
  name: 'area',
  description:
    'The area chart is based on the line chart, filling the area between the line and the axis to emphasize the trend of quantity changes. It can better show the peaks and valleys in trend changes, using the visual effect of the filled area to highlight the degree of change in quantity over time. Area charts are particularly suitable for displaying continuous time-series data, intuitively expressing the trend of data changes, and emphasizing the change in the total amount within a certain interval through the visual effect of the area. When it is necessary to display data from multiple series at the same time, a stacked area chart or a percentage stacked area chart can be used to compare the proportion of each category in the total and its change over time.',
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
