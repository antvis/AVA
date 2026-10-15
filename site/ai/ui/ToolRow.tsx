'use client';

import React, { useState } from 'react';
import type { ToolStep } from './types';

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

/** Shared expandable row for live tools and demo playback. */
export default function ToolRow({
  icon,
  label,
  chip,
  mono,
  running,
  children,
}: Pick<ToolStep, 'icon' | 'label' | 'chip' | 'mono'> & { running: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ animation: 'fade-up 300ms cubic-bezier(0.23,1,0.32,1) both' }}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="group/row -mx-[3px] flex h-7 w-[calc(100%+6px)] min-w-0 items-center gap-2 rounded-control px-[3px] text-left transition-colors duration-100 hover:bg-hover-2"
      >
        <span className="relative flex size-4 shrink-0 items-center justify-center text-ink-3">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill={icon === 'think' ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-opacity duration-100 group-hover/row:opacity-0 ${open ? 'opacity-0' : ''} ${
              running ? 'animate-pulse text-ink' : ''
            }`}
          >
            {Icons[icon]}
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
              open ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
        <span className="shrink-0 text-[12.5px] font-medium text-ink">{label}</span>
        <span
          className={`inline-flex h-5.5 min-w-0 flex-1 cursor-pointer items-center truncate rounded-chip bg-field px-1.5
                    text-[11.5px] text-ink-2 shadow-hairline transition-colors duration-100 hover:bg-hover-2
                    ${mono ? 'font-mono' : ''}`}
        >
          {chip}
        </span>
      </button>

      {/* expanded detail */}
      <div
        className="grid transition-[grid-template-rows,opacity] duration-300"
        style={{
          gridTemplateRows: open ? '1fr' : '0fr',
          opacity: open ? 1 : 0,
          transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mt-0.5 mb-1 ml-2 flex flex-col gap-0.5 border-l border-line py-0.5 pl-3.5">{children}</div>
        </div>
      </div>
    </div>
  );
}
