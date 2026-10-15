'use client';

import type React from 'react';

const ArtifactChip: React.FC<{ title: string; description: string; onOpen: () => void }> = ({
  title,
  description,
  onOpen,
}) => (
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

export default ArtifactChip;
