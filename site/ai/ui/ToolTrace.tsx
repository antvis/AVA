'use client';

import React, { useState } from 'react';
import type { Message } from './types';
import ToolRow from './ToolRow';
import FileDiffs from './FileDiffs';

const ToolTrace: React.FC<{ msg: Message; live: Message['live'] }> = ({ msg, live }) => {
  const steps = msg.steps ?? [];
  const shown = live?.rowsShown ?? steps.length;
  const running = typeof live?.runningRow === 'number' ? live.runningRow : null;
  const allRowsDone = shown >= steps.length && running === null;
  const [open, setOpen] = useState(true);

  if (!steps.length) return null;

  const headerText =
    running !== null ? `${steps.length} tool calls — running…` : `${steps.length} tool calls, 1 message`;

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
          <div className="flex flex-col gap-1 mt-1.5">
            {steps.slice(0, shown).map((row, i) => (
              <ToolRow
                key={row.id ?? row.label}
                {...row}
                chip={`${row.chip}${row.state ? ` · ${row.state}` : ''}`}
                running={running === i}
              >
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
              </ToolRow>
            ))}
          </div>

          {allRowsDone && <FileDiffs diffs={msg.diffs} diffLines={msg.diffLines} showMore />}
        </div>
      </div>
    </div>
  );
};

export default ToolTrace;
