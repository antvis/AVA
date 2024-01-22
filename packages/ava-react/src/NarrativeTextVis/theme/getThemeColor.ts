import { EntityType } from '@antv/ava';

import { seedToken } from './seed';

import type { ColorToken } from './seed';
import type { ThemeType, ThemeStylesProps } from '../types';

export default function getThemeColor(
  colorToken: ColorToken,
  theme: ThemeType = 'light',
  palette?: ThemeStylesProps['entityStyle'][EntityType]
) {
  if (palette?.color) return palette.color;
  return theme === 'light' ? seedToken[colorToken] : seedToken[`${colorToken}Dark`];
}
