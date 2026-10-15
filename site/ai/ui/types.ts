import type { ReactNode } from 'react';
import type { PlaygroundUIMessage } from '../core/session';
import type { AnalysisUpdate, ToolStep } from '../core/types';
export type { ToolDetailLine, ToolStep, ToolDiff, ToolDiffLine } from '../core/types';

export interface Message extends AnalysisUpdate {
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
