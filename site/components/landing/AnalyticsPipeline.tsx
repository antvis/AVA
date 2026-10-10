'use client';

import React, { useState } from 'react';
import Reveal from './Reveal';
import { SectionHeading } from './Section';

/* ------------------------------------------------------------------ */
/* Pipeline data — grounded in the real AVA SDK surface               */
/* ------------------------------------------------------------------ */

interface Stage {
  id: string;
  name: string;
  blurb: string;
  caption: string; // caption shown above the preview
}

const STAGES: Stage[] = [
  {
    id: 'connect',
    name: 'Connect',
    blurb: 'Access files and databases through a unified interface.',
    caption: 'ava.source({ type, options }) — CSV, JSON, Parquet, Excel, SQLite, MySQL, PostgreSQL…',
  },
  {
    id: 'understand',
    name: 'Understand',
    blurb: 'Explore schemas, data profiles, and statistical characteristics.',
    caption: 'ava.profile() — deterministic statistics, no LLM call required',
  },
  {
    id: 'analyze',
    name: 'Analyze',
    blurb: 'Execute queries and explore analytical questions with real data.',
    caption: 'ava.analyze(query) — SQL runs on a real engine, retries on execution errors',
  },
  {
    id: 'visualize',
    name: 'Visualize',
    blurb: 'Turn analytical results into meaningful visualizations.',
    caption: 'ava.visualize(result) — GPT-Vis chart syntax, exportable standalone HTML',
  },
];

/* ------------------------------------------------------------------ */
/* Stage previews — small hand-built technical vignettes              */
/* ------------------------------------------------------------------ */

const ConnectPreview: React.FC = () => {
  const rows = [
    { name: 'sales.csv', kind: 'CSV file', state: 'ready' },
    { name: 'report.xlsx', kind: 'Excel workbook', state: 'ready' },
    { name: 'inventory.db', kind: 'SQLite database', state: 'ready' },
    { name: 'prod-mysql', kind: 'MySQL · 12 tables', state: 'ready' },
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
        4 sources · schema discovered
      </div>
      {rows.map((r) => (
        <div
          key={r.name}
          className="flex items-center justify-between rounded-lg border border-zinc-200/80 bg-white px-3 py-2.5"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[color:var(--color-primary)]/15 font-mono text-[10px] font-semibold uppercase text-[color:var(--color-primary-dark)]">
              file
            </span>
            <div className="min-w-0">
              <div className="truncate font-mono text-[12.5px] text-zinc-800">{r.name}</div>
              <div className="text-[11px] text-zinc-400">{r.kind}</div>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-600">
            ready
          </span>
        </div>
      ))}
    </div>
  );
};

const UnderstandPreview: React.FC = () => {
  const fields = [
    { name: 'region', type: 'VARCHAR', bar: 0.86, note: '6 distinct' },
    { name: 'amount', type: 'DECIMAL', bar: 0.62, note: 'min 42 · max 9,120' },
    { name: 'date', type: 'DATE', bar: 0.44, note: '2025-01 → 2025-09' },
    { name: 'category', type: 'VARCHAR', bar: 0.9, note: 'top: Electronics' },
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400">
        <span>profile() · sales table</span>
        <span className="text-emerald-500">computed</span>
      </div>
      {/* tiny distribution chart */}
      <div className="flex h-12 items-end gap-1 rounded-lg border border-zinc-200/80 bg-white px-3 py-2">
        {[0.35, 0.6, 0.9, 0.75, 0.45, 0.65, 1, 0.8, 0.55, 0.7, 0.4, 0.5].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${h * 100}%`,
              background: i === 6 ? 'var(--color-primary-dark)' : 'color-mix(in srgb, var(--color-primary) 55%, white)',
            }}
          />
        ))}
      </div>
      {fields.map((f) => (
        <div
          key={f.name}
          className="flex items-center gap-3 rounded-lg border border-zinc-200/80 bg-white px-3 py-2"
        >
          <span className="w-20 shrink-0 truncate font-mono text-[12px] text-zinc-800">{f.name}</span>
          <span className="w-16 shrink-0 font-mono text-[10px] uppercase text-zinc-400">{f.type}</span>
          <div className="h-[4px] flex-1 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${f.bar * 100}%`,
                background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-dark))',
              }}
            />
          </div>
          <span className="w-28 shrink-0 text-right font-mono text-[10.5px] text-zinc-400">{f.note}</span>
        </div>
      ))}
    </div>
  );
};

const AnalyzePreview: React.FC = () => {
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border border-zinc-200/80 bg-[#0d1420] p-3">
        <div className="mb-2 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider text-zinc-500">
          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-400">SQL · DuckDB</span>
          <span className="truncate">analysis.sql</span>
        </div>
        <pre className="overflow-x-auto font-mono text-[11.5px] leading-relaxed text-zinc-300">
          <code>
            <span className="text-[#c792ea]">SELECT</span> region, <span className="text-[#82aaff]">SUM</span>(amount) <span className="text-[#c792ea]">AS</span> total{'\n'}
            <span className="text-[#c792ea]">FROM</span> sales{'\n'}
            <span className="text-[#c792ea]">WHERE</span> <span className="text-[#82aaff]">YEAR</span>(date) = <span className="text-[#f78c6c]">2025</span>{'\n'}
            <span className="text-[#c792ea]">GROUP BY</span> region{'\n'}
            <span className="text-[#c792ea]">ORDER BY</span> total <span className="text-[#c792ea]">DESC</span>;
          </code>
        </pre>
      </div>
      <div className="rounded-lg border border-zinc-200/80 bg-white">
        <div className="grid grid-cols-[1fr_auto] gap-x-3 border-b border-zinc-100 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-wide text-zinc-400">
          <span>region</span>
          <span>total</span>
        </div>
        {[
          ['East', '45,382'],
          ['South', '32,150'],
          ['North', '28,991'],
          ['West', '18,764'],
        ].map(([a, b], i) => (
          <div
            key={a}
            className="grid grid-cols-[1fr_auto] items-center gap-x-3 border-b border-zinc-100/70 px-3 py-1.5 font-mono text-[12px] last:border-0"
            style={{ animation: `reveal-in 400ms ease-out {i * 60}ms both` }}
          >
            <span className="text-zinc-800">{a}</span>
            <span className="tabular-nums text-[color:var(--color-primary-dark)]">{b}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-500">
        <span>✓</span> 4 rows · 18 ms · executed on real data
      </div>
    </div>
  );
};

const VisualizePreview: React.FC = () => {
  const bars = [0.52, 0.78, 1, 0.64, 0.4];
  const labels = ['East', 'South', 'North', 'West'];
  const points = [10, 88, 40, 74, 32, 66, 95, 60, 82, 46];
  const max = Math.max(...points);
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / (points.length - 1)) * 100} ${40 - (p / max) * 34}`)
    .join(' ');
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
        <span>visualize() → chartType: </span>
        <span className="rounded-full bg-[color:var(--color-primary)]/15 px-2 py-0.5 font-mono text-[10.5px] font-medium text-[color:var(--color-primary-dark)]">
          column
        </span>
      </div>
      <div className="rounded-lg border border-zinc-200/80 bg-white p-3">
        <div className="flex h-28 items-end gap-3">
          {bars.slice(0, 4).map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-sm"
                style={{
                  height: `${h * 88}%`,
                  background:
                    i === 2
                      ? 'var(--color-primary-dark)'
                      : 'color-mix(in srgb, var(--color-primary) 50%, white)',
                }}
              />
              <span className="text-[10px] text-zinc-400">{labels[i]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-zinc-200/80 bg-white p-3">
        <svg viewBox="0 0 100 44" className="h-20 w-full" preserveAspectRatio="none" aria-hidden>
          <path d={`${path} L 100 44 L 0 44 Z`} fill="color-mix(in srgb, var(--color-primary) 18%, transparent)" />
          <path
            d={path}
            fill="none"
            stroke="var(--color-primary-dark)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={(i / (points.length - 1)) * 100}
              cy={40 - (p / max) * 34}
              r="1"
              fill="var(--color-primary-dark)"
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

const PREVIEWS: Record<string, React.FC> = {
  connect: ConnectPreview,
  understand: UnderstandPreview,
  analyze: AnalyzePreview,
  visualize: VisualizePreview,
};

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

const AnalyticsPipeline: React.FC<{ id?: string }> = ({ id = 'analytics' }) => {
  const [active, setActive] = useState(0);
  const Active = PREVIEWS[STAGES[active].id];
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  const select = (i: number) => setActive(i);

  return (
    <section id={id} className="relative py-24 sm:py-28" aria-label="End-to-end analytics">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionHeading
            eyebrow="End-to-End Analytics"
            title="Everything Your Agent Needs to Analyze Data."
            description="From raw data to actionable insights — one composable framework."
          />
        </Reveal>

        <Reveal delay={120}>
          {/* tablist — keyboard accessible */}
          <div
            role="tablist"
            aria-label="Analytics pipeline stages"
            className="mt-12 flex gap-2 overflow-x-auto"
          >
            {STAGES.map((s, i) => {
              const isActive = i === active;
              return (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => select(i)}
                  onMouseEnter={() => select(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight') {
                      e.preventDefault();
                      const n = (i + 1) % STAGES.length;
                      select(n);
                      (e.currentTarget.parentElement?.children[n] as HTMLElement)?.focus();
                    }
                    if (e.key === 'ArrowLeft') {
                      e.preventDefault();
                      const n = (i - 1 + STAGES.length) % STAGES.length;
                      select(n);
                      (e.currentTarget.parentElement?.children[n] as HTMLElement)?.focus();
                    }
                  }}
                  className={`shrink-0 rounded-full border px-5 py-2 text-[13.5px] font-medium transition-all duration-200 ${
                    isActive
                      ? 'border-[color:var(--color-primary-dark)]/50 bg-[color:var(--color-primary)]/12 text-[color:var(--color-primary-dark)]'
                      : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                  }`}
                >
                  <span className="font-mono text-[11px] text-zinc-400">0{i + 1}</span>{' '}
                  {s.name}
                </button>
              );
            })}
          </div>

          {/* stage rail */}
          <div className="mt-8 grid min-w-0 items-start gap-6 lg:grid-cols-[280px_1fr]">
            {/* left: steps */}
            <ol className="flex flex-col gap-0">
              {STAGES.map((s, i) => {
                const isActive = i === active;
                return (
                  <li key={s.id} className="relative flex gap-4">
                    {/* connector */}
                    {i < STAGES.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute left-[11px] top-7 h-[calc(100%-8px)] w-px"
                        style={{
                          background: i < active ? 'var(--color-primary-dark)' : '#e4e4e7',
                        }}
                      />
                    )}
                    <span
                      aria-hidden
                      className="relative z-10 mt-1 flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full border font-mono text-[10px] transition-colors duration-200"
                      style={{
                        borderColor: i <= active ? 'var(--color-primary-dark)' : '#e4e4e7',
                        background: i < active ? 'var(--color-primary-dark)' : '#fff',
                        color: i <= active ? (i === active ? 'var(--color-primary-dark)' : '#fff') : '#a1a1aa',
                      }}
                    >
                      {i < active ? '✓' : i + 1}
                    </span>
                    <button
                      onClick={() => select(i)}
                      className={`rounded-lg px-2 py-1 pb-6 text-left transition-colors ${
                        isActive ? '' : 'hover:bg-zinc-50'
                      }`}
                    >
                      <div
                        className={`text-[14.5px] font-medium transition-colors ${
                          isActive ? 'text-zinc-900' : 'text-zinc-500'
                        }`}
                      >
                        {s.name}
                      </div>
                      <div
                        className={`mt-1 max-w-[240px] text-[12.5px] leading-relaxed transition-colors ${
                          isActive ? 'text-zinc-500' : 'text-zinc-400'
                        }`}
                      >
                        {s.blurb}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>

            {/* right: preview */}
            <div className="min-w-0 rounded-xl border border-zinc-200/90 bg-[#f8fbfc] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-5">
              <div key={active} className="reveal reveal-in">
                <div className="mb-3 flex min-w-0 items-center gap-2 border-b border-zinc-200/80 pb-3">
                  <span className="flex h-5 items-center rounded-full bg-[color:var(--color-primary)]/20 px-2 font-mono text-[10.5px] font-semibold uppercase tracking-wide text-[color:var(--color-primary-dark)]">
                    {STAGES[active].name}
                  </span>
                  <span className="truncate font-mono text-[11.5px] text-zinc-400">
                    {STAGES[active].caption}
                  </span>
                </div>
                <div style={reduced ? undefined : { animation: 'fade-swap 320ms ease-out both' }}>
                  <Active />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default AnalyticsPipeline;