import { seedToken } from './seed';

import type { ColorToken } from './seed';
import type { ThemeType } from '../types';

export default function getThemeColor(colorToken: ColorToken, theme: ThemeType = 'light') {
  return theme === 'light' ? seedToken[colorToken] : seedToken[`${colorToken}Dark`];
}
