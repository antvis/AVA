'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Column } from '@antv/gpt-vis';
import type { ColumnConfig } from '@antv/gpt-vis';
import Reveal from './Reveal';
import { SectionHeading } from './Section';

/* ------------------------------------------------------------------ */
/* Pipeline data — grounded in the real AVA SDK surface               */
/* ------------------------------------------------------------------ */

interface Stage {
  id: string;
  name: string;
  blurb: string;
}

const STAGES: Stage[] = [
  {
    id: 'connect',
    name: 'Connect',
    blurb: 'Access files and databases through a unified interface.',
  },
  {
    id: 'understand',
    name: 'Understand',
    blurb: 'Explore schemas, data profiles, and statistical characteristics.',
  },
  {
    id: 'analyze',
    name: 'Analyze',
    blurb: 'Execute queries and explore analytical questions with real data.',
  },
  {
    id: 'visualize',
    name: 'Visualize',
    blurb: 'Turn analytical results into meaningful visualizations.',
  },
];

/* ------------------------------------------------------------------ */
/* Stage previews — small hand-built technical vignettes              */
/* ------------------------------------------------------------------ */

const ConnectPreview: React.FC = () => {
  const rows = [
    { name: 'sales.csv', kind: 'CSV · loaded in 0.8 s', logo: '/logos/csv.svg', meta: '12,480 rows' },
    { name: 'report.xlsx', kind: 'Excel · 3 sheets as views', logo: '/logos/excel.svg', meta: '3 tables' },
    { name: 'inventory.db', kind: 'SQLite · read-only', logo: '/logos/sqlite.svg', meta: '6 tables' },
    { name: 'prod-mysql', kind: 'MySQL · auto-discovered', logo: '/logos/mysql.svg', meta: '12 tables' },
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between font-mono text-[11px] text-slate-500">
        <span className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          ava.source() · connected
        </span>
        <span>22 objects</span>
      </div>
      {rows.map((r) => (
        <div
          key={r.name}
          className="flex items-center justify-between rounded-lg border border-zinc-200/80 bg-white px-3 py-2.5"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <img src={r.logo} alt="" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
            <div className="min-w-0">
              <div className="truncate font-mono text-[12.5px] text-zinc-800">{r.name}</div>
              <div className="truncate text-[11px] text-slate-500">{r.kind}</div>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-600">
            {r.meta}
          </span>
        </div>
      ))}
    </div>
  );
};

const UnderstandPreview: React.FC = () => {
  /* Realistic profile() output for the sales dataset — meaningful stats per field */
  const fields = [
    { name: 'region', type: 'VARCHAR', bar: 1, note: '4 distinct · 0% null' },
    { name: 'category', type: 'VARCHAR', bar: 0.72, note: 'top: Electronics (31%)' },
    { name: 'amount', type: 'DECIMAL', bar: 0.58, note: '42 – 9,120 · μ 486' },
    { name: 'date', type: 'DATE', bar: 0.36, note: 'Jan 2 → Sep 30' },
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between rounded-lg border border-zinc-200/80 bg-white px-3 py-2 font-mono text-[11px] text-slate-500">
        <span className="min-w-0 truncate">profile() · sales · 12,480 rows</span>
      </div>
      {/* amount distribution — right-skewed like real revenue */}
      <div className="rounded-lg border border-zinc-200/80 bg-white px-3 py-2">
        <div className="mb-1.5 flex items-baseline justify-between font-mono text-[10.5px] text-slate-500">
          <span>amount · distribution</span>
          <span className="text-[10px]">μ 486 · σ 712</span>
        </div>
        <div className="flex h-10 items-end gap-[3px]">
          {[0.62, 1, 0.78, 0.5, 0.34, 0.24, 0.18, 0.13, 0.09, 0.06, 0.05, 0.04, 0.03, 0.02].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${h * 100}%`,
                background: i === 1 ? 'var(--color-primary-dark)' : 'color-mix(in srgb, var(--color-primary) 55%, white)',
              }}
            />
          ))}
        </div>
      </div>
      {fields.map((f) => (
        <div key={f.name} className="rounded-lg border border-zinc-200/80 bg-white px-3 py-1.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 shrink truncate font-mono text-[11.5px] text-zinc-800">{f.name}</span>
            <span className="shrink-0 font-mono text-[9.5px] uppercase text-slate-400">{f.type}</span>
            <span className="min-w-0 shrink truncate font-mono text-[9.5px] text-slate-500">{f.note}</span>
          </div>
          <div className="mt-1 h-[4px] w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${f.bar * 100}%`,
                background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-dark))',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const AnalyzePreview: React.FC = () => {
  const [tab, setTab] = useState<'sql' | 'result'>('sql');
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border border-zinc-200/80 bg-white px-3 py-2 font-mono text-[11px] text-slate-600">
        <span className="text-slate-400">query:</span>{' '}
        <span className="text-[10.5px]">&quot;Which region drives the most revenue?&quot;</span>
      </div>

      {/* SQL ⇄ Result tabs — keeps the card compact */}
      <div
        role="tablist"
        aria-label="Analysis artifacts"
        className="flex items-center justify-between rounded-lg border border-zinc-200/80 bg-blue-50/50 px-2.5 py-1.5"
      >
        <div className="flex gap-1">
          {(['sql', 'result'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-md px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-wide transition-colors ${
                tab === t ? 'bg-white text-emerald-700 shadow-[0_1px_2px_rgba(0,0,0,0.08)]' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {t === 'sql' ? 'SQL' : 'Result'}
            </button>
          ))}
        </div>
        <span className="font-mono text-[10px] text-zinc-500">DuckDB · 18 ms</span>
      </div>

      <div key={tab} style={{ animation: 'fade-swap 240ms ease-out both' }}>
        {tab === 'sql' ? (
          <pre className="whitespace-pre-wrap break-words rounded-lg border border-zinc-200/80 bg-white p-3 font-mono text-[11.5px] leading-relaxed text-slate-700">
            <code>
              <span className="text-blue-600">SELECT</span> region, <span className="text-violet-600">SUM</span>(amount) <span className="text-blue-600">AS</span> total{'\n'}
              <span className="text-blue-600">FROM</span> sales{'\n'}
              <span className="text-blue-600">WHERE</span> <span className="text-violet-600">YEAR</span>(date) = <span className="text-orange-600">2025</span>{'\n'}
              <span className="text-blue-600">GROUP BY</span> region{'\n'}
              <span className="text-blue-600">ORDER BY</span> total <span className="text-blue-600">DESC</span>;
            </code>
          </pre>
        ) : (
          <div className="rounded-lg border border-zinc-200/80 bg-white">
            <div className="grid grid-cols-[1fr_auto] gap-x-3 border-b border-zinc-100 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-wide text-slate-500">
              <span>region</span>
              <span>total</span>
            </div>
            {[
              ['East', '45,382'],
              ['South', '32,150'],
              ['North', '28,991'],
              ['West', '18,764'],
            ].map(([a, b]) => (
              <div
                key={a}
                className="grid grid-cols-[1fr_auto] items-center gap-x-3 border-b border-zinc-100/70 px-3 py-1.5 font-mono text-[12px] last:border-0"
              >
                <span className="text-zinc-800">{a}</span>
                <span className="tabular-nums text-[color:var(--color-primary-dark)]">{b}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-600">
        <span>✓</span> 4 rows · no hallucination · answer grounded in data
      </div>
    </div>
  );
};

/** Renders the analyze() result through the real gpt-vis column chart. */
const GptVisColumn: React.FC<{ data: ColumnConfig['data']; height?: number }> = ({ data, height = 160 }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const chart = Column({ container: node, width: node.clientWidth || 240, height });
    chart.render({
      type: 'column',
      data,
      // East (the top region) is highlighted via its own color entry
      style: { palette: ['var(--color-primary-dark)', 'var(--color-primary-light)'] },
      // no axis titles — maximize plot area in the small card
    });
    return () => chart.destroy();
  }, [data, height]);

  return <div ref={ref} className="w-full" />;
};

const VisualizePreview: React.FC = () => {
  // values expressed in $k so the axis ticks stay short (10 / 20 / 30 / 40)
  const rows = [
    { category: 'East', value: 45.4, group: 'Top region' },
    { category: 'South', value: 32.2, group: 'Others' },
    { category: 'North', value: 29.0, group: 'Others' },
    { category: 'West', value: 18.8, group: 'Others' },
  ];
  return (
    <div className="flex min-w-0 flex-col rounded-lg border border-zinc-200/80 bg-white p-2.5">
      {/* the query */}
      <p className="text-[11.5px] leading-relaxed text-slate-500">
        <span className="mr-1.5 font-semibold text-[color:var(--color-primary-dark)]">Q:</span>
        “Which region drives the most revenue?”
      </p>
      {/* the answer */}
      <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
        <span className="mr-1.5 font-semibold text-emerald-600">A:</span>
        East is driving the most revenue ($45,382 — about 1.4× the next region).
      </p>
      {/* the chart */}
      <div className="mt-2 border-t border-zinc-100 pt-2">
        <GptVisColumn data={rows} height={140} />
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

const AnalyticsPipeline: React.FC<{ id?: string }> = ({ id = 'analytics' }) => (
  <section
    id={id}
    className="relative px-6 py-[88px] max-md:px-1 max-md:py-14"
    aria-label="End-to-end analytics"
  >
    <div className="mx-auto max-w-[1440px] px-6 sm:px-8">
      <Reveal>
        <SectionHeading
          eyebrow="End-to-End Analytics"
          title="Everything Your Agent Needs to Analyze Data."
          description="From raw data to actionable insights — one composable framework."
        />
      </Reveal>

      <Reveal delay={120} className="mx-auto mt-12 max-w-[1160px]">
        <ol className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {STAGES.map((stage, i) => {
            const Preview = PREVIEWS[stage.id];
            return (
              <li
                key={stage.id}
                className="relative flex min-w-0 flex-col rounded-[22px] border border-white/90 bg-white p-5 shadow-[0_16px_48px_-20px_rgba(49,110,180,0.25)]"
              >
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-semibold text-blue-600">
                      {i + 1}
                    </span>
                    <h3 className="font-heading text-lg tracking-tight text-slate-950">{stage.name}</h3>
                  </div>
                  {/* description on its own line, aligned with the number */}
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{stage.blurb}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <Preview />
                </div>
                {i < STAGES.length - 1 && (
                  <svg
                    aria-hidden
                    viewBox="0 0 28 20"
                    fill="none"
                    className="absolute -right-[27px] top-1/2 z-10 hidden h-5 w-7 text-blue-500 xl:block"
                  >
                    <path d="M1 10h23m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            );
          })}
        </ol>
      </Reveal>
    </div>
  </section>
);

export default AnalyticsPipeline;
