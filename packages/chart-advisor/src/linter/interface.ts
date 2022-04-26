import type { Purpose } from '@antv/ckb';

export interface Preferences {
  canvasLayout: 'landscape' | 'portrait';
}

export interface LinterOptions {
  purpose?: Purpose;
  preferences?: Preferences;
}
