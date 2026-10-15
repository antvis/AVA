'use client';

import { useEffect, useState } from 'react';

const delays = Array.from({ length: 9 }, (_, index) => {
  const row = Math.floor(index / 3);
  return ((index % 3) + Math.abs(row - 1)) * 90;
});

export default function ResponseLoading() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = performance.now();
    const timer = window.setInterval(() => setElapsed((performance.now() - started) / 1000), 100);
    return () => window.clearInterval(timer);
  }, []);

  const duration =
    elapsed < 60 ? `${elapsed.toFixed(1)}s` : `${Math.floor(elapsed / 60)}m ${(elapsed % 60).toFixed(1)}s`;

  return (
    <div role="status" className="flex w-fit items-center gap-2 py-0.5">
      <span className="sr-only">Generating response</span>
      <span aria-hidden="true" className="grid shrink-0 grid-cols-[repeat(3,3px)] gap-px">
        {delays.map((delay, index) => (
          <span
            key={index}
            className="response-loading-pixel size-[3px] rounded-[0.5px] bg-ink"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      <span aria-hidden="true" className="response-loading-label text-xs">
        Responding…
      </span>
      <span aria-hidden="true" className="font-mono text-[11px] tabular-nums text-ink-3">
        {duration}
      </span>
    </div>
  );
}
