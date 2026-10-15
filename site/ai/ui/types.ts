import type { ReactNode } from 'react';
import type { PlaygroundUIMessage } from '../core/session';
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
  id: string;
  title: string;
  description: string;
  syntax?: string;
  code?: string;
  data?: Record<string, unknown>[];
}

export interface Message {
  artifact?: AnalysisArtifact;
  diffs?: ToolDiff[];
  diffLines?: Record<string, ToolDiffLine[]>;
  role: 'user' | 'assistant';
  text: string;
  parts?: PlaygroundUIMessage['parts'];
  steps?: ToolStep[];
  live?: { rowsShown?: number; runningRow?: number | null };
  /** File attachments shown on the user's message bubble. */
  attachments?: string[];
  suggestions?: string[];
  suggestionsLoading?: boolean;
  suggestionsError?: string;
  dataset?: {
    name: string;
    rowCount: number;
    columns: string[];
    preview: Record<string, unknown>[];
  };
}
export interface LivePlayground {
  messages: Message[];
  busy: boolean;
  ready: boolean;
  error: string;
  dataset: { name: string; rowCount: number };
  model: string;
  onSend: (text: string) => void;
  onReset: () => void;
  onConfigure: () => void;
  onAttach: (file: File) => void;
  onSuggest: () => void;
}

export interface ChatPlayback {
  visible: Message[];
  streamingIdx: number | null;
  finished: boolean;
}

export type ArtifactTab = 'chart' | 'data' | 'sql';
export interface ArtifactDisplay {
  columns?: { key: string; label: string; suffix?: string }[];
  chartHeader?: ReactNode;
  chartFooter?: ReactNode;
}
