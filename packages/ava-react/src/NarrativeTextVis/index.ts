import { Section } from './section';
import { Paragraph, Headline } from './paragraph';
import { Phrase } from './phrases';
import { ArrowUp, ArrowDown } from './assets/icons';
import { SingleLineChart, ProportionChart } from './line-charts';
import { NarrativeTextVis as InnerNarrativeTextVis } from './NarrativeTextVis';

type NarrativeTextVisType = typeof InnerNarrativeTextVis & {
  Headline: typeof Headline;
  Section: typeof Section;
  Paragraph: typeof Paragraph;
  Phrase: typeof Phrase;
  ArrowUp: typeof ArrowUp;
  ArrowDown: typeof ArrowDown;
  SingleLineChart: typeof SingleLineChart;
  ProportionChart: typeof ProportionChart;
};

/**
 * export related component
 */
export const NarrativeTextVis = InnerNarrativeTextVis as NarrativeTextVisType;
NarrativeTextVis.Section = Section;
NarrativeTextVis.Headline = Headline;
NarrativeTextVis.Paragraph = Paragraph;
NarrativeTextVis.Paragraph = Paragraph;
NarrativeTextVis.Phrase = Phrase;
NarrativeTextVis.ArrowUp = ArrowUp;
NarrativeTextVis.ArrowDown = ArrowDown;
NarrativeTextVis.SingleLineChart = SingleLineChart;
NarrativeTextVis.ProportionChart = ProportionChart;

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
