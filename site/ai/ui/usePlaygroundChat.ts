'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { LLMConfig } from '@antv/ava/browser';
import { useChat } from '@ai-sdk/react';
import type { PlaygroundUIMessage } from '../core/session';
import type { Message, LivePlayground } from './types';
import {
  MONTHLY_SALES,
  DEFAULT_DATASET_NAME,
  MAX_UPLOAD_SIZE_MB,
  MAX_UPLOAD_SIZE_BYTES,
  DATASET_PREVIEW_ROWS,
} from '../constants';
import { createPlaygroundSession } from '../core/session';
import { toDisplayMessage } from './utils';
import type { PlaygroundDataset } from '../core/types';
import { parseCSV, parseExcel } from '../../components/utils';

export default function usePlaygroundChat({
  config,
  onConfigure,
}: {
  config: LLMConfig;
  onConfigure: () => void;
}): LivePlayground {
  const ready = !!config.apiKey?.trim() && (typeof config.model !== 'string' || !!config.model.trim());
  const [working, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dataset, setDataset] = useState<PlaygroundDataset>({ name: DEFAULT_DATASET_NAME, rows: MONTHLY_SALES });
  const running = useRef(false);
  const [generation, setGeneration] = useState(0);
  const session = useMemo(() => createPlaygroundSession(config, dataset), [config, dataset, generation]);
  const chat = useChat<PlaygroundUIMessage>({ id: session.id, transport: session.transport });
  const busy = working || chat.status === 'submitted' || chat.status === 'streaming';
  const mounted = useMemo(() => ({ current: true }), [session]);
  const importing = useRef(false);
  const [uploadMessage, setUploadMessage] = useState<Message | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      void chat.stop();
      void session.dispose().catch(() => {});
    };
  }, [session, chat.stop]);

  function reset() {
    if (running.current || busy) return;
    setGeneration((value) => value + 1);
    setError('');
  }

  function patchUpload(update: (message: Message) => Message) {
    if (mounted.current) setUploadMessage((previous) => (previous ? update(previous) : previous));
  }

  async function suggest() {
    if (running.current || importing.current || busy) return;
    if (!ready) {
      onConfigure();
      return;
    }
    running.current = true;
    setBusy(true);
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
      running.current = false;
      if (mounted.current) {
        setError('');
        setBusy(false);
      }
    }
  }

  async function send(question: string) {
    if (!question.trim() || running.current || importing.current || busy) return;
    if (!ready) {
      onConfigure();
      return;
    }
    running.current = true;
    setBusy(true);
    setError('');
    chat.clearError();
    try {
      await chat.sendMessage({ text: question });
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function attach(file: File) {
    if (running.current || importing.current || busy) return;
    importing.current = true;
    setBusy(true);
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
      if (!mounted.current) return;
      setDataset({ name: file.name, rows });
      const columns = new Set<string>();
      for (const row of rows) for (const key of Object.keys(row)) columns.add(key);
      const message: Message = {
        role: 'assistant',
        text: 'Your next questions will use this dataset. Ask for a summary, compare values, or explore a trend.',
        dataset: {
          name: file.name,
          rowCount: rows.length,
          columns: [...columns],
          preview: rows.slice(0, DATASET_PREVIEW_ROWS),
        },
      };
      setUploadMessage(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      importing.current = false;
      if (mounted.current) {
        setBusy(false);
      }
    }
  }
  // Suggestions run after the new dataset has its own agent and AVA instance.
  useEffect(() => {
    if (uploadMessage && ready) void suggest();
  }, [dataset]);
  const messages = useMemo(
    () => [
      ...(uploadMessage ? [uploadMessage] : []),
      ...chat.messages.map((message, index) =>
        toDisplayMessage(message, dataset.name, busy && index === chat.messages.length - 1)
      ),
    ],
    [uploadMessage, chat.messages, dataset.name, busy]
  );
  return {
    messages,
    busy,
    ready,
    error: error || chat.error?.message || '',
    dataset: { name: dataset.name, rowCount: dataset.rows.length },
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
  };
}
