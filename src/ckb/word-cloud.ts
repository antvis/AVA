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

// Word cloud data schema
const data = z.object({
  text: z.string(),
  value: z.number(),
});

// Word cloud input schema
const schema = {
  data: z
    .array(data)
    .describe(
      "Data for word cloud chart, it should be an array of objects, each object contains a `text` field and a `value` field, such as, [{ value: 4.272, text: '形成' }]."
    )
    .nonempty({ message: 'Word cloud chart data cannot be empty.' }),
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

export const wordCloud = {
  name: 'word-cloud',
  description:
    'A word-cloud is a chart type that visually displays text data, reflecting the importance or frequency of words in the text by adjusting their size, color, and position. A word-cloud transforms text information into an intuitive visual representation, allowing users to quickly identify keywords and themes in the text. Word clouds are particularly suitable for analyzing large amounts of text data, such as social media comments, user feedback, article content, and survey reports. By comparing the size of the words, users can quickly understand which words are most important or appear most frequently, thereby extracting the core information and trends of the text.',
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
