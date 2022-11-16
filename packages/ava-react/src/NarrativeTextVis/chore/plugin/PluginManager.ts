import { EntityMetaData, EntityType, PhraseSpec, isCustomPhrase, isEntityPhrase } from '@antv/narrative-text-schema';
import { isArray } from 'lodash';
import {
  PhraseDescriptor,
  BlockDescriptor,
  PluginType,
  isBlockDescriptor,
  isEntityDescriptor,
  isCustomPhraseDescriptor,
} from './plugin-protocol.type';
import { presetPlugins } from './presets';

export class PluginManager {
  protected entities: Partial<Record<EntityType, PhraseDescriptor<EntityMetaData>>> = {};
  protected customPhrases: Record<string, PhraseDescriptor<any>> = {};
  protected customBlocks: Record<string, BlockDescriptor<any>> = {};
  constructor(plugins?: PluginType[]) {
    this.registerAll(getPlugins(plugins));
  }
  register(plugin: PluginType) {
    if (isBlockDescriptor(plugin)) {
      this.customBlocks[plugin.key] = plugin;
    }
    if (isEntityDescriptor(plugin)) {
      this.entities[plugin.key] = plugin;
    }
    if (isCustomPhraseDescriptor(plugin)) {
      this.customPhrases[plugin.key] = plugin;
    }
  }
  registerAll(plugins: PluginType[]) {
    plugins.forEach((plugin) => this.register(plugin));
  }
  getEntityDescriptor(entityType: EntityType) {
    return this.entities[entityType];
  }
  getCustomPhraseDescriptor(customType: string) {
    return this.customPhrases[customType];
  }
  getBlockDescriptor(customType: string) {
    return this.customBlocks[customType];
  }
  getPhraseDescriptorBySpec(spec: PhraseSpec) {
    if (isCustomPhrase(spec)) return this.getCustomPhraseDescriptor(spec.metadata.customType);
    if (isEntityPhrase(spec)) return this.getEntityDescriptor(spec.metadata.entityType);
    return null;
  }
}

function getPlugins(plugins?: PluginType[]) {
  return isArray(plugins) && plugins.length > 0 ? [...presetPlugins, ...plugins] : presetPlugins;
}
