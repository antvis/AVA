import G2PLOT_MAPPING from './G2Plot';

import { Channels } from '../advisor';

export type Mapping = { [type: string]: Channels };

/**
 * @beta
 */
export type ChartLibrary = 'G2Plot' | 'antdCharts';

const mappings: { [libraryName in ChartLibrary]: Mapping } = {
  G2Plot: G2PLOT_MAPPING,
  antdCharts: G2PLOT_MAPPING,
};

export function getMappingForLib(libraryName: ChartLibrary): Mapping {
  return mappings[libraryName];
}
