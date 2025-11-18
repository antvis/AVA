import { z } from 'zod';
import { zodToJsonSchema } from '../utils/validator';
import { MapHeightSchema, MapTitleSchema, MapWidthSchema, POIsSchema } from './base';

const schema = {
  title: MapTitleSchema,
  data: z
    .array(z.object({ data: POIsSchema }).describe('The route and places along it.'))
    .nonempty('At least one route is required.')
    .describe(
      'Routes, each group represents all POIs along a route. For example, [{ "data": ["西安钟楼", "西安大唐不夜城", "西安大雁塔"] }, { "data": ["西安曲江池公园", "西安回民街"] }]'
    ),
  width: MapWidthSchema,
  height: MapHeightSchema,
};

export const pathMap = {
  name: 'path-map',
  description: "Generate a route map to display the user's planned route, such as travel guide routes.",
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
