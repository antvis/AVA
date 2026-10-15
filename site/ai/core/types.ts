export type ToolDetailLine = { text: string; tone?: 'add' | 'del' | 'ctx' };
export type ToolStep = {
  id?: string;
  state?: 'running' | 'done' | 'failed';
  icon: string;
  label: string;
  chip: string;
  mono?: boolean;
  detailMono?: boolean;
  detail: ToolDetailLine[];
};
export type ToolDiff = { file: string; add: number; del?: number };
export type ToolDiffLine = { text: string; tone: 'add' | 'del' | 'ctx' };

export interface AnalysisArtifact {
  title: string;
  description: string;
  chart?: boolean;
  syntax?: string;
  code?: string;
  data?: Record<string, unknown>[];
  html?: string;
}

export interface AnalysisUpdate {
  artifact?: AnalysisArtifact;
  diffs?: ToolDiff[];
  diffLines?: Record<string, ToolDiffLine[]>;
}

export interface PlaygroundDataset {
  name: string;
  rows: Record<string, unknown>[];
}
