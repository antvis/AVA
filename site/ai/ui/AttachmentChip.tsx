'use client';

import type React from 'react';

const AttachmentChip: React.FC<{ file: string; rowCount?: number; animationDelay?: number }> = ({
  file,
  rowCount,
  animationDelay,
}) => {
  const ext = file.slice(file.lastIndexOf('.') + 1).toUpperCase();
  const tone = /XLS|CSV/.test(ext) ? 'bg-green' : /PDF/.test(ext) ? 'bg-red' : 'bg-ink-3';
  return (
    <span
      className="inline-flex h-6 max-w-full items-center gap-1.5 rounded-full bg-inset px-2 text-[12px] font-medium text-ink-2 shadow-btn transition-[background-color] duration-300 hover:bg-hover"
      title={file}
      style={
        animationDelay === undefined
          ? undefined
          : { animation: `pop-in 200ms cubic-bezier(0.23,1,0.32,1) ${animationDelay}ms both` }
      }
    >
      <span
        aria-hidden="true"
        className={`flex size-3.5 shrink-0 items-center justify-center rounded-[4px] ${tone} text-[7px] font-bold text-white`}
      >
        {ext}
      </span>
      <span className="min-w-0 truncate">{file}</span>
      {rowCount !== undefined && (
        <span className="shrink-0 text-[11px] font-normal tabular-nums">
          · {rowCount.toLocaleString()} {rowCount === 1 ? 'row' : 'rows'}
        </span>
      )}
      <svg
        aria-hidden="true"
        className="shrink-0"
        width="9"
        height="9"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 17L17 7M7 7h10v10" />
      </svg>
    </span>
  );
};

export default AttachmentChip;
