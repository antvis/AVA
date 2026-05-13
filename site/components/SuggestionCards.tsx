'use client';
import React, { useState } from 'react';
import type { SuggestResult } from '@antv/ava';

interface SuggestionCardsProps {
  suggestions: SuggestResult[];
  onSelect: (query: string) => void;
  onDismiss: () => void;
}

const SuggestionCards: React.FC<SuggestionCardsProps> = ({ suggestions, onSelect, onDismiss }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (suggestions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      {suggestions.map((s, i) => (
        <div key={s.query} className="relative flex">
          <button
            type="button"
            onClick={() => { onSelect(s.query); onDismiss(); }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="h-full w-full text-left px-3.5 py-3 bg-white hover:bg-gradient-to-br hover:from-[#78d3f8]/8 hover:to-[#e8f8ff] border border-gray-200/80 hover:border-[#78d3f8]/40 rounded-xl transition-all duration-200 cursor-pointer group shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(120,211,248,0.15)]"
          >
            <div aria-hidden="true" className="flex items-start gap-2">
              <span className="shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded-md bg-[#78d3f8]/10 text-[11px] group-hover:bg-[#78d3f8]/20 transition-colors">💡</span>
              <span className="text-[13px] text-gray-600 group-hover:text-[#0c8fb4] leading-relaxed transition-colors line-clamp-2">{s.query}</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <div className="flex-1 h-[3px] bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(s.score * 100)}%`, background: 'linear-gradient(90deg, #78d3f8, #4ec4ef)' }}
                />
              </div>
              <span className="text-[10px] font-semibold text-gray-300 group-hover:text-[#78d3f8] transition-colors tabular-nums">{Math.round(s.score * 100)}%</span>
            </div>
          </button>
          {hoveredIdx === i && s.reason && (
            <div className="absolute z-30 left-1/2 -translate-x-1/2 bottom-[calc(100%+8px)] w-max max-w-[260px] px-3 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-[11px] leading-relaxed rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.18)] pointer-events-none" style={{ animation: 'fadeInUp 150ms ease-out' }}>
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-gray-900/95" />
              {s.reason}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SuggestionCards;
