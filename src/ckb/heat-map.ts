import { z } from 'zod';
import { zodToJsonSchema } from '../utils/validator';

const point = z
  .object({
    longitude: z.number().describe('Longitude of the data point.'),
    latitude: z.number().describe('Latitude of the data point.'),
    value: z.number().describe('Value of the data point, used for color intensity.'),
  })
  .describe('Heat map data point.');

const schema = {
  data: z
    .array(point)
    .nonempty()
    .describe('Data for the heat map, which is an array of objects with longitude, latitude, and value.'),
};

export const heatMap = {
  name: 'heat-map',
  description:
    'A heat map is a visualization chart that uses color gradients to show the intensity or density of geographic location data. It uses variations in color depth to help users identify the distribution and concentration trends of data in a geographical space. Heat maps are suitable for displaying the distribution patterns of a large number of data points and can clearly identify hotspot areas and trends. In terms of data, a heat map requires longitude and latitude data for geographic locations, as well as a field for intensity values to represent the weight of different locations. Applicable scenarios: 1. Visualizing popular geographic locations such as stores, restaurants, attractions, and traffic flow; 2. Visualizing the density of crowds, vehicle traffic, or other moving objects.',
  inputSchema: zodToJsonSchema(schema),
  zodSchema: schema,
};
