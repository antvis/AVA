import { z } from 'zod';
import { zodToJsonSchema } from '../utils/validator';
import {
  AxisXTitleSchema,
  BackgroundColorSchema,
  HeightSchema,
  PaletteSchema,
  TextureSchema,
  ThemeSchema,
  TitleSchema,
  WidthSchema,
} from './base';

// Dual axes series schema
const DualAxesSeriesSchema = z.object({
  type: z.enum(['column', 'line']).describe("The optional value can be 'column' or 'line'."),
  data: z
    .array(z.number())
    .describe(
      'When type is column, the data represents quantities, such as [91.9, 99.1, 101.6, 114.4, 121]. When type is line, the data represents ratios and its values are recommended to be less than 1, such as [0.055, 0.06, 0.062, 0.07, 0.075].'
    ),
  axisYTitle: z
    .string()
    .default('')
    .describe("Set the y-axis title of the chart series, such as, axisYTitle: '销售额'.")
    .optional(),
});

// Dual axes chart input schema
const schema = {
  categories: z
    .array(z.string())
    .describe("Categories for dual axes chart, such as, ['2015', '2016', '2017'].")
    .nonempty({ message: 'Dual axes chart categories cannot be empty.' }),
  series: z
    .array(DualAxesSeriesSchema)
    .describe(
      "Series for dual axes chart, such as, [{ type: 'column', data: [91.9, 99.1, 101.6, 114.4, 121], axisYTitle: '销售额' }, { type: 'line', data: [0.055, 0.06, 0.062, 0.07, 0.075], 'axisYTitle': '利润率' }]."
    )
    .nonempty({ message: 'Dual axes chart series cannot be empty.' }),
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
};

export const dualAxes = {
  name: 'dual-axes',
  description:
    'A dual-axes chart is a combination chart that combines two different chart types, usually a column chart and a line chart. It uses two vertical Y-axes (left and right) in a single chart, corresponding to different numerical dimensions. The column chart is used to display the size or quantity of one set of data, while the line chart shows the trend of another set of data. Dual-axis charts are very suitable for simultaneously displaying the trends of different types of data. Applicable scenarios: 1. Simultaneously displaying two data sets with different orders of magnitude, such as sales and growth rate; 2. Comparing the relative trends of two sets of variables, such as observing sales and profit margin over the same period; 3. Data dimensions are different but share a common X-axis (e.g., time, category). Not applicable scenarios: 1. When the data types are the same and the orders of magnitude are similar, a single chart type (like a line or column chart) is simpler; 2. When two related data dimensions for comparison cannot be found, the value of a dual-axes chart is diminished.',
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
