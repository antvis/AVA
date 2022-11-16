import { Section } from './section';
import { Paragraph, Headline } from './paragraph';
import { Phrase } from './phrases';
import { ArrowUp, ArrowDown } from './assets/icons';
import { SingleLineChart, ProportionChart } from './line-charts';

/**
 * export NTV related component
 */
export const NTV = {
  Section,
  Paragraph,
  Headline,
  Phrase,
  ArrowUp,
  ArrowDown,
  SingleLineChart,
  ProportionChart,
};

export { NarrativeTextVis } from './NarrativeTextVis';

export {
  PluginManager,
  createCustomPhraseFactory,
  createEntityPhraseFactory,
  createCustomBlockFactory,
  presetPlugins,
  createMetricName,
  createMetricValue,
  createDeltaValue,
  createRatioValue,
  createOtherMetricValue,
  createContributeRatio,
  createDimensionValue,
  createProportion,
  createTimeDesc,
  createTrendDesc,
} from './chore/plugin';
export { TextExporter, copyToClipboard } from './chore/exporter';
export { seedToken } from './theme';

export type { NtvTypes } from '@antv/ava';
export type { NarrativeTextVisProps } from './NarrativeTextVis';
export type { PluginType } from './chore/plugin';
