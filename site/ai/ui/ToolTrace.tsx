'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Message } from './types';

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

const ToolTrace: React.FC<{
  msg: Message;
  live: Message['live'];
  inline?: boolean;
  detail?: React.ReactNode;
}> = ({ msg, live, inline, detail }) => {
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

  const headerText =
    running !== null ? `${steps.length} tool calls — running…` : `${steps.length} tool calls, 1 message`;

  return (
    <div className={inline ? 'w-full' : 'min-h-[220px] w-full pb-1'}>
      {/* collapsed run header */}
      {!inline && (
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
      )}

      {/* tool call rows */}
      <div
        className="grid transition-[grid-template-rows,opacity] duration-300"
        style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}
      >
        <div className={`-mx-1 overflow-hidden px-1.5 ${inline ? '' : 'pb-1'}`}>
          <div className={`flex flex-col gap-1 ${inline ? '' : 'mt-1.5'}`}>
            {steps.slice(0, shown).map((row, i) => {
              const rowOpen = openRows.has(row.id ?? row.label);
              const isRunning = running === i;
              return (
                <div key={row.id ?? row.label} style={{ animation: 'fade-up 300ms cubic-bezier(0.23,1,0.32,1) both' }}>
                  <button
                    type="button"
                    aria-expanded={rowOpen}
                    onClick={() => toggleRow(row.id ?? row.label)}
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
                        className={`transition-opacity duration-100 group-hover/row:opacity-0 ${
                          rowOpen ? 'opacity-0' : ''
                        } ${isRunning ? 'animate-pulse text-ink' : ''}`}
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
                      {row.state ? ` · ${row.state}` : ''}
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
                        {detail ??
                          row.detail.map((line) => (
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
                <span
                  key={d.file}
                  data-diffchip
                  className="relative"
                  onMouseEnter={openPreview(d.file)}
                  onMouseLeave={closePreview(d.file)}
                >
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
              {!inline && (
                <button
                  type="button"
                  className="inline-flex h-7 items-center rounded-chip px-1.5 font-mono text-[11.5px] text-ink-3 underline decoration-transparent underline-offset-2 transition-colors duration-100 hover:text-ink-2 hover:decoration-current"
                  style={{ animation: `fade-in 300ms ease-out ${diffs.length * 80}ms both` }}
                >
                  +1 more
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* hovering a file chip opens its diff — green added, red removed */}
      {preview &&
        typeof document !== 'undefined' &&
        createPortal(
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
                    line.tone === 'add'
                      ? 'bg-green-tint text-green'
                      : line.tone === 'del'
                      ? 'bg-red-tint text-red'
                      : 'text-ink-2'
                  }`}
                >
                  <span className="w-3 shrink-0 select-none">
                    {line.tone === 'add' ? '+' : line.tone === 'del' ? '−' : ' '}
                  </span>
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

export default ToolTrace;
