import { Purpose } from '@antv/ckb';

export interface Preferences {
  canvasLayout: 'landscape' | 'portrait';
}

export interface LinterOptions {
  purpose?: Purpose;
  preferences?: Preferences;
}

export interface Lint {
  // rule type: hard / soft / design
  type: string;
  // rule id
  id: string;
  // rule score
  score: number;
  // fix solution
  fix?: any;
  // docs
  docs?: any;
}
