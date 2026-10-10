'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import GPTVisRenderer from './GPTVisRenderer';
import type { Message } from './playground/types';
import {
  PRESET_MESSAGES,
  CHART_SYNTAX,
  PROMPT_SOURCES,
  PROMPT_COMMANDS,
  PROMPT_MODELS,
  ATTACH_FILES,
  DICTATION_TEXT,
  SESSION,
  CHART_CAPTION,
} from './playground/mockData';

export type { ToolDetailLine, ToolStep, ToolDiff, ToolDiffLine } from './playground/types';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

/** Live playback state applied to a message as it streams in. */
interface LiveState {
  rowsShown?: number; // # of tool rows revealed so far
  runningRow?: number | null; // index of the row currently running
}

type LiveMessage = Message & { live?: LiveState };

/* ------------------------------------------------------------------ */
/* Streaming engine                                                    */
/* ------------------------------------------------------------------ */

const CHUNK_MS = 24;
const PLAYBACK_STORAGE_KEY = 'ava-playground-playback-v1';

function useSimulatedStream(messages: Message[], onArtifact: (m: Message) => void, replayKey: number) {
  const [visible, setVisible] = useState<LiveMessage[]>([]);
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

    if (runRef.current?.key !== replayKey) {
      let completed = false;
      try {
        completed = replayKey === 0 && localStorage.getItem(PLAYBACK_STORAGE_KEY) === 'completed';
      } catch {
        // Storage may be unavailable; keep playback usable in memory.
      }
      runRef.current = { key: replayKey, completed };
    }

    setStreamingIdx(null);
    setFinished(runRef.current.completed);
    if (runRef.current.completed) {
      setVisible(messages);
      const artifact = [...messages].reverse().find((message) => message.artifact);
      if (artifact) onArtifactRef.current(artifact);
      return cancelAll;
    }
    setVisible([]);

    const finish = () => {
      if (runRef.current) runRef.current.completed = true;
      setStreamingIdx(null);
      setFinished(true);
      try {
        localStorage.setItem(PLAYBACK_STORAGE_KEY, 'completed');
      } catch {
        // The current run still stops when browser storage is unavailable.
      }
    };

    const patchLive = (patch: LiveState) => {
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
      let pos = 0;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        pos += 2 + Math.floor(Math.random() * 4);
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
          if (msg.artifact) {
            track(setTimeout(() => onArtifactRef.current(msg), 350));
          }
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
          track(setTimeout(() => beginTextStream(msg), 350));
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

    let msgIdx = 0;

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

      setVisible((v) => [
        ...v,
        { ...msg, text: '', live: { rowsShown: msg.steps ? 0 : undefined, runningRow: null } },
      ]);
      setStreamingIdx(msgIdx);

      if (msg.steps && msg.steps.length > 0) {
        track(setTimeout(() => playRowsThenText(msg), 300));
      } else {
        track(setTimeout(() => beginTextStream(msg), 200));
      }
    };

    track(setTimeout(playNextMessage, 500));

    return cancelAll;
  }, [messages, replayKey]);

  return { visible, streamingIdx, finished };
}

/* ------------------------------------------------------------------ */
/* AgentRun — tool-chips trace (beautifului.dev Tool Chips style)     */
/* ------------------------------------------------------------------ */

const Icons: Record<string, React.ReactNode> = {
  think: <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />,
  write: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
    </g>
  ),
  run: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 17l6-5-6-5M12 19h8" />
    </g>
  ),
  read: (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </g>
  ),
};

const AgentRun: React.FC<{ msg: Message; live: LiveState | undefined }> = ({ msg, live }) => {
  const steps = msg.steps ?? [];
  const diffs = msg.diffs ?? [];
  const diffLines = msg.diffLines ?? {};

  const shown = live?.rowsShown ?? steps.length;
  const running = typeof live?.runningRow === 'number' ? live.runningRow : null;
  const allRowsDone = shown >= steps.length && running === null;

  const [open, setOpen] = useState(true);
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<{ file: string; x: number; top?: number; bottom?: number } | null>(null);

  const openPreview = (file: string) => (event: React.SyntheticEvent) => {
    const host = (event.currentTarget as Element).closest('[data-diffchip]');
    if (!host) return;
    const rect = host.getBoundingClientRect();
    const previewHeight = 38 + (diffLines[file]?.length ?? 0) * 19;
    const fitsBelow = rect.bottom + 6 + previewHeight <= window.innerHeight - 12;
    setPreview({
      file,
      x: Math.max(12, Math.min(rect.left, window.innerWidth - 300)),
      ...(fitsBelow ? { top: rect.bottom + 6 } : { bottom: window.innerHeight - rect.top + 6 }),
    });
  };
  const closePreview = (file: string) => () => setPreview((cur) => (cur?.file === file ? null : cur));

  const toggleRow = (label: string) =>
    setOpenRows((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });

  if (steps.length === 0) return null;

  const headerText = running !== null ? `${steps.length} tool calls — running…` : `${steps.length} tool calls, 1 message`;

  return (
    <div className="min-h-[220px] w-full pb-1">
      {/* collapsed run header */}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((c) => !c)}
        className="-mx-1.5 flex w-fit items-center gap-1.5 rounded-control px-1.5 py-1 text-[12.5px] text-ink-2 transition-colors duration-100 hover:bg-hover-2"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-200"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
        <span className="tabular-nums">{headerText}</span>
        {running !== null && <span className="inline-block pixel-dot scale-50" />}
      </button>

      {/* tool call rows */}
      <div
        className="grid transition-[grid-template-rows,opacity] duration-300"
        style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}
      >
        <div className="-mx-1 overflow-hidden px-1.5 pb-1">
          <div className="mt-1.5 flex flex-col gap-1">
            {steps.slice(0, shown).map((row, i) => {
              const rowOpen = openRows.has(row.label);
              const isRunning = running === i;
              return (
                <div key={row.label} style={{ animation: 'fade-up 300ms cubic-bezier(0.23,1,0.32,1) both' }}>
                  <button
                    type="button"
                    aria-expanded={rowOpen}
                    onClick={() => toggleRow(row.label)}
                    className="group/row -mx-[3px] flex h-7 w-[calc(100%+6px)] min-w-0 items-center gap-2 rounded-control px-[3px] text-left transition-colors duration-100 hover:bg-hover-2"
                  >
                    <span className="relative flex size-4 shrink-0 items-center justify-center text-ink-3">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill={row.icon === 'think' ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-opacity duration-100 group-hover/row:opacity-0 ${rowOpen ? 'opacity-0' : ''} ${
                          isRunning ? 'animate-pulse text-ink' : ''
                        }`}
                      >
                        {Icons[row.icon]}
                      </svg>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`absolute transition-[opacity,transform] duration-150 group-hover/row:opacity-100 ${
                          rowOpen ? 'opacity-100' : 'opacity-0'
                        }`}
                        style={{ transform: rowOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                    <span className="shrink-0 text-[12.5px] font-medium text-ink">{row.label}</span>
                    <span
                      className={`inline-flex h-5.5 min-w-0 flex-1 cursor-pointer items-center truncate rounded-chip bg-field px-1.5
                    text-[11.5px] text-ink-2 shadow-hairline transition-colors duration-100 hover:bg-hover-2
                    ${row.mono ? 'font-mono' : ''}`}
                    >
                      {row.chip}
                    </span>
                  </button>

                  {/* expanded detail */}
                  <div
                    className="grid transition-[grid-template-rows,opacity] duration-300"
                    style={{
                      gridTemplateRows: rowOpen ? '1fr' : '0fr',
                      opacity: rowOpen ? 1 : 0,
                      transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                    }}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="mt-0.5 mb-1 ml-2 flex flex-col gap-0.5 border-l border-line py-0.5 pl-3.5">
                        {row.detail.map((line) => (
                          <span
                            key={line.text}
                            className={`truncate text-[11.5px] leading-[1.6] ${row.detailMono ? 'font-mono' : ''} ${
                              line.tone === 'add' ? 'text-green' : line.tone === 'del' ? 'text-red' : 'text-ink-2'
                            }`}
                          >
                            {line.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* file-diff chips — appear once every row has completed */}
          {allRowsDone && diffs.length > 0 && (
            <div className="mt-2.5 flex max-w-full flex-wrap gap-1.5 border-t border-line pt-2.5">
              {diffs.map((d, i) => (
                <span key={d.file} data-diffchip className="relative" onMouseEnter={openPreview(d.file)} onMouseLeave={closePreview(d.file)}>
                  <button
                    type="button"
                    aria-expanded={preview?.file === d.file}
                    aria-label={`Show diff for ${d.file}`}
                    onFocus={openPreview(d.file)}
                    onBlur={closePreview(d.file)}
                    className="inline-flex h-7 max-w-full items-center gap-2 rounded-chip
                  bg-surface px-2 font-mono text-[11.5px] text-ink shadow-btn
                  transition-colors duration-100 hover:bg-hover"
                    style={{ animation: `pop-in 250ms cubic-bezier(0.23,1,0.32,1) ${i * 80}ms both` }}
                  >
                    <span className="min-w-0 truncate">{d.file}</span>
                    <span className="shrink-0 text-green tabular-nums">+{d.add}</span>
                    {(d.del ?? 0) > 0 && <span className="shrink-0 text-red tabular-nums">−{d.del}</span>}
                  </button>
                </span>
              ))}
              <button
                type="button"
                className="inline-flex h-7 items-center rounded-chip px-1.5 font-mono text-[11.5px] text-ink-3 underline decoration-transparent underline-offset-2 transition-colors duration-100 hover:text-ink-2 hover:decoration-current"
                style={{ animation: `fade-in 300ms ease-out ${diffs.length * 80}ms both` }}
              >
                +1 more
              </button>
            </div>
          )}
        </div>
      </div>

      {/* hovering a file chip opens its diff — green added, red removed */}
      {preview && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-50 w-72 overflow-hidden rounded-[10px] bg-surface shadow-overlay"
          style={{
            left: preview.x,
            top: preview.top,
            bottom: preview.bottom,
            animation: 'pop-in 160ms cubic-bezier(0.23,1,0.32,1) both',
            transformOrigin: preview.top === undefined ? 'bottom left' : 'top left',
          }}
        >
          <div className="flex items-center justify-between border-b border-line px-2.5 py-1.5 font-mono text-[11px]">
            <span className="min-w-0 truncate text-ink-2">{preview.file}</span>
            <span className="shrink-0 tabular-nums">
              <span className="text-green">+{diffs.find((diff) => diff.file === preview.file)?.add}</span>
              {(diffs.find((diff) => diff.file === preview.file)?.del ?? 0) > 0 && (
                <span className="text-red"> −{diffs.find((diff) => diff.file === preview.file)?.del}</span>
              )}
            </span>
          </div>
          <div className="py-1 font-mono text-[11px] leading-[1.8]">
            {(diffLines[preview.file] ?? []).map((line, index) => (
              <div
                key={index}
                className={`flex gap-2 px-2.5 whitespace-pre ${
                  line.tone === 'add' ? 'bg-green-tint text-green' : line.tone === 'del' ? 'bg-red-tint text-red' : 'text-ink-2'
                }`}
              >
                <span className="w-3 shrink-0 select-none">{line.tone === 'add' ? '+' : line.tone === 'del' ? '−' : ' '}</span>
                <span className="min-w-0 truncate">{line.text}</span>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Misc UI atoms                                                       */
/* ------------------------------------------------------------------ */

/* Simple markdown-ish renderer: **bold** + line breaks */
const StreamText: React.FC<{ text: string; streaming: boolean }> = ({ text, streaming }) => {
  const lines = text.split('\n');
  const cursor = <span className="inline-block w-[2px] h-4 bg-zinc-800 align-middle animate-pulse" />;
  return (
    <p className="whitespace-pre-wrap break-words">
      {lines.map((line, li) => {
        const isLast = li === lines.length - 1;
        return (
          <React.Fragment key={li}>
            {line.split(/(\*\*[^*]+\*\*)/g).map((seg, si) =>
              seg.startsWith('**') && seg.endsWith('**') ? (
                <strong key={si} className="font-semibold text-zinc-900">
                  {seg.slice(2, -2)}
                </strong>
              ) : (
                <React.Fragment key={si}>{seg}</React.Fragment>
              )
            )}
            {!isLast && <br />}
            {isLast && streaming && cursor}
          </React.Fragment>
        );
      })}
    </p>
  );
};

/* Artifact chip (context-card style) */
const ArtifactChip: React.FC<{ title: string; description: string; onOpen: () => void }> = ({ title, description, onOpen }) => (
  <button
    onClick={onOpen}
    className="group w-full text-left rounded-2xl border border-zinc-200/70 bg-white p-4 hover:border-zinc-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all"
  >
    <div className="flex items-center gap-2.5">
      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900/[0.04] text-sm">📊</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-zinc-800 truncate group-hover:underline">{title}</p>
        <p className="text-[11px] text-zinc-400 truncate">{description}</p>
      </div>
      <span className="text-[11px] text-zinc-400 group-hover:text-zinc-600 transition-colors">Open ↗</span>
    </div>
  </button>
);

/* ------------------------------------------------------------------ */
/* Prompt bar (beautifului.dev Prompt Bar style, adapted)               */
/* ------------------------------------------------------------------ */

const PIcon: React.FC<{ children: React.ReactNode; size?: number; strokeWidth?: number }> = ({ children, size = 15, strokeWidth = 1.8 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const P_GLYPHS: Record<string, React.ReactNode> = {
  clip: (
    <path d="m21.4 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  ),
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  layers: (
    <g>
      <path d="M12 2 2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
    </g>
  ),
  globe: (
    <g>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </g>
  ),
};

/** the last @word or /word being typed, if any */
function parseToken(draft: string): { kind: 'at' | 'slash'; query: string; start: number } | null {
  const match = /(^|\s)([@/])([\w-]*)$/.exec(draft);
  if (!match) return null;
  return { kind: match[2] === '@' ? 'at' : 'slash', query: match[3].toLowerCase(), start: match.index + match[1].length };
}

const PromptBar: React.FC<{ placeholder?: string; onSend?: (text: string) => void; busy?: boolean }> = ({
  placeholder,
  onSend,
  busy,
}) => {
  const [draft, setDraft] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [model, setModel] = useState(PROMPT_MODELS[1]);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [listening, setListening] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [rowBox, setRowBox] = useState<{ top: number; height: number } | null>(null);
  const [engaged, setEngaged] = useState(false);
  const [modelBox, setModelBox] = useState<{ top: number; height: number } | null>(null);
  const [modelHovered, setModelHovered] = useState<number | null>(null);
  const composerAnchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const modelRef = useRef<HTMLButtonElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const modelRowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [modelMenuLeft, setModelMenuLeft] = useState(0);
  const [modelMenuBottom, setModelMenuBottom] = useState(0);

  const token = dismissed ? null : parseToken(draft);
  const menu: 'at' | 'slash' | null = plusOpen ? 'at' : token?.kind ?? null;
  const query = plusOpen ? '' : token?.query ?? '';

  const rows: { key: string; name: string; desc: string }[] =
    menu === 'at'
      ? PROMPT_SOURCES.filter((s) => s.name.toLowerCase().includes(query))
      : menu === 'slash'
        ? PROMPT_COMMANDS.filter((c) => c.name.slice(1).startsWith(query))
        : [];

  useEffect(() => {
    setActive(0);
    setEngaged(false);
  }, [menu, query]);

  /* single gliding highlight for the @ / slash menu */
  useEffect(() => {
    const target = rowRefs.current[active];
    if (target) setRowBox({ top: target.offsetTop, height: target.offsetHeight });
  }, [menu, query, active, rows.length]);

  /* gliding highlight in the model menu */
  const modelIndex = PROMPT_MODELS.findIndex((m) => m.key === model.key);
  useEffect(() => {
    if (!modelOpen) return;
    const target = modelRowRefs.current[modelHovered ?? modelIndex];
    if (target) setModelBox({ top: target.offsetTop, height: target.offsetHeight });
  }, [modelOpen, modelHovered, modelIndex]);

  /* align the model menu to its trigger by measurement */
  useEffect(() => {
    if (!modelOpen || !composerAnchorRef.current || !modelRef.current) return;
    const anchorRect = composerAnchorRef.current.getBoundingClientRect();
    const triggerRect = modelRef.current.getBoundingClientRect();
    setModelMenuLeft(Math.max(0, Math.min(triggerRect.left - anchorRect.left, anchorRect.width - 176)));
    setModelMenuBottom(anchorRect.bottom - triggerRect.top + 8);
  }, [modelOpen, expanded, model.name]);

  useEffect(() => {
    if (!modelOpen) setModelHovered(null);
  }, [modelOpen]);

  /* dictation resolves after a beat, like a real transcript landing */
  useEffect(() => {
    if (!listening) return;
    const t = setTimeout(() => {
      setDraft((current) => (current ? `${current.trimEnd()} ${DICTATION_TEXT}` : DICTATION_TEXT));
      setListening(false);
      inputRef.current?.focus();
    }, 2200);
    return () => clearTimeout(t);
  }, [listening]);

  /* grow the textarea with content, wrap to a second row when needed */
  useEffect(() => {
    const input = inputRef.current;
    const measure = measureRef.current;
    if (!input) return;
    if (measure) {
      const needsFullWidth = draft.includes('\n') || measure.offsetWidth + 40 > input.offsetWidth;
      if (needsFullWidth !== expanded) setExpanded(needsFullWidth);
    }
    const minHeight = 28;
    const maxHeight = 100;
    input.style.height = '0px';
    const contentHeight = input.scrollHeight;
    input.style.height = `${Math.min(Math.max(contentHeight, minHeight), maxHeight)}px`;
    input.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';
  }, [draft, expanded]);

  /* clicking anywhere outside the composer closes the open menus */
  useEffect(() => {
    if (!modelOpen && !plusOpen) return;
    const close = (event: PointerEvent) => {
      if (!(event.target as Element).closest('[data-promptbar]')) {
        setModelOpen(false);
        setPlusOpen(false);
      }
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [modelOpen, plusOpen]);

  const closeMenus = () => {
    setPlusOpen(false);
    setModelOpen(false);
  };

  const pick = (row: { key: string; name: string }) => {
    const source = PROMPT_SOURCES.find((s) => s.key === row.key);
    if (source?.attach) {
      setAttachments((current) => [...current, ATTACH_FILES[current.length % ATTACH_FILES.length]]);
      if (token) setDraft(draft.slice(0, token.start));
    } else if (menu === 'at') {
      setDraft(`${token ? draft.slice(0, token.start) : draft}@${row.name} `);
    } else {
      setDraft(`${token ? draft.slice(0, token.start) : draft}${row.name} `);
    }
    setPlusOpen(false);
    setDismissed(false);
    inputRef.current?.focus();
  };

  const canSend = !busy && (draft.trim().length > 0 || attachments.length > 0);
  const send = () => {
    if (!canSend) return;
    onSend?.(draft.trim());
    setDraft('');
    setAttachments([]);
    closeMenus();
  };

  return (
    <div data-promptbar className="w-full">
      <div ref={composerAnchorRef} className="relative">
        {/* ── @ / slash menu ─────────────────────────── */}
        {menu && (
          <div
            onMouseLeave={() => setEngaged(false)}
            className="absolute inset-x-0 bottom-full z-20 mb-2 rounded-[10px] bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-zinc-200/70"
            style={{ animation: 'pop-in 180ms cubic-bezier(0.23,1,0.32,1) both', transformOrigin: 'bottom center' }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-1 rounded-[6px] bg-zinc-100"
              style={{
                top: rowBox?.top ?? 0,
                height: rowBox?.height ?? 0,
                opacity: rowBox && engaged && rows.length > 0 ? 1 : 0,
                transition: 'top 220ms cubic-bezier(0.23,1,0.32,1), height 220ms cubic-bezier(0.23,1,0.32,1), opacity 150ms ease',
              }}
            />
            {rows.map((row, i) => {
              const source = menu === 'at' ? PROMPT_SOURCES.find((s) => s.key === row.key) : undefined;
              return (
                <button
                  key={row.key}
                  type="button"
                  ref={(el) => {
                    rowRefs.current[i] = el;
                  }}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => {
                    setActive(i);
                    setEngaged(true);
                  }}
                  onClick={() => pick(row)}
                  className="relative z-10 flex h-9 w-full items-center gap-2.5 rounded-[6px] px-2 text-left"
                >
                  {source && (
                    <span className="flex size-5 shrink-0 items-center justify-center text-zinc-500">
                      <PIcon size={15}>{P_GLYPHS[source.glyph ?? 'clip']}</PIcon>
                    </span>
                  )}
                  <span className="shrink-0 text-[12.5px] font-medium text-zinc-800">{row.name}</span>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-zinc-400">{row.desc}</span>
                </button>
              );
            })}
            {rows.length === 0 && (
              <div className="flex h-9 items-center px-2 text-[12px] text-zinc-400">No matches for “{query}”</div>
            )}
            <div className="mt-1 border-t border-zinc-100 px-2 pt-1.5 pb-1 text-[11px] text-zinc-400">
              {menu === 'at' ? 'Type to search sources & files' : 'Type to search commands'}
            </div>
          </div>
        )}

        {/* ── model menu ─────────────────────────────── */}
        {modelOpen && (
          <div
            onMouseLeave={() => setModelHovered(null)}
            className="absolute z-20 w-44 rounded-[10px] bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-zinc-200/70"
            style={{
              left: modelMenuLeft,
              bottom: modelMenuBottom,
              animation: 'pop-in 180ms cubic-bezier(0.23,1,0.32,1) both',
              transformOrigin: 'bottom left',
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-1 rounded-[6px] bg-zinc-100"
              style={{
                top: modelBox?.top ?? 0,
                height: modelBox?.height ?? 0,
                opacity: modelBox && modelHovered !== null ? 1 : 0,
                transition: 'top 220ms cubic-bezier(0.23,1,0.32,1), height 220ms cubic-bezier(0.23,1,0.32,1), opacity 150ms ease',
              }}
            />
            {PROMPT_MODELS.map((m, i) => (
              <button
                key={m.key}
                type="button"
                ref={(el) => {
                  modelRowRefs.current[i] = el;
                }}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setModelHovered(i)}
                onClick={() => {
                  setModel(m);
                  setModelOpen(false);
                  inputRef.current?.focus();
                }}
                className="relative z-10 flex h-8 w-full items-center gap-2 rounded-[6px] px-2 text-left"
              >
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-zinc-800">{m.name}</span>
                <span className="shrink-0 text-[11px] text-zinc-400">{m.tag}</span>
                <span className={`shrink-0 text-zinc-800 ${m.key === model.key ? '' : 'invisible'}`}>
                  <PIcon size={13} strokeWidth={2.5}>
                    <path d="M20 6L9 17l-5-5" />
                  </PIcon>
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ── composer ─────────────────────────────── */}
        <div
          className={`relative flex flex-col overflow-hidden border border-zinc-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-[border-color,border-radius] duration-150 focus-within:border-zinc-400 gap-1.5 p-1.5 rounded-[14px]`}
        >
          <span ref={measureRef} aria-hidden className="pointer-events-none absolute invisible whitespace-pre text-[13px] leading-[18px]">
            {draft}
          </span>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-0.5 pt-0.5">
              {attachments.map((file, i) => (
                <span
                  key={`${file}-${i}`}
                  className="flex h-[22px] items-center gap-1.5 bg-zinc-100 border border-zinc-200/60 py-1 pr-1 pl-1.5 text-[11.5px] text-zinc-500 rounded-md"
                  style={{ animation: 'pop-in 200ms cubic-bezier(0.23,1,0.32,1) both' }}
                >
                  <PIcon size={12}>
                    <g>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path d="M14 2v6h6" />
                    </g>
                  </PIcon>
                  <span className="max-w-[9rem] truncate">{file}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${file}`}
                    onClick={() => setAttachments((current) => current.filter((_, j) => j !== i))}
                    className="-my-1 flex size-6 items-center justify-center text-zinc-400 transition-colors duration-100 hover:bg-zinc-200/70 hover:text-zinc-700 rounded-[5px]"
                  >
                    <PIcon size={10} strokeWidth={2.5}>
                      <path d="M18 6L6 18M6 6l12 12" />
                    </PIcon>
                  </button>
                </span>
              ))}
            </div>
          )}

          <div
            className={`grid items-end gap-x-1 gap-y-1.5 ${
              expanded ? 'grid-cols-[28px_auto_minmax(0,1fr)_28px_28px]' : 'grid-cols-[28px_minmax(0,1fr)_auto_28px_28px]'
            }`}
          >
            <button
              type="button"
              aria-label="Add attachments and sources"
              aria-expanded={plusOpen}
              onClick={() => {
                setModelOpen(false);
                setPlusOpen((current) => !current);
                inputRef.current?.focus();
              }}
              className={`flex size-7 shrink-0 items-center justify-center justify-self-start text-zinc-400 transition-[background-color,color,transform] duration-150 hover:bg-zinc-100 hover:text-zinc-700 active:scale-[0.94] rounded-[8px] ${
                plusOpen ? 'bg-zinc-100 text-zinc-700' : ''
              } ${expanded ? 'col-start-1 row-start-2' : 'col-start-1 row-start-1'}`}
            >
              <PIcon size={16} strokeWidth={2}>
                <path d="M12 5v14M5 12h14" />
              </PIcon>
            </button>

            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setDismissed(false);
                setPlusOpen(false);
              }}
              onKeyDown={(event) => {
                if (menu && rows.length > 0) {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    setEngaged(true);
                    setActive((current) => (current + (event.key === 'ArrowDown' ? 1 : rows.length - 1)) % rows.length);
                    return;
                  }
                  if ((event.key === 'Enter' && !event.shiftKey) || event.key === 'Tab') {
                    event.preventDefault();
                    pick(rows[active]);
                    return;
                  }
                }
                if (event.key === 'Escape') {
                  setDismissed(true);
                  closeMenus();
                  return;
                }
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder={listening ? 'Listening…' : placeholder ?? 'Write a message…'}
              aria-label="Prompt"
              className={`min-h-7 px-1 py-[5px] text-[13px] leading-[18px] min-w-0 w-full resize-none bg-transparent text-zinc-800 outline-none [overflow-wrap:anywhere] placeholder:text-zinc-400 ${
                expanded ? 'col-span-full col-start-1 row-start-1' : 'col-start-2 row-start-1'
              }`}
            />

            {/* model picker */}
            <button
              ref={modelRef}
              type="button"
              aria-expanded={modelOpen}
              aria-label="Choose model"
              onClick={() => {
                setPlusOpen(false);
                setModelOpen((current) => !current);
              }}
              className={`flex h-7 shrink-0 items-center gap-1 px-1.5 text-[12px] font-medium text-zinc-500 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-700 rounded-[8px] ${
                expanded ? 'col-start-2 row-start-2 justify-self-start' : 'col-start-3 row-start-1'
              }`}
            >
              {model.name}
              <span className="text-zinc-400">
                <PIcon size={11} strokeWidth={2.4}>
                  <path d="M6 9l6 6 6-6" />
                </PIcon>
              </span>
            </button>

            {/* dictation */}
            <button
              type="button"
              aria-label={listening ? 'Stop dictation' : 'Start dictation'}
              aria-pressed={listening}
              onClick={() => setListening((current) => !current)}
              className={`flex size-7 shrink-0 items-center justify-center transition-[background-color,color,transform] duration-150 active:scale-[0.94] rounded-[8px] ${
                listening ? 'bg-[#78d3f8]/20 text-[#3bb3e0]' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700'
              } ${expanded ? 'col-start-4 row-start-2' : 'col-start-4 row-start-1'}`}
            >
              {listening ? (
                <span className="flex h-3.5 items-center gap-[2.5px]">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-[2.5px] rounded-full bg-current"
                      style={{ height: '100%', animation: `eq-bounce 900ms ease-in-out ${i * 150}ms infinite` }}
                    />
                  ))}
                </span>
              ) : (
                <PIcon size={15} strokeWidth={2}>
                  <g>
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3" />
                  </g>
                </PIcon>
              )}
            </button>

            {/* send */}
            <button
              type="button"
              aria-label="Send"
              disabled={!canSend}
              onClick={send}
              className={`flex size-7 shrink-0 items-center justify-center transition-[background-color,color,transform] duration-200 enabled:active:scale-[0.94] rounded-[8px] ${
                expanded ? 'col-start-5 row-start-2' : 'col-start-5 row-start-1'
              }`}
              style={{
                background: canSend ? '#18181b' : '#e4e4e7',
                color: canSend ? '#fff' : '#a1a1aa',
                cursor: canSend ? undefined : 'not-allowed',
              }}
            >
              <PIcon size={16} strokeWidth={2.4}>
                <path d="M12 19V5M5 12l7-7 7 7" />
              </PIcon>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Chat panel — replays only when the user explicitly requests it.     */
/* ------------------------------------------------------------------ */

const ChatPanel: React.FC<{ onArtifact: (m: Message) => void; onRerun: () => void; replayKey: number }> = ({
  onArtifact,
  onRerun,
  replayKey,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { visible, streamingIdx, finished } = useSimulatedStream(PRESET_MESSAGES, onArtifact, replayKey);

  // Auto-scroll chat to bottom while streaming
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visible]);

  return (
    <>
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[640px]">
        <header className="flex items-center gap-2.5 px-5 py-3.5 border-b border-zinc-100">
          <span className="relative flex w-2 h-2">
            {!finished && <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />}
            <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm font-semibold text-zinc-800">{SESSION.name}</span>
          <span className="text-[11px] text-zinc-400 font-mono">{SESSION.path}</span>
          <button
            onClick={onRerun}
            className="ml-auto text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
          >
            ↻ Re-run
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-5 bg-gradient-to-b from-white to-zinc-50/40">
          {visible.map((msg, i) => {
            if (msg.role === 'user')
              return (
                <div key={i} className="flex flex-col items-end gap-1.5">
                  <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-zinc-900 text-white text-[13px] leading-relaxed shadow-sm">
                    {msg.text}
                  </div>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex max-w-full flex-wrap justify-end gap-1.5">
                      {msg.attachments.map((file, j) => {
                        const ext = file.slice(file.lastIndexOf('.') + 1).toUpperCase();
                        const tone = /XLS|CSV/.test(ext) ? 'bg-green' : /PDF/.test(ext) ? 'bg-red' : 'bg-ink-3';
                        return (
                          <span
                            key={file}
                            className="inline-flex h-6 items-center gap-1.5 rounded-full bg-inset px-2
                              text-[12px] font-medium text-ink-2 shadow-btn
                              transition-[background-color] duration-300 hover:bg-hover"
                            style={{ animation: `pop-in 200ms cubic-bezier(0.23,1,0.32,1) ${j * 80}ms both` }}
                          >
                            <span
                              className={`flex size-3.5 items-center justify-center rounded-[4px] ${tone} text-[7px] font-bold text-white`}
                            >
                              {ext}
                            </span>
                            <span className="min-w-0 truncate">{file}</span>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M7 17L17 7M7 7h10v10" />
                            </svg>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            return (
              <div key={i} className="space-y-3">
                <AgentRun msg={msg} live={streamingIdx === i ? msg.live : undefined} />
                <div className="text-[13.5px] leading-relaxed text-zinc-700">
                  <StreamText text={msg.text} streaming={streamingIdx === i} />
                </div>
                {msg.artifact && streamingIdx !== i && (
                  <ArtifactChip title={msg.artifact.title} description={msg.artifact.description} onOpen={() => onArtifact(msg)} />
                )}
              </div>
            );
          })}
        </div>

        <footer className="border-t border-zinc-50 px-5 py-4">
          <PromptBar
            placeholder={finished ? 'Demo complete — click Re-run to replay' : 'Agent is working…'}
            busy
          />
        </footer>
      </section>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Main Playground                                                      */
/* ------------------------------------------------------------------ */

const Playground: React.FC = () => {
  // Only an explicit replay starts another simulated run.
  const [replayKey, setReplayKey] = useState(0);
  const [artifactMsg, setArtifactMsg] = useState<Message | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const onArtifact = useCallback((m: Message) => {
    setArtifactMsg(m);
    setPanelOpen(true);
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-3">
          Playground <span className="text-[#78d3f8] ava-pulse">AVA</span> <span>✨</span>
        </h1>
        <p className="text-gray-500">A simulated codex-style agent run — tool chips, streaming, artifacts.</p>
      </div>

      <div
        className={`grid gap-6 transition-all duration-500 ${
          panelOpen && artifactMsg ? 'lg:grid-cols-[minmax(0,1fr)_460px]' : 'grid-cols-1'
        }`}
      >
        <ChatPanel
          key={replayKey}
          replayKey={replayKey}
          onArtifact={onArtifact}
          onRerun={() => {
            setArtifactMsg(null);
            setPanelOpen(false);
            setReplayKey((k) => k + 1);
          }}
        />

        {/* ---------------- Right artifact panel ---------------- */}
        {panelOpen && artifactMsg?.artifact && (
          <section
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-[640px]"
            style={{ animation: 'slide-in .4s ease-out' }}
            aria-label="Artifact panel"
          >
            <header className="flex items-center gap-2 px-5 py-3.5 border-b border-zinc-100">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-900/[0.05] text-xs font-mono">📄</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-800 truncate">{artifactMsg.artifact.title}</p>
                <p className="text-[11px] text-zinc-400 truncate">{artifactMsg.artifact.description}</p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                aria-label="Close panel"
              >
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-sm font-semibold text-zinc-700 mb-3">Interactive chart</p>
              <div className="h-[420px] rounded-xl border border-zinc-100 bg-gradient-to-b from-zinc-50/60 to-white">
                <GPTVisRenderer syntax={CHART_SYNTAX} />
              </div>
              <p className="text-[11px] text-zinc-400 mt-3 font-mono">{CHART_CAPTION}</p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default Playground;
