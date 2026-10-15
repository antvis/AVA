'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Message } from './types';

/** Show file changes with hover and keyboard-focus previews. */
export default function FileDiffs({
  diffs = [],
  diffLines = {},
  showMore = false,
}: Pick<Message, 'diffs' | 'diffLines'> & { showMore?: boolean }) {
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

  if (!diffs.length) return null;

  return (
    <>
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
        {showMore && (
          <button
            type="button"
            className="inline-flex h-7 items-center rounded-chip px-1.5 font-mono text-[11.5px] text-ink-3 underline decoration-transparent underline-offset-2 transition-colors duration-100 hover:text-ink-2 hover:decoration-current"
            style={{ animation: `fade-in 300ms ease-out ${diffs.length * 80}ms both` }}
          >
            +1 more
          </button>
        )}
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
    </>
  );
}
