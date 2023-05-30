import { chartsDisplayPlugin } from './plugins/chartPlugin';
import { subspaceDescriptionPlugin } from './plugins/subspaceDescriptionPlugin';

import type { NtvPluginType } from '../../NarrativeTextVis';

export const insightCardPresetPluginsMap: Record<string, NtvPluginType> = {
  chartsDisplayPlugin,
  subspaceDescriptionPlugin
}

export const insightCardPresetPlugins: NtvPluginType[] = Object.values(insightCardPresetPluginsMap);
