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

// Radar chart data schema
const data = z.object({
  name: z.string(),
  value: z.number(),
  group: z.string().optional(),
});

// Radar chart input schema
const schema = {
  data: z
    .array(data)
    .describe(
      "Data for radar chart, it should be an array of objects, each object contains a `name` field and a `value` field, such as, [{ name: 'Design', value: 70 }]."
    )
    .nonempty({ message: 'Radar chart data cannot be empty.' }),
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
};

export const radar = {
  name: 'radar',
  description:
    "A radar chart displays multivariate data on axes starting from the same point. Use a radar chart when you are concerned with comparing data of a whole (a person, a product, a role) on multiple relevant metrics. For example, you can use a radar chart to show a player's ability scores (e.g. shooting, passing, defense, dribbling and physical). In this case, each axis represents an ability, and the data points on the axes are connected to form a polygon. The larger the area of the polygon, the stronger the player's overall ability. You can also compare multiple players by putting them in the same radar chart. Applicable scenarios: 1. A data object is composed of multiple feature categories, such as the nutritional components of food (sugar, vitamins, minerals, fat, water); 2. The data feature categories are limited and can all be normalized or discretized. Not applicable scenarios: 1. There are too many categories in the data object, or they cannot be standardized to a uniform degree; 2. There are too many overlapping polygons in the radar chart.",
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
