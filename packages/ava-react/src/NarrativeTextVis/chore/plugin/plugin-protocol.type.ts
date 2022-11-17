import type { NtvTypes } from '@antv/ava';
import type { CSSProperties, ReactNode } from 'react';
import type { TooltipProps } from 'antd';
import type { EntityEncoding } from '../../types';

/**
 * description for phrase render
 */
export type PhraseDescriptor<MetaData> = {
  /** key represent entityType of customType */
  key: string;
  isEntity: boolean;
  /**
   * main react node, default is phrase value
   * @param value phrase spec value
   * @param metadata phrase spec metadata
   */
  content?: (value: string, metadata: MetaData) => ReactNode;
  /**
   * tooltip of phrases
   */
  tooltip?:
    | false
    | (Omit<TooltipProps, 'title'> & {
        // overwrite antd tooltip title props
        title: (value: string, metadata: MetaData) => ReactNode;
      });
  classNames?: string[] | ((value: string, metadata: MetaData) => string[]);
  style?: CSSProperties | ((value: string, metadata: MetaData) => CSSProperties);
  onHover?: (value: string, metadata: MetaData) => string;
  onClick?: (value: string, metadata: MetaData) => string;
  getText?: (value: string, metadata: MetaData) => string;
  getMarkdown?: (value: string, metadata: MetaData) => string;

  /**
   * overwrite will be the highest priority to render node if it defined
   * @param node the program result node
   * @param value phrase spec value
   * @param metadata phrase spec metadata
   */
  overwrite?: (node: ReactNode, value: string, metadata: MetaData) => ReactNode;
};

export type CustomPhraseDescriptor<MetaData> = PhraseDescriptor<MetaData> & { isEntity: false };

/**
 * description for entity phrase render
 */
export interface EntityPhraseDescriptor extends PhraseDescriptor<NtvTypes.EntityMetaData> {
  key: NtvTypes.EntityType;
  isEntity: true;
  /**
   * entity phrase encoding channel based on entityType
   */
  encoding?: EntityEncoding<ReactNode>;
}

export type SpecificEntityPhraseDescriptor = Omit<EntityPhraseDescriptor, 'key' | 'isEntity'>;
export type CustomEntityMode = 'overwrite' | 'merge';

export type EntityPhrasePlugin = (
  customPhraseDescriptor?: SpecificEntityPhraseDescriptor,
  mode?: CustomEntityMode
) => PhraseDescriptor<NtvTypes.EntityMetaData>;

export type BlockDescriptor<CustomBlockSpec> = {
  key: string;
  isBlock: true;
  className?: string | ((spec: CustomBlockSpec) => string);
  style?: CSSProperties | ((spec: CustomBlockSpec) => CSSProperties);
  render?: (spec: CustomBlockSpec) => ReactNode;
  getText?: (spec: CustomBlockSpec) => string;
  getMarkdown?: (spec: CustomBlockSpec) => string;
};

export type AnyObject = Record<string, unknown>;

export type PluginType = PhraseDescriptor<any> | BlockDescriptor<any>;

export function isBlockDescriptor(plugin: PluginType): plugin is BlockDescriptor<any> {
  return 'isBlock' in plugin && plugin.isBlock;
}

export function isEntityDescriptor(plugin: PluginType): plugin is PhraseDescriptor<any> {
  return 'isEntity' in plugin && plugin.isEntity;
}

export function isCustomPhraseDescriptor(plugin: PluginType): plugin is PhraseDescriptor<any> {
  return 'isEntity' in plugin && !plugin.isEntity;
}
