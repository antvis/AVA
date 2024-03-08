import { get } from 'lodash';

import { seedToken } from './seed';

import type { EntityType } from '@antv/ava';
import type { ColorToken } from './seed';
import type { ThemeType, ThemeStylesProps } from '../types';

export default function getThemeColor({
  type,
  colorToken,
  theme,
  palette,
}: {
  colorToken: ColorToken;
  theme: ThemeType;
  type?: EntityType | 'text';
  palette?: ThemeStylesProps['palette'];
}) {
  const color = get(palette, [theme, type, 'color']);
  if (color) return color;
  return theme === 'light' ? seedToken[colorToken] : seedToken[`${colorToken}Dark`];
}
