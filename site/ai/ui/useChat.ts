'use client';

import { useEffect, useMemo, useState } from 'react';
import type { LLMConfig } from '@antv/ava/browser';
import { useChat as useAIChat } from '@ai-sdk/react';
import type { AIUIMessage } from '../core/session';
import type { Message, LiveChat } from './types';
import {
  MONTHLY_SALES,
  DEFAULT_DATASET_NAME,
  MAX_UPLOAD_SIZE_MB,
  MAX_UPLOAD_SIZE_BYTES,
  DATASET_PREVIEW_ROWS,
} from './constants';
import { createSession } from '../core/session';
import { toDisplayMessage } from './utils';
import type { AIDataset } from '../core/types';
import { parseCSV, parseExcel } from '../../components/utils';

export default function useChat({ config, onConfigure }: { config: LLMConfig; onConfigure: () => void }): LiveChat {
  const ready = !!config.apiKey?.trim() && (typeof config.model !== 'string' || !!config.model.trim());
  const [workingSessionId, setWorkingSessionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [dataset, setDataset] = useState<AIDataset>({ name: DEFAULT_DATASET_NAME, rows: MONTHLY_SALES });
  const [generation, setGeneration] = useState(0);
  const session = useMemo(() => createSession(config, dataset), [config, dataset, generation]);
  const chat = useAIChat<AIUIMessage>({ id: session.id, transport: session.transport });
  const busy = workingSessionId === session.id || chat.status === 'submitted' || chat.status === 'streaming';
  const lifecycle = useMemo(() => ({ active: true, locked: false }), [session]);
  const [uploadMessage, setUploadMessage] = useState<Message | null>(null);
  useEffect(() => {
    lifecycle.active = true;
    return () => {
      lifecycle.active = false;
      void chat.stop();
      void session.dispose().catch(() => {});
    };
  }, [session, chat.stop]);

  function reset() {
    if (lifecycle.locked || busy) return;
    setGeneration((value) => value + 1);
    setError('');
  }

  function patchUpload(update: (message: Message) => Message) {
    if (lifecycle.active) setUploadMessage((previous) => (previous ? update(previous) : previous));
  }

  async function suggest() {
    if (lifecycle.locked || busy) return;
    if (!ready) {
      onConfigure();
      return;
    }
    lifecycle.locked = true;
    setWorkingSessionId(session.id);
    setError('');
    patchUpload((message) => ({ ...message, suggestionsLoading: true, suggestionsError: undefined }));
    try {
      const questions = await session.suggest();
      patchUpload((message) => ({ ...message, suggestions: questions }));
    } catch (err) {
      patchUpload((message) => ({
        ...message,
        suggestionsError: `Could not generate questions. ${err instanceof Error ? err.message : String(err)}`,
      }));
    } finally {
      patchUpload((message) => ({ ...message, suggestionsLoading: false }));
      lifecycle.locked = false;
      if (lifecycle.active) {
        setError('');
        setWorkingSessionId(null);
      }
    }
  }

  async function send(question: string) {
    if (!question.trim() || lifecycle.locked || busy) return;
    if (!ready) {
      onConfigure();
      return;
    }
    lifecycle.locked = true;
    setError('');
    chat.clearError();
    try {
      await chat.sendMessage({ text: question });
    } finally {
      lifecycle.locked = false;
    }
  }

  async function attach(file: File) {
    if (lifecycle.locked || busy) return;
    lifecycle.locked = true;
    setWorkingSessionId(session.id);
    setError('');

    try {
      if (file.size > MAX_UPLOAD_SIZE_BYTES) throw new Error(`Maximum file size is ${MAX_UPLOAD_SIZE_MB} MB`);
      const extension = file.name.split('.').pop()?.toLowerCase();
      const rows: unknown =
        extension === 'xlsx'
          ? await parseExcel(await file.arrayBuffer())
          : extension === 'csv'
          ? parseCSV(await file.text())
          : extension === 'json'
          ? JSON.parse(await file.text())
          : null;
      if (
        !Array.isArray(rows) ||
        !rows.length ||
        rows.some((row) => !row || typeof row !== 'object' || Array.isArray(row))
      )
        throw new Error('Upload a CSV, Excel or JSON array containing data records.');
      if (!lifecycle.active) return;
      setDataset({ name: file.name, rows });
      const columns = new Set<string>();
      for (const row of rows) for (const key of Object.keys(row)) columns.add(key);
      const message: Message = {
        role: 'assistant',
        text: 'Your dataset is ready. Ask a question or add optional semantics to refine the analysis.',
        dataset: {
          name: file.name,
          rowCount: rows.length,
          columns: [...columns],
          preview: rows.slice(0, DATASET_PREVIEW_ROWS),
        },
      };
      setUploadMessage(message);
    } catch (err) {
      if (lifecycle.active) setError(err instanceof Error ? err.message : String(err));
    } finally {
      lifecycle.locked = false;
      if (lifecycle.active) {
        setWorkingSessionId(null);
      }
    }
  }
  async function updateSemantic(json: string) {
    if (lifecycle.locked || busy) throw new Error('Wait for the current operation to finish.');
    if (new TextEncoder().encode(json).length > MAX_UPLOAD_SIZE_BYTES)
      throw new Error(`Maximum semantic JSON size is ${MAX_UPLOAD_SIZE_MB} MB.`);
    const value: unknown = json.trim() ? JSON.parse(json) : undefined;
    lifecycle.locked = true;
    setWorkingSessionId(session.id);
    try {
      const semantic = value === undefined ? undefined : await session.validateSemantic(value);
      if (!lifecycle.active) throw new Error('The dataset changed. Reopen semantics and try again.');
      if (JSON.stringify(semantic) === JSON.stringify(dataset.semantic)) return;
      setDataset({ ...dataset, semantic });
      patchUpload((message) => ({
        ...message,
        suggestions: undefined,
        suggestionsError: undefined,
        suggestionsLoading: false,
      }));
      setError('');
    } finally {
      lifecycle.locked = false;
      if (lifecycle.active) setWorkingSessionId(null);
    }
  }
  // Generate questions with the new session after data or semantics change.
  useEffect(() => {
    if (uploadMessage && ready) void suggest();
  }, [dataset]);
  const messages = useMemo(
    () => [
      ...(uploadMessage ? [uploadMessage] : []),
      ...chat.messages.map((message) => toDisplayMessage(message, dataset.name)),
    ],
    [uploadMessage, chat.messages, dataset.name]
  );
  return {
    messages,
    busy,
    ready,
    error: error || chat.error?.message || '',
    dataset: { name: dataset.name, rowCount: dataset.rows.length, semantic: dataset.semantic },
    model: typeof config.model === 'string' ? config.model : config.model.modelId,
    onSend: (text) => {
      void send(text);
    },
    onReset: reset,
    onConfigure,
    onAttach: (file) => {
      void attach(file);
    },
    onSuggest: () => {
      void suggest();
    },
    onSemanticChange: updateSemantic,
  };
}
