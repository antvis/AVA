export type ToolDetailLine = { text: string; tone?: 'add' | 'del' | 'ctx' };
export type ToolStep = { icon: string; label: string; chip: string; mono?: boolean; detailMono?: boolean; detail: ToolDetailLine[] };
export type ToolDiff = { file: string; add: number; del?: number };
export type ToolDiffLine = { text: string; tone: 'add' | 'del' | 'ctx' };

export interface Message {
  role: 'user' | 'assistant';
  text: string;
  steps?: ToolStep[];
  diffs?: ToolDiff[];
  diffLines?: Record<string, ToolDiffLine[]>;
  artifact?: { title: string; description: string; chart?: boolean };
  /** File attachments shown on the user's message bubble. */
  attachments?: string[];
}