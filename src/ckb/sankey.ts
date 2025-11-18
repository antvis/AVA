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
  source: z.string(),
  target: z.string(),
  value: z.number(),
});

const schema = {
  data: z
    .array(data)
    .describe(
      "Date for sankey chart, such as, [{ source: 'Landing Page', target: 'Product Page', value: 50000 }, { source: 'Product Page', target: 'Add to Cart', value: 35000 }, { source: 'Add to Cart', target: 'Checkout', value: 25000 }, { source: 'Checkout', target: 'Payment', value: 15000 }, { source: 'Payment', target: 'Purchase Completed', value: 8000 }]."
    )
    .nonempty({ message: 'Sankey chart data cannot be empty.' }),
  nodeAlign: z
    .enum(['left', 'right', 'justify', 'center'])
    .optional()
    .default('center')
    .describe("Alignment of nodes in the sankey chart, such as, 'left', 'right', 'justify', or 'center'."),
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

export const sankey = {
  name: 'sankey',
  description:
    'A Sankey diagram is a chart used to visualize the flow relationships of traffic, energy, funds, etc., between different nodes. The bandwidth represents the flow size, and the nodes and flow lines intuitively show the direction and distribution of each part. It is often used in analysis scenarios such as energy flow, capital flow, and user paths. It is suitable for displaying various types of flow distribution and directional relationships, such as energy flow, capital circulation, user behavior paths, supply chain flow, etc. It highlights the distribution structure and flow path of the traffic.',
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
