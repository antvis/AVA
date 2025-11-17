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

// Line chart data schema
const data = z.object({
  time: z.string(),
  value: z.number(),
  group: z.string().optional(),
});

// Line chart input schema
const schema = {
  data: z
    .array(data)
    .describe(
      "Data for line chart, it should be an array of objects, each object contains a `time` field and a `value` field, such as, [{ time: '2015', value: 23 }, { time: '2016', value: 32 }]."
    )
    .nonempty({ message: 'Line chart data cannot be empty.' }),
  style: z
    .object({
      texture: TextureSchema,
      backgroundColor: BackgroundColorSchema,
      palette: PaletteSchema,
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

export const line = {
  name: 'line',
  description:
    'A line chart is a statistical chart that connects data points in order of time or category to form a line, used to show the trend of data changes over time or ordered categories. Through the rise or fall of the line, it can intuitively represent the speed, magnitude, range, and periodicity of data changes. Line charts are particularly suitable for displaying data changes in continuous time series, and can effectively reflect trends, fluctuations, periodicity, and outliers in the data. When comparing multiple series of data, a line chart clearly shows the comparison and relationship between each data series through lines of different colors or styles. Compared to an area chart, a line chart focuses more on showing the trend and trajectory of data changes rather than the total volume; compared to a bar chart, a line chart is more suitable for showing continuous trends rather than discrete numerical comparisons.',
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
