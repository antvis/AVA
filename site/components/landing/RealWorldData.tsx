'use client';

import React from 'react';
import Reveal from './Reveal';
import { SectionHeading, SectionLink } from './Section';

/* ------------------------------------------------------------------ */
/* Verified data sources — strictly matching the current AVA release  */
/* (inline: csv / json / text · files: csv-file, json-file, parquet,  */
/*  excel · databases: sqlite, mysql, postgresql, clickhouse)          */
/* ------------------------------------------------------------------ */

type GlyphKind = 'csv' | 'json' | 'parquet' | 'text' | 'excel';

interface SourceInfo {
  name: string;
  tag: string; // file / database / inline
  /** real product logo (Simple Icons CDN) or a crafted file glyph */
  logo?: string;
  glyph?: GlyphKind;
}

const SOURCES: SourceInfo[] = [
  { name: 'CSV', tag: 'file', glyph: 'csv' },
  { name: 'JSON', tag: 'file', glyph: 'json' },
  { name: 'Parquet', tag: 'file', glyph: 'parquet' },
  { name: 'Excel', tag: 'file', glyph: 'excel' },
  { name: 'Text', tag: 'inline · LLM extraction', glyph: 'text' },
  { name: 'SQLite', tag: 'database', logo: '/logos/sqlite.svg' },
  { name: 'MySQL', tag: 'database', logo: '/logos/mysql.svg' },
  { name: 'PostgreSQL', tag: 'database', logo: '/logos/postgresql.svg' },
  { name: 'ClickHouse', tag: 'database', logo: '/logos/clickhouse.svg' },
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

/* Colors per file glyph — restrained, consistent sat */
const GLYPH_COLORS: Record<GlyphKind, string> = {
  csv: '#16a34a',
  json: '#eab308',
  parquet: '#50a14f',
  excel: '#217346',
  text: '#94a3b8',
};

/* Document glyph — folded-corner file icon with cell/table marks */
const FileGlyph: React.FC<{ kind: GlyphKind; size?: number }> = ({ kind, size = 24 }) => {
  const color = GLYPH_COLORS[kind];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 2.5h7l5 5v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z"
        fill="#fff"
        stroke={color}
        strokeWidth="1.5"
      />
      <path d="M13 2.5l5 5h-5v-5z" fill={color} opacity="0.18" stroke={color} strokeWidth="1.5" />
      <g stroke={color} strokeWidth="1.6" strokeLinecap="round">
        {kind === 'excel' ? (
          <>
            <path d="M8.2 11h7.6M8.2 14.2h7.6M8.2 17.4h7.6" />
            <path d="M10.8 11v6.4" />
          </>
        ) : kind === 'json' ? (
          <>
            <path d="M10 12.5c-.5-2.5-1.6-3.8-2-5.5 1.9.7 2.9 2 3.4 3.6.6-1.9 1.8-3.3 3.6-4-.3 2-1.4 3.5-2.8 5.2" />
            <path d="M11.4 12c.8 2 1.2 3.4 1.1 5.4-1.4-1.3-2.2-2.8-2.6-4.7" />
            <path d="M8.6 17.9c1.8.6 4 .4 5.6-.6" />
          </>
        ) : kind === 'parquet' ? (
          <>
            <path d="M8.2 10.5h3.2M8.2 13.6h3.2M8.2 16.6h3.2" />
            <path d="M13 10.5h3.2M13 13.6h3.2M13 16.6h3.2" opacity="0.55" />
            <path d="M10.5 10.5v6.1M10.5 13.6h5.7" />
          </>
        ) : kind === 'csv' ? (
          <>
            <path d="M10.7 12.1c-.9-.9-2.6-.6-2.6.9 0 1.6 1.7 1.9 2.6.9" />
            <path d="M13.3 12.1c.9-.9 2.6-.6 2.6.9 0 1.6-1.7 1.9-2.6.9" />
          </>
        ) : (
          <>
            <path d="M8.4 11.5h7.2M8.4 14.3h7.2M8.4 17.1h4.4" />
          </>
        )}
      </g>
    </svg>
  );
};

const Monogram: React.FC<{ source?: SourceInfo; size?: number }> = ({ source, size = 22 }) => {
  const [failed, setFailed] = React.useState(false);
  if (!source) return null;
  if (source.logo && !failed) {
    return (
      <img
        src={source.logo}
        alt=""
        width={size}
        height={size}
        aria-hidden
        loading="lazy"
        onError={() => setFailed(true)}
        className="shrink-0 object-contain"
      />
    );
  }
  if (source.glyph) return <FileGlyph kind={source.glyph} size={Math.round(size * 1.1)} />;
  // graceful fallback: neutral database mark
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        color: 'var(--color-primary-dark)',
      }}
    >
      {source.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Marquee — seamless, linear, pausable, reduced-motion aware          */
/* ------------------------------------------------------------------ */

const Marquee: React.FC = () => {
  const renderRow = (sources: SourceInfo[]) =>
    // duplicate the row so the -50% translate loop has no seam
    [...sources, ...sources].map((s, i) => (
      <div
        key={`${s.name}-${i}`}
        className="marquee-item"
        title={`ava.source({ type: '${SOURCE_PATHS[s.name]}' })`}
      >
        <Monogram source={s} />
        <span className="text-[14px] font-medium text-zinc-700">{s.name}</span>
        <span className="font-mono text-[11px] text-zinc-400">{s.tag}</span>
        <span aria-hidden className="h-4 w-px shrink-0 bg-zinc-200" />
      </div>
    ));

  return (
    <div
      className="marquee-outer relative overflow-hidden"
      role="list"
      aria-label="Supported data sources"
      // pause on hover / keyboard focus within; silent for reduced motion
      onMouseEnter={(e) => (e.currentTarget.dataset.hover = '1')}
      onMouseLeave={(e) => delete e.currentTarget.dataset.hover}
    >
      <div className="marquee-track">{renderRow(SOURCES)}</div>
    </div>
  );
};

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
                <Monogram source={s} size={15} />
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