import type { EntityMetaData } from '@antv/ava';
import type { ThemeStylesProps } from './props';

export type TypeOrMetaReturnType<T> =
  | T
  | ((value: string, metadata: EntityMetaData, themeStyles: ThemeStylesProps) => T);

/** entity phrase encoding channel */
export type EntityEncoding<NodeType> = Partial<{
  color: TypeOrMetaReturnType<string>;
  bgColor: TypeOrMetaReturnType<string>;
  fontSize: TypeOrMetaReturnType<string | number>;
  fontWeight: TypeOrMetaReturnType<string | number>;
  underline: TypeOrMetaReturnType<boolean>;
  prefix: TypeOrMetaReturnType<NodeType>;
  suffix: TypeOrMetaReturnType<NodeType>;
  inlineChart: TypeOrMetaReturnType<NodeType>;
}>;
