import { PluginManager } from './PluginManager';
import { presetPlugins } from './presets';

export { createCustomPhraseFactory } from './createCustomPhraseFactory';
export { createEntityPhraseFactory } from './createEntityPhraseFactory';
export { createCustomBlockFactory } from './createCustomBlockFactory';
export { PluginManager } from './PluginManager';
export * from './presets';
export * from './plugin-protocol.type';

export const presetPluginManager = new PluginManager(presetPlugins);
