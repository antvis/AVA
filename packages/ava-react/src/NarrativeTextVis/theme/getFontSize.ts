import { seedToken } from './seed';

import type { ThemeProps } from '../types';

export default function getFontSize({ size = 'normal' }: ThemeProps) {
  return `${size === 'small' ? seedToken.fontSizeSmall : seedToken.fontSizeBase}px`;
}
