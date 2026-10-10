'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import GPTVisRenderer from './GPTVisRenderer';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ToolDetailLine = { text: string; tone?: 'add' | 'del' | 'ctx' };
export type ToolStep = { icon: string; label: string; chip: string; mono?: boolean; detailMono?: boolean; detail: ToolDetailLine[] };
export type ToolDiff = { file: string; add: number; del?: number };
export type ToolDiffLine = { text: string; tone: 'add' | 'del' | 'ctx' };

interface Message {
  role: 'user' | 'assistant';
  text: string;
  steps?: ToolStep[];
  diffs?: ToolDiff[];
  diffLines?: Record<string, ToolDiffLine[]>;
  artifact?: { title: string; description: string; chart?: boolean };
}

/** Live playback state applied to a message as it streams in. */
interface LiveState {
  rowsShown?: number; // # of tool rows revealed so far
  runningRow?: number | null; // index of the row currently running
}

type LiveMessage = Message & { live?: LiveState };

/* ------------------------------------------------------------------ */
/* Fixture data — a simulated AVA agent run                            */
/* ------------------------------------------------------------------ */

const RUN_STEPS: ToolStep[] = [
  {
    icon: 'think',
    label: 'Thinking',
    chip: 'Planning the regional trend analysis…',
    detail: [{ text: 'Compare four regions across Jun–Sep on total sales.' }, { text: 'Keep profit in scope, but lead with the trend.' }],
  },
  {
    icon: 'read',
    label: 'Loaded sales dataset',
    chip: 'sales-2026.xlsx',
    mono: true,
    detail: [{ text: '12 rows · 4 columns — region, month, sales, profit' }, { text: 'Schema validated, no nulls in key fields.' }],
  },
  {
    icon: 'run',
    label: 'Wrote analysis program',
    chip: 'ava.analyze("regional trend")',
    mono: true,
    detailMono: true,
    detail: [
      { text: '+ const trend = groupBy(data, "region", sum("sales"))', tone: 'add' },
      { text: '+ const growth = delta(trend, "month")', tone: 'add' },
    ],
  },
  {
    icon: 'run',
    label: 'Executed javascript engine',
    chip: 'exit code 0',
    mono: true,
    detailMono: true,
    detail: [{ text: '✓ 48 records aggregated into 4 series' }, { text: '✓ chartable shape: month ÷ region stacked' }],
  },
  {
    icon: 'think',
    label: 'Selected chart type',
    chip: 'stacked bar, month × region',
    detail: [{ text: 'Monthly trend across regions reads best stacked.' }, { text: 'West dominates — call it out in the summary.' }],
  },
  {
    icon: 'write',
    label: 'Drafted report artifact',
    chip: 'regional-sales-report.md',
    mono: true,
    detail: [
      { text: '+ # Regional Sales Report — Jun–Sep 2026', tone: 'add' },
      { text: '+ West leads at 6,100 total sales, up strongly every month.', tone: 'add' },
    ],
  },
];

const RUN_DIFFS: ToolDiff[] = [
  { file: 'regional-sales-report.md', add: 18 },
  { file: 'chart-spec.json', add: 12 },
  { file: 'analysis.sql', add: 9 },
];

const RUN_DIFF_LINES: Record<string, ToolDiffLine[]> = {
  'regional-sales-report.md': [
    { text: '# Regional Sales Report — Jun–Sep 2026', tone: 'ctx' },
    { text: 'West leads at 6,100 total sales.', tone: 'add' },
    { text: 'South recovered from July, closed at 1,900.', tone: 'add' },
    { text: 'East grows steadily; North flattened.', tone: 'add' },
  ],
  'chart-spec.json': [
    { text: '"type": "bar",', tone: 'ctx' },
    { text: '"stack": true,', tone: 'add' },
    { text: '"encode": { "x": "month",', tone: 'add' },
    { text: '  "y": ["West","East","South","North"] }', tone: 'add' },
  ],
  'analysis.sql': [
    { text: 'SELECT region, month,', tone: 'ctx' },
    { text: '       SUM(sales) AS total_sales', tone: 'add' },
    { text: 'FROM sales_2026 GROUP BY 1, 2;', tone: 'add' },
  ],
};

const ASSISTANT_TEXT = `I analyzed the sales dataset (12 rows across 4 regions). Here's what stands out:\n\n- **West** is the clear leader — 6,100 in total sales, up strongly June→Sep.\n- **South** recovered from a July dip and closed at its highest point (1,900).\n- **East** shows healthy, steady growth every single month.\n- **North** flattened out in Aug–Sep after a fast start.\n\nI've saved the full report and chart as an artifact.`;

const PRESET_MESSAGES: Message[] = [
  { role: 'user', text: 'Analyze the sales data and show me the regional trend.' },
  {
    role: 'assistant',
    steps: RUN_STEPS,
    diffs: RUN_DIFFS,
    diffLines: RUN_DIFF_LINES,
    text: ASSISTANT_TEXT,
    artifact: { title: 'regional-sales-report.md', description: 'Sales & profit by region, Jun–Sep 2026 · stacked bar trend', chart: true },
  },
];

/** GPT-vis markdown syntax for a stacked bar chart. */
const CHART_SYNTAX = [
  '```vis-chart',
  JSON.stringify(
    {
      type: 'bar',
      data: [
        { month: 'Jun', West: 1200, East: 900, South: 700, North: 1000 },
        { month: 'Jul', West: 1500, East: 1000, South: 600, North: 1400 },
        { month: 'Aug', West: 1600, East: 1100, South: 1000, North: 1450 },
        { month: 'Sep', West: 1800, East: 1250, South: 1900, North: 1450 },
      ],
      encode: { x: 'month', y: ['West', 'East', 'South', 'North'] },
      stack: true,
      axis: [{ orient: 'left', title: { visible: true, text: 'Sales' } }, { orient: 'bottom', grid: 'line' }],
    },
    null,
    2
  ),
  '```',
].join('\n');

/* ------------------------------------------------------------------ */
/* Streaming engine                                                    */
/* ------------------------------------------------------------------ */

const CHUNK_MS = 24;

function useSimulatedStream(messages: Message[], onArtifact: (m: Message) => void) {
  const [visible, setVisible] = useState<LiveMessage[]>([]);
  const [streamingIdx, setStreamingIdx] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const onArtifactRef = useRef(onArtifact);
  onArtifactRef.current = onArtifact;

  useEffect(() => {
    let cancelled = false;

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

    const patchLive = (patch: LiveState) => {
      setVisible((v) => {
        const copy = [...v];
        const i = copy.length - 1;
        copy[i] = { ...copy[i], live: { ...(copy[i].live ?? {}), ...patch } };
        return copy;
      });
    };

    const beginTextStream = (msg: Message, msgIdx: number) => {
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
    const playRowsThenText = (msg: Message, msgIdx: number) => {
      const total = msg.steps?.length ?? 0;

      const idx = { i: 0 };
      const playRow = () => {
        if (cancelled) return;
        if (idx.i >= total) {
          patchLive({ runningRow: null });
          track(setTimeout(() => beginTextStream(msg, msgIdx), 350));
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
      if (cancelled || msgIdx >= messages.length) {
        setStreamingIdx(null);
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
        { ...msg, text: msg.steps ? '' : msg.text, live: { rowsShown: msg.steps ? 0 : undefined, runningRow: null } },
      ]);
      setStreamingIdx(msgIdx);

      if (msg.steps && msg.steps.length > 0) {
        track(setTimeout(() => playRowsThenText(msg, msgIdx), 300));
      } else {
        track(setTimeout(() => beginTextStream(msg, msgIdx), 200));
      }
    };

    track(setTimeout(playNextMessage, 500));

    return cancelAll;
  }, [messages]);

  return { visible, streamingIdx };
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
    <div className="w-full pb-1">
      {/* collapsed run header */}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((c) => !c)}
        className="-mx-1.5 flex w-fit items-center gap-1.5 rounded-md px-1.5 py-1 text-[12.5px] text-zinc-500 transition-colors duration-100 hover:bg-zinc-100/70"
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
                    className="group/row -mx-[3px] flex h-7 w-[calc(100%+6px)] min-w-0 items-center gap-2 rounded-md px-[3px] text-left transition-colors duration-100 hover:bg-zinc-100/70"
                  >
                    <span className="relative flex size-4 shrink-0 items-center justify-center text-zinc-400">
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
                          isRunning ? 'animate-pulse text-zinc-700' : ''
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
                    <span className={`shrink-0 text-[12.5px] font-medium ${isRunning ? 'text-zinc-900' : 'text-zinc-800'}`}>{row.label}</span>
                    <span
                      className={`inline-flex h-[22px] min-w-0 flex-1 cursor-pointer items-center truncate rounded-md bg-zinc-100 px-1.5 text-[11.5px] text-zinc-500 border border-zinc-200/60 transition-colors duration-100 hover:bg-zinc-100 ${
                        row.mono ? 'font-mono' : ''
                      }`}
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
                      <div className="mt-0.5 mb-1 ml-2 flex flex-col gap-0.5 border-l border-zinc-200/80 py-0.5 pl-3.5">
                        {row.detail.map((line) => (
                          <span
                            key={line.text}
                            className={`truncate text-[11.5px] leading-[1.6] ${row.detailMono ? 'font-mono' : ''} ${
                              line.tone === 'add' ? 'text-emerald-600' : line.tone === 'del' ? 'text-red-500' : 'text-zinc-500'
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
            <div className="mt-2.5 flex max-w-full flex-wrap gap-1.5 border-t border-zinc-200/70 pt-2.5">
              {diffs.map((d, i) => (
                <span key={d.file} data-diffchip className="relative" onMouseEnter={openPreview(d.file)} onMouseLeave={closePreview(d.file)}>
                  <button
                    type="button"
                    aria-expanded={preview?.file === d.file}
                    aria-label={`Show diff for ${d.file}`}
                    onFocus={openPreview(d.file)}
                    onBlur={closePreview(d.file)}
                    className="inline-flex h-7 max-w-full items-center gap-2 rounded-md bg-white px-2 font-mono text-[11.5px] text-zinc-700 border border-zinc-200/70 shadow-sm transition-colors duration-100 hover:bg-zinc-50"
                    style={{ animation: `pop-in 250ms cubic-bezier(0.23,1,0.32,1) ${i * 80}ms both` }}
                  >
                    <span className="min-w-0 truncate">{d.file}</span>
                    <span className="shrink-0 text-emerald-600 tabular-nums">+{d.add}</span>
                    {(d.del ?? 0) > 0 && <span className="shrink-0 text-red-500 tabular-nums">−{d.del}</span>}
                  </button>
                </span>
              ))}
              <button
                type="button"
                className="inline-flex h-7 items-center rounded-md px-1.5 font-mono text-[11.5px] text-zinc-400 underline decoration-transparent underline-offset-2 transition-colors duration-100 hover:text-zinc-500 hover:decoration-current"
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
          className="fixed z-50 w-72 overflow-hidden rounded-[10px] bg-white border border-zinc-200/80 shadow-lg"
          style={{
            left: preview.x,
            top: preview.top,
            bottom: preview.bottom,
            animation: 'pop-in 160ms cubic-bezier(0.23,1,0.32,1) both',
            transformOrigin: preview.top === undefined ? 'bottom left' : 'top left',
          }}
        >
          <div className="flex items-center justify-between border-b border-zinc-200/80 px-2.5 py-1.5 font-mono text-[11px]">
            <span className="min-w-0 truncate text-zinc-500">{preview.file}</span>
            <span className="shrink-0 tabular-nums">
              <span className="text-emerald-600">+{diffs.find((diff) => diff.file === preview.file)?.add}</span>
              {(diffs.find((diff) => diff.file === preview.file)?.del ?? 0) > 0 && (
                <span className="text-red-500"> −{diffs.find((diff) => diff.file === preview.file)?.del}</span>
              )}
            </span>
          </div>
          <div className="py-1 font-mono text-[11px] leading-[1.8]">
            {(diffLines[preview.file] ?? []).map((line, index) => (
              <div
                key={index}
                className={`flex gap-2 px-2.5 whitespace-pre ${
                  line.tone === 'add' ? 'bg-emerald-50 text-emerald-700' : line.tone === 'del' ? 'bg-red-50 text-red-500' : 'text-zinc-500'
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
/* Chat panel — owns one simulated run lifetime. Remounting (key change)
 * restarts the playback from scratch; once finished it stays finished
 * (no auto-loop) until the user clicks Re-run.                       */
/* ------------------------------------------------------------------ */

const ChatPanel: React.FC<{ onArtifact: (m: Message) => void; onRerun: () => void }> = ({ onArtifact, onRerun }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { visible, streamingIdx } = useSimulatedStream(PRESET_MESSAGES, onArtifact);
  const streamingFinished = streamingIdx === null && visible.length === PRESET_MESSAGES.length;

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
            <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm font-semibold text-zinc-800">ava-session</span>
          <span className="text-[11px] text-zinc-400 font-mono">~/.playground/sales-analysis</span>
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
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-zinc-900 text-white text-[13px] leading-relaxed shadow-sm">
                    {msg.text}
                  </div>
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

        <footer className="border-t border-zinc-100 px-5 py-4">
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 focus-within:border-zinc-400 transition-colors px-4 py-2.5">
            <input
              type="text"
              placeholder={streamingFinished ? 'Ask a follow-up…' : 'Agent is working…'}
              disabled
              className="flex-1 bg-transparent text-sm text-zinc-700 placeholder:text-zinc-400 outline-none"
            />
            <span className="text-[11px] font-mono text-zinc-300">@ data</span>
            <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-900 text-white disabled:bg-zinc-200 transition-colors" disabled>
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M8 13V3m0 0L4 7m4-4l4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </footer>
      </section>
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Main Playground                                                      */
/* ------------------------------------------------------------------ */

const Playground: React.FC = () => {
  // bumping replayKey remounts ChatPanel → a fresh simulated run
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
        <ChatPanel key={replayKey} onArtifact={onArtifact} onRerun={() => setReplayKey((k) => k + 1)} />

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
              <p className="text-[11px] text-zinc-400 mt-3 font-mono">generated by ava.visualize · gpt-vis · stacked bar</p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default Playground;
