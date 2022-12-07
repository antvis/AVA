import { seedToken } from './seed';

import type { SizeType } from '../types';

export default function getFontSize(size: SizeType = 'normal') {
  return `${size === 'small' ? seedToken.fontSizeSmall : seedToken.fontSizeBase}px`;
}
