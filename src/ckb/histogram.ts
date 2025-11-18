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

// Histogram chart input schema
const schema = {
  data: z
    .array(z.number())
    .describe('Data for histogram chart, it should be an array of numbers, such as, [78, 88, 60, 100, 95].')
    .nonempty({ message: 'Histogram chart data cannot be empty.' }),
  binNumber: z
    .number()
    .optional()
    .describe(
      'Number of intervals to define the number of intervals in a histogram, when not specified, a built-in value will be used.'
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
  axisXTitle: AxisXTitleSchema,
  axisYTitle: AxisYTitleSchema,
};

export const histogram = {
  name: 'histogram',
  description:
    "A histogram, similar in shape to a bar chart, has a completely different meaning. A histogram involves statistical concepts; first, the data is grouped, and then the number of data elements in each group is counted. In a Cartesian coordinate system, the horizontal axis marks the endpoints of each group, and the vertical axis represents the frequency. The height of each rectangle represents the corresponding frequency, and such a chart is called a frequency distribution histogram. To get the quantity for each group in a frequency distribution histogram, the frequency is multiplied by the group interval. Since the group interval is constant for a given histogram, if the vertical axis directly represents the quantity, the height of each rectangle represents the number of data elements. This maintains the distribution's shape while also intuitively showing the quantity in each group.",
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
