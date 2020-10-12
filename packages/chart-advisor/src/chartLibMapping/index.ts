import { ChartID } from '@antv/knowledge';
import { G2PLOT_TYPE_MAPPING, G2PLOT_CONFIG_MAPPING } from './G2Plot';

/**
 * @beta
 */
export interface Channels {
  x?: string;
  x2?: string;
  y?: string;
  y2?: string;
  color?: string;
  angle?: string;
  radius?: string;
  series?: string;
  size?: string;
}

/**
 * @beta
 */
export type ConfigMapping = Partial<Record<ChartID, Channels>>;

/**
 * @beta
 */
export type TypeMapping = Partial<Record<ChartID, string>>;

/**
 * @beta
 */
export interface Mapping {
  typeMapping: TypeMapping;
  configMapping: ConfigMapping;
}

/**
 * @beta
 */
export type ChartLibrary = 'G2Plot' | 'antdCharts';

const typeMappings: { [libraryName in ChartLibrary]: TypeMapping } = {
  G2Plot: G2PLOT_TYPE_MAPPING,
  antdCharts: G2PLOT_TYPE_MAPPING,
};

const configMappings: { [libraryName in ChartLibrary]: ConfigMapping } = {
  G2Plot: G2PLOT_CONFIG_MAPPING,
  antdCharts: G2PLOT_CONFIG_MAPPING,
};

/**
 * @beta
 */
export function getMappingForLib(libraryName: ChartLibrary): Mapping {
  return {
    typeMapping: typeMappings[libraryName],
    configMapping: configMappings[libraryName],
  };
}
