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

const data = z.object({
  category: z.string().describe("Category of the data point, such as '分类一'."),
  value: z.number().describe('Value of the data point, such as 10.'),
  group: z.string().optional().describe('Optional group for the data point, used for grouping in the boxplot.'),
});

const schema = {
  data: z
    .array(data)
    .describe(
      "Data for boxplot chart, such as, [{ category: '分类一', value: 10 }] or [{ category: '分类二', value: 20, group: '组别一' }]."
    )
    .nonempty({ message: 'Boxplot chart data cannot be empty.' }),
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

export const boxplot = {
  name: 'boxplot',
  description:
    'A box plot is a statistical chart used to display the distribution of a set of data. It can display five important statistics of the data: the minimum, the lower quartile (Q1), the median (Q2), the upper quartile (Q3), and the maximum, while also clearly identifying outliers in the data. The design of the box plot is simple and clear. Through the combination of the box and whiskers, one can quickly understand the central tendency, degree of dispersion, and skewness of the data, making it an important tool in statistical analysis and data exploration.',
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
