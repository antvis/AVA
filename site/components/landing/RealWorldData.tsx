'use client';

import React from 'react';
import Reveal from './Reveal';
import { SectionHeading, SectionLink } from './Section';

/* ------------------------------------------------------------------ */
/* Verified data sources — strictly matching the current AVA release  */
/* (inline: csv / json / text · files: csv-file, json-file, parquet,  */
/*  excel · databases: sqlite, mysql, postgresql, clickhouse)          */
/* ------------------------------------------------------------------ */

interface SourceInfo {
  name: string;
  tag: string; // file / database / inline
}

const SOURCES: SourceInfo[] = [
  { name: 'CSV', tag: 'file' },
  { name: 'JSON', tag: 'file' },
  { name: 'Parquet', tag: 'file' },
  { name: 'Excel', tag: 'file' },
  { name: 'Text', tag: 'inline · LLM extraction' },
  { name: 'SQLite', tag: 'database' },
  { name: 'MySQL', tag: 'database' },
  { name: 'PostgreSQL', tag: 'database' },
  { name: 'ClickHouse', tag: 'database' },
];

const SOURCE_PATHS: Record<string, string> = {
  CSV: 'csv-file',
  JSON: 'json-file',
  Parquet: 'parquet',
  Excel: 'excel',
  Text: 'text',
  SQLite: 'sqlite',
  MySQL: 'mysql',
  PostgreSQL: 'postgresql',
  ClickHouse: 'clickhouse',
};

const Monogram: React.FC<{ name: string; size?: number }> = ({ name, size = 22 }) => {
  const letters = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || 'DB';
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        letterSpacing: '0.02em',
        color: 'var(--color-primary-dark)',
      }}
    >
      {letters}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Marquee — seamless, linear, pausable, reduced-motion aware          */
/* ------------------------------------------------------------------ */

const Marquee: React.FC = () => {
  // duplicate the row so the translate loop has no seam
  const doubled = [...SOURCES, ...SOURCES];
  return (
    <div
      className="marquee-outer relative overflow-hidden"
      // pause on hover / keyboard focus within; silent for reduced motion
      onMouseEnter={(e) => (e.currentTarget.dataset.hover = '1')}
      onMouseLeave={(e) => delete e.currentTarget.dataset.hover}
    >
      <div className="marquee-track" role="list" aria-label="Supported data sources">
        {doubled.map((s, i) => (
          <div
            key={`${s.name}-${i}`}
            role="listitem"
            className="marquee-item"
            title={`ava.source({ type: '${SOURCE_PATHS[s.name]}' })`}
          >
            <Monogram name={s.name} />
            <span className="text-[14px] font-medium text-zinc-700">{s.name}</span>
            <span className="font-mono text-[11px] text-zinc-400">{s.tag}</span>
            <span aria-hidden className="h-4 w-px shrink-0 bg-zinc-200" />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Architecture — Source / Engine / Runtime, faithful to the real      */
/* engine registry (duckdb · python · javascript · clickhouse · supabase) */
/* ------------------------------------------------------------------ */

const MODULES = [
  {
    name: 'Source',
    desc: 'Uniform loading and schema discovery from files, inline data, and databases.',
    api: 'ava.source({ type, options }) → Schema',
  },
  {
    name: 'Engine',
    desc: 'Query and computation execution: DuckDB SQL, Python/pandas, or a browser JavaScript sandbox.',
    api: 'engine: { type: "duckdb" | "python" | "javascript" }',
  },
  {
    name: 'Runtime',
    desc: 'Execution context and resource lifecycle — timeouts, memory limits, and disposal.',
    api: '{ queryTimeoutMs, memoryLimit, threads }',
  },
];

const CAPABILITIES = [
  { name: 'Modular Architecture', state: 'Shipped', detail: 'pluggable engine registry, composable pipeline' },
  { name: 'Controlled Execution', state: 'Shipped', detail: 'row limits, result-size caps, query timeouts, auto-retry' },
  { name: 'Safe by Design', state: 'Shipped', detail: 'read-only database access, isolated execution engines' },
] as const;

const Architecture: React.FC = () => (
  <div className="mt-20 grid items-center gap-6 lg:grid-cols-3">
    {/* diagram */}
    <Reveal className="lg:col-span-2">
      <div className="relative rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-8">
        {/* agent node */}
        <div className="flex items-center justify-between gap-3">
          <div className="rounded-xl border border-zinc-200 bg-[#f8fbfc] px-4 py-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">Agent</div>
            <div className="mt-0.5 text-[13px] font-medium text-zinc-800">natural-language intent</div>
          </div>
          <FlowArrow label="Skill / SDK / CLI" />
          <div
            className="rounded-xl border px-4 py-3"
            style={{
              borderColor: 'color-mix(in srgb, var(--color-primary-dark) 45%, #e4e4e7)',
              background:
                'linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 14%, white), white)',
            }}
          >
            <div className="font-mono text-[11px] uppercase tracking-wider text-[color:var(--color-primary-dark)]">
              AVA Runtime
            </div>
            <div className="mt-0.5 text-[13px] font-medium text-zinc-800">
              context · execution · lifecycle
            </div>
          </div>
          <FlowArrow label="profile · suggest · analyze · visualize" mono />
        </div>

        {/* engine row */}
        <div className="mt-6 border-t border-dashed border-zinc-200 pt-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
              Engine registry
            </span>
            {['DuckDB', 'Python / pandas', 'JavaScript', 'ClickHouse', 'Supabase'].map((e) => (
              <span
                key={e}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1 font-mono text-[11.5px] text-zinc-600"
              >
                {e}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">Sources</span>
            {SOURCES.map((s) => (
              <span
                key={s.name}
                className="flex items-center gap-1.5 rounded-full bg-[#f4f4f5] px-3 py-1 text-[12px] text-zinc-600"
              >
                <Monogram name={s.name} size={16} />
                {s.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Reveal>

    {/* modules */}
    <div className="flex flex-col gap-3">
      {MODULES.map((m, i) => (
        <Reveal key={m.name} delay={i * 80}>
          <div className="rounded-xl border border-zinc-200/90 bg-white p-4 transition-colors duration-200 hover:border-[color:var(--color-primary-dark)]/35">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-[14px] font-semibold text-zinc-900">{m.name}</h3>
              <span className="font-mono text-[10.5px] text-[color:var(--color-primary-dark)]" style={{ opacity: 0.8 }}>
                0{i + 1}
              </span>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-zinc-500">{m.desc}</p>
            <code className="mt-2 block truncate rounded bg-[#f4f4f5] px-2 py-1 font-mono text-[11px] text-zinc-500">
              {m.api}
            </code>
          </div>
        </Reveal>
      ))}
    </div>
  </div>
);

const FlowArrow: React.FC<{ label: string; mono?: boolean }> = ({ label, mono }) => (
  <div aria-hidden className="flex min-w-0 flex-1 flex-col items-center px-1">
    <svg width="52" height="10" viewBox="0 0 52 10" fill="none" className="w-full max-w-[56px]">
      <line x1="0" y1="5" x2="42" y2="5" stroke="rgba(120,211,248,0.7)" strokeWidth="1.5" className="flow-line" />
      <path d="M43 1l7 4-7 4z" fill="var(--color-primary-dark)" opacity="0.8" />
    </svg>
    <span
      className={`mt-1 w-full truncate text-center text-[10px] text-zinc-400 ${
        mono ? 'font-mono' : ''
      }`}
    >
      {label}
    </span>
  </div>
);

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

const RealWorldData: React.FC<{ id?: string }> = ({ id = 'data' }) => (
  <section id={id} className="relative py-24 sm:py-28" aria-label="Built for real-world data">
    <div className="mx-auto max-w-6xl px-6">
      <Reveal>
        <SectionHeading
          eyebrow="Built for Real-World Data"
          title="Connect Your Data. Run Anywhere."
          description="A unified foundation for files, databases, and flexible execution environments."
        />
      </Reveal>

      {/* marquee */}
      <Reveal delay={100}>
        <div className="mt-12">
          <Marquee />
          <div className="mt-6 flex flex-col items-center gap-2">
            <p className="font-mono text-[12px] text-zinc-400">One interface. Multiple data sources.</p>
            <SectionLink href="https://github.com/antvis/AVA#-quick-start" external>
              Explore all data sources
            </SectionLink>
          </div>
        </div>
      </Reveal>

      {/* architecture */}
      <div className="mt-14">
        <Reveal>
          <h3 className="font-mono text-[11.5px] uppercase tracking-[0.18em] text-zinc-400">
            Runtime architecture
          </h3>
        </Reveal>
        <div className="mt-5">
          <Architecture />
        </div>
        <Reveal delay={80}>
          <ul className="mt-6 flex flex-wrap justify-center gap-2">
            {CAPABILITIES.map((c) => (
              <li
                key={c.name}
                className="flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-4 py-2"
              >
                <span className="text-[13px] font-medium text-zinc-800">{c.name}</span>
                <span className="h-3 w-px bg-zinc-200" aria-hidden />
                <span className="font-mono text-[11px] text-zinc-400">{c.detail}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-600">
                  {c.state}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </div>
  </section>
);

export default RealWorldData;