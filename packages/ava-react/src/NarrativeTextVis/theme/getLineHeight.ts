import { seedToken } from './seed';

import type { SizeType } from '../types';

export default function getLineHeight(size: SizeType = 'normal') {
  return `${size === 'small' ? seedToken.lineHeightSmall : seedToken.lineHeightBase}px`;
}
