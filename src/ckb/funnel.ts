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
  category: z.string(),
  value: z.number(),
});

const schema = {
  data: z
    .array(data)
    .describe(
      "Data for funnel chart, such as, [{ category: '浏览网站', value: 50000 }, { category: '放入购物车', value: 35000 }, { category: '生成订单', value: 25000 }, { category: '支付订单', value: 15000 }, { category: '完成交易', value: 8000 }]."
    )
    .nonempty({ message: 'Funnel chart data cannot be empty.' }),
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

export const funnel = {
  name: 'funnel',
  description:
    'A funnel chart is a special type of visualization chart used to show the flow of data through different stages in a business process. It is named for its funnel-like shape, displaying the data volume of each stage from top to bottom, usually wide at the top and narrow at the bottom, reflecting the process of data loss or conversion. Funnel charts are particularly suitable for visualizing conversion rates in business processes, such as sales funnels, user registration flows, or marketing funnels. With a funnel chart, you can intuitively observe data changes at each stage and identify key conversion points or bottlenecks. Each layer of the funnel chart represents a stage in the process, and the width or area of the layer is usually proportional to the data volume of that stage, thus clearly reflecting the data loss during the conversion process.',
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
