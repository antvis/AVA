import { z } from 'zod';
import { zodToJsonSchema } from '../utils/validator';
import { MapHeightSchema, MapTitleSchema, MapWidthSchema, POIsSchema } from './base';

const schema = {
  title: MapTitleSchema,
  data: POIsSchema,
  markerPopup: z
    .object({
      type: z.string().default('image').describe('Must be "image".'),
      width: z.number().default(40).describe('Width of the photo.'),
      height: z.number().default(40).describe('Height of the photo.'),
      borderRadius: z.number().default(8).describe('Border radius of the photo.'),
    })
    .optional()
    .describe(
      'Marker type, one is simple mode, which is just an icon and does not require `markerPopup` configuration; the other is image mode, which displays location photos and requires `markerPopup` configuration. Among them, `width`/`height`/`borderRadius` can be combined to realize rectangular photos and square photos. In addition, when `borderRadius` is half of the width and height, it can also be a circular photo.'
    ),
  width: MapWidthSchema,
  height: MapHeightSchema,
};

export const pinMap = {
  name: 'pin-map',
  description:
    'A pin map is a visualization chart that marks geographic data as points on a map. Each point represents a specific location data and is described with a label, such as store locations, event occurrences, or attraction distributions. Pin maps make it easy for users to intuitively locate and view location-related data. In terms of data, a pin map requires at least the longitude and latitude data of the geographic location, and generally can also have a label field to describe the point. Applicable scenarios: 1. Displaying geographic location data such as stores, restaurants, and attractions; 2. Visualizing the location of events, such as earthquakes, fires, and traffic accidents; 3. Displaying geographic information, such as densely populated areas, climate distribution, and landform features.',
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
