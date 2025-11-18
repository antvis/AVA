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
  group: z.string().optional().describe('Optional group for the data point, used for grouping in the violin chart.'),
});

const schema = {
  data: z
    .array(data)
    .describe(
      "Data for violin chart, such as, [{ category: '分类一', value: 10 }] or [{ category: '分类二', value: 20, group: '组别一' }]."
    )
    .nonempty({ message: 'Violin chart data cannot be empty.' }),
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

export const violin = {
  name: 'violin',
  description:
    "A violin plot is a data visualization chart that combines a box plot and a kernel density estimate to show the distribution shape and statistical summary of data. The shape of a violin plot is similar to a violin, hence the name. A violin plot displays the distribution density of data at different numerical intervals through a density curve, while also overlaying the statistical information of a box plot (such as the median, quartiles, etc.). This allows for a more intuitive reflection of the data's distribution characteristics, including multimodality, skewness, and outliers. Compared to a traditional box plot, a violin plot provides richer distribution information and is particularly suitable for comparing the distribution characteristics of multiple groups of data, making it an important tool for exploratory data analysis and statistical visualization.",
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
