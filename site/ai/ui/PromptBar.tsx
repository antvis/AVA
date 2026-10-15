'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { LivePlayground } from './types';
import { parseToken } from './utils';
import { PROMPT_SOURCES, PROMPT_COMMANDS, PROMPT_MODELS, ATTACH_FILES, DICTATION_TEXT } from '../constants';

const PIcon: React.FC<{ children: React.ReactNode; size?: number; strokeWidth?: number }> = ({
  children,
  size = 15,
  strokeWidth = 1.8,
}) => (
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

const PromptBar: React.FC<{
  placeholder?: string;
  onSend?: (text: string) => void;
  busy?: boolean;
  onRerun?: () => void;
  replayReady?: boolean;
  live?: LivePlayground;
}> = ({ placeholder, onSend, busy, onRerun, replayReady, live }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const sources = live
    ? [{ key: 'attach', name: 'Add data files', desc: 'CSV, Excel or JSON', glyph: 'clip', attach: true }]
    : PROMPT_SOURCES;
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
      ? sources.filter((s) => s.name.toLowerCase().includes(query))
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
    const grid = input.parentElement;
    if (measure && grid) {
      // Measure the collapsed row, so expanding the input cannot reverse the decision.
      const controls = Array.from(grid.querySelectorAll<HTMLButtonElement>(':scope > button'));
      const controlsWidth = controls.reduce((width, control) => width + control.offsetWidth, 0);
      const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
      const inlineWidth = grid.clientWidth - controlsWidth - gap * controls.length;
      const needsFullWidth = draft.includes('\n') || measure.offsetWidth + 40 > inlineWidth;
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
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModelOpen(false);
        setPlusOpen(false);
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [modelOpen, plusOpen]);

  const closeMenus = () => {
    setPlusOpen(false);
    setModelOpen(false);
  };

  const pick = (row: { key: string; name: string }) => {
    const source = sources.find((s) => s.key === row.key);
    if (source?.attach) {
      if (live) fileRef.current?.click();
      else setAttachments((current) => [...current, ATTACH_FILES[current.length % ATTACH_FILES.length]]);
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
    if (live && !live.ready) {
      closeMenus();
      live.onConfigure();
      return;
    }
    onSend?.(draft.trim());
    setDraft('');
    setAttachments([]);
    closeMenus();
  };

  return (
    <div data-promptbar className="w-full">
      {live && (
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.xlsx,.json"
          className="hidden"
          aria-label="Upload dataset"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) live.onAttach(file);
            event.target.value = '';
          }}
        />
      )}
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
                transition:
                  'top 220ms cubic-bezier(0.23,1,0.32,1), height 220ms cubic-bezier(0.23,1,0.32,1), opacity 150ms ease',
              }}
            />
            {rows.map((row, i) => {
              const source = menu === 'at' ? sources.find((s) => s.key === row.key) : undefined;
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
            {!(live && menu === 'at') && (
              <div className="mt-1 border-t border-zinc-100 px-2 pt-1.5 pb-1 text-[11px] text-zinc-400">
                {menu === 'at' ? 'Type to search sources & files' : 'Type to search commands'}
              </div>
            )}
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
                transition:
                  'top 220ms cubic-bezier(0.23,1,0.32,1), height 220ms cubic-bezier(0.23,1,0.32,1), opacity 150ms ease',
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
          className={`relative flex flex-col overflow-hidden bg-zinc-50 transition-[border-radius] duration-150 gap-1.5 p-1.5 rounded-[14px]`}
        >
          <span
            ref={measureRef}
            aria-hidden
            className="pointer-events-none absolute invisible whitespace-pre text-[13px] leading-[18px]"
          >
            {draft}
          </span>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-0.5 pt-0.5">
              {attachments.map((file, i) => (
                <span
                  key={`${file}-${i}`}
                  className="flex h-[22px] items-center gap-1.5 bg-zinc-200/70 py-1 pr-1 pl-1.5 text-[11.5px] text-zinc-500 rounded-md"
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
              expanded
                ? 'grid-cols-[28px_auto_minmax(0,1fr)_28px_28px]'
                : 'grid-cols-[28px_minmax(0,1fr)_auto_28px_28px]'
            }`}
          >
            <button
              type="button"
              aria-label="Add attachments and sources"
              disabled={!!live && busy}
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
              disabled={!!live && busy}
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
              aria-expanded={live ? undefined : modelOpen}
              aria-haspopup={live ? 'dialog' : undefined}
              aria-label={live ? 'Model settings' : 'Choose model'}
              title={live ? 'Configure your model' : undefined}
              disabled={!!live && busy}
              onClick={() => {
                setPlusOpen(false);
                if (live) live.onConfigure();
                else setModelOpen((current) => !current);
              }}
              className={`flex h-7 max-w-[160px] shrink-0 items-center gap-1 rounded-[8px] bg-zinc-100 px-1.5 text-[12px] font-medium text-zinc-600 transition-colors duration-150 hover:bg-zinc-200/70 hover:text-zinc-800 ${
                expanded ? 'col-start-2 row-start-2 justify-self-start' : 'col-start-3 row-start-1'
              }`}
            >
              <span className="truncate">{live ? (live.ready ? live.model : 'Set up model') : model.name}</span>
              <span className="text-zinc-400">
                <PIcon size={11} strokeWidth={2.4}>
                  <path d="M6 9l6 6 6-6" />
                </PIcon>
              </span>
            </button>

            {/* new chat / demo dictation */}
            <button
              type="button"
              aria-label={live ? 'New chat' : listening ? 'Stop dictation' : 'Start dictation'}
              title={live ? 'New chat' : 'Dictation'}
              disabled={!!live && busy}
              aria-pressed={live ? undefined : listening}
              onClick={() => (live ? live.onReset() : setListening((current) => !current))}
              className={`flex size-7 shrink-0 items-center justify-center transition-[background-color,color,transform] duration-150 active:scale-[0.94] rounded-[8px] ${
                listening
                  ? 'bg-[color:var(--color-primary)]/20 text-ink'
                  : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700'
              } ${expanded ? 'col-start-4 row-start-2' : 'col-start-4 row-start-1'}`}
            >
              {live ? (
                <PIcon size={15}>
                  <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="m16 3 5 5M10 14l4-1 8-8a2.12 2.12 0 0 0-3-3l-8 8-1 4Z" />
                </PIcon>
              ) : listening ? (
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

            {/* send — doubles as re-run once the run is finished */}
            <button
              type="button"
              aria-label={onRerun && replayReady ? 'Re-run' : 'Send'}
              disabled={busy || (!onRerun && !replayReady && !canSend)}
              onClick={onRerun && replayReady ? onRerun : send}
              className={`flex size-7 shrink-0 items-center justify-center transition-[background-color,color,transform] duration-200 enabled:active:scale-[0.94] rounded-[8px] ${
                expanded ? 'col-start-5 row-start-2' : 'col-start-5 row-start-1'
              }`}
              style={{
                background: canSend || replayReady ? 'var(--color-primary)' : 'var(--color-line)',
                color: canSend || replayReady ? 'var(--color-ink)' : 'var(--color-ink-3)',
                cursor: canSend || replayReady ? undefined : 'not-allowed',
              }}
            >
              {onRerun && replayReady ? (
                <PIcon size={16} strokeWidth={2.4}>
                  <path d="M21 12a9 9 0 1 1-2.64-6.36" strokeLinecap="round" />
                  <path d="M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
                </PIcon>
              ) : (
                <PIcon size={16} strokeWidth={2.4}>
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </PIcon>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptBar;
