'use client';

import { useEffect, useRef, useState } from 'react';
import type { Message } from '../types';

const CHUNK_MS = 24;

export default function useSimulatedStream(messages: Message[], onArtifact: (m: Message) => void, replayKey: number) {
  const [visible, setVisible] = useState<Message[]>(() => messages.slice(0, messages[0]?.role === 'user' ? 1 : 0));
  const [finished, setFinished] = useState(false);
  const runRef = useRef<{ key: number; completed: boolean } | null>(null);
  const [streamingIdx, setStreamingIdx] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const onArtifactRef = useRef(onArtifact);
  onArtifactRef.current = onArtifact;

  useEffect(() => {
    let cancelled = false;

    if (timerRef.current) clearInterval(timerRef.current);
    timeoutRef.current.forEach(clearTimeout);
    timeoutRef.current.clear();

    const track = (id: ReturnType<typeof setTimeout>) => {
      timeoutRef.current.add(id);
      return id;
    };
    const cancelAll = () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      timeoutRef.current.forEach(clearTimeout);
      timeoutRef.current.clear();
    };

    // Always replay from scratch on every mount / page refresh — no
    // cross-reload persistence for the completed state.
    if (runRef.current?.key !== replayKey) {
      runRef.current = { key: replayKey, completed: false };
    }

    setStreamingIdx(null);
    setFinished(runRef.current.completed);
    if (runRef.current.completed) {
      setVisible(messages);
      const artifact = [...messages].reverse().find((message) => message.artifact);
      if (artifact) onArtifactRef.current(artifact);
      return cancelAll;
    }
    let msgIdx = messages[0]?.role === 'user' ? 1 : 0;
    setVisible(messages.slice(0, msgIdx));

    const finish = () => {
      if (runRef.current) runRef.current.completed = true;
      setStreamingIdx(null);
      setFinished(true);
    };

    const patchLive = (patch: NonNullable<Message['live']>) => {
      setVisible((v) => {
        const copy = [...v];
        const i = copy.length - 1;
        copy[i] = { ...copy[i], live: { ...(copy[i].live ?? {}), ...patch } };
        return copy;
      });
    };

    const beginTextStream = (msg: Message) => {
      patchLive({ runningRow: null });
      const full = msg.text;
      const startedAt = performance.now();
      if (msg.artifact) onArtifactRef.current(msg);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        // Catch up after background throttling or a busy main thread.
        const pos = Math.floor((performance.now() - startedAt) / CHUNK_MS) * 4;
        const slice = full.slice(0, pos);
        setVisible((v) => {
          const copy = [...v];
          const i = copy.length - 1;
          copy[i] = { ...copy[i], text: slice };
          return copy;
        });
        if (pos >= full.length) {
          if (timerRef.current) clearInterval(timerRef.current);
          setStreamingIdx(null);
          msgIdx += 1;
          track(setTimeout(playNextMessage, 500));
        }
      }, CHUNK_MS);
    };

    /** Reveal tool rows one-by-one (running → done), then stream the body text. */
    const playRowsThenText = (msg: Message) => {
      const total = msg.steps?.length ?? 0;

      const idx = { i: 0 };
      const playRow = () => {
        if (cancelled) return;
        if (idx.i >= total) {
          patchLive({ runningRow: null });
          beginTextStream(msg);
          return;
        }
        patchLive({ rowsShown: idx.i + 1, runningRow: idx.i });
        const hold = 550 * (0.7 + Math.random() * 0.8);
        track(
          setTimeout(() => {
            patchLive({ runningRow: null });
            idx.i += 1;
            track(setTimeout(playRow, 160));
          }, hold)
        );
      };
      playRow();
    };

    const playNextMessage = () => {
      if (cancelled) return;
      if (msgIdx >= messages.length) {
        finish();
        return;
      }
      const msg = messages[msgIdx];

      if (msg.role === 'user') {
        setVisible((v) => [...v, msg]);
        msgIdx += 1;
        track(setTimeout(playNextMessage, 400));
        return;
      }

      setVisible((v) => [...v, { ...msg, text: '', live: { rowsShown: msg.steps ? 0 : undefined, runningRow: null } }]);
      setStreamingIdx(msgIdx);

      if (msg.steps && msg.steps.length > 0) {
        playRowsThenText(msg);
      } else {
        beginTextStream(msg);
      }
    };

    playNextMessage();

    return cancelAll;
  }, [messages, replayKey]);

  return { visible, streamingIdx, finished };
}
