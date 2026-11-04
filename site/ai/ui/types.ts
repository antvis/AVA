import type { Semantic } from '@antv/ava/browser';
import type { AIUIMessage } from '../core/session';
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

export interface AnalysisArtifact {
  id: string;
  title: string;
  description: string;
  report?: {
    question: string;
    answer: string;
    insight: string;
    limitations: string;
  };
  config?: Record<string, unknown>;
  code?: string;
  codeLanguage?: 'javascript' | 'sql' | 'python';
  outputText?: string;
  data?: Record<string, unknown>[];
}

export interface Message {
  inlineChart?: { title: string; config: Record<string, unknown>; caption: string };
  recordedTool?: { name: string; label: string; chip: string; input: unknown; output: any; failed?: boolean };
  artifact?: AnalysisArtifact;
  role: 'user' | 'assistant';
  text: string;
  parts?: AIUIMessage['parts'];
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
    tableName?: string;
    tableCount?: number;
  };
}
export interface LiveChat {
  messages: Message[];
  busy: boolean;
  ready: boolean;
  error: string;
  dataset: { name: string; rowCount: number; tableCount?: number; semantic?: Semantic };
  model: string;
  onSend: (text: string) => void;
  onReset: () => void;
  onConfigure: () => void;
  onAttach: (file: File) => void;
  onSuggest: () => void;
  onSemanticChange: (json: string) => Promise<void>;
}

export interface ChatPlayback {
  visible: Message[];
  streamingIdx: number | null;
  finished: boolean;
}

export type ArtifactTab = 'chart' | 'data' | 'sql';
export interface ArtifactDisplay {
  columns?: { key: string; label: string; suffix?: string }[];
}
