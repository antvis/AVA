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

/* Architecture — AVA · Trusted Execution Architecture          */
/* ------------------------------------------------------------------ */

interface DiagramBlock {
  title: string;
  items: string[];
  /** solid tint per module — coordinated accents beyond the primary blue */
  color?: string;
}

const RUNTIME_PILLARS: DiagramBlock[] = [
  {
    title: 'Execution Contract',
    color: '#3bc9f2',
    items: ['Request', 'Result', 'Error', 'Status'],
  },
  {
    title: 'Execution Control',
    color: '#10b981',
    items: ['Read-only policies', 'Timeout & cancellation', 'Resource limits'],
  },
  {
    title: 'Observability',
    color: '#f59e0b',
    items: ['Execution events', 'Metrics & diagnostics', 'Trace correlation'],
  },
  {
    title: 'Execution Orchestration',
    color: '#8b5cf6',
    items: ['Session Lifecycle', 'Engine Selection', 'Result Handling'],
  },
];

const ADAPTERS: DiagramBlock[] = [
  {
    title: 'Source Layer',
    color: '#0ea5e9',
    items: ['CSV · Parquet · SQL Databases', 'Schema · Data Access'],
  },
  {
    title: 'Engine Layer',
    color: '#14b8a6',
    items: ['DuckDB · Remote SQL', 'Browser Execution'],
  },
];

const PLATFORMS = ['Node.js', 'Browser', 'Custom Adapters'];

const PlatformChip: React.FC<{ label: string }> = ({ label }) => (
  <span className="rounded-full border border-zinc-200 bg-white px-3.5 py-1 font-mono text-[11.5px] text-zinc-600">
    {label}
  </span>
);

const DiagramPillar: React.FC<{ block: DiagramBlock; accent?: boolean; inline?: boolean }> = ({
  block,
  inline,
}) => (
  <div
    className="flex-1 rounded-lg border px-3 py-2"
    style={
      block.color
        ? {
            borderColor: `color-mix(in srgb, ${block.color} 45%, #e4e4e7)`,
            background: `color-mix(in srgb, ${block.color} 12%, white)`,
          }
        : undefined
    }
  >
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span
        className="font-mono text-[10.5px] font-semibold uppercase tracking-wider"
        style={{ color: block.color ?? 'var(--color-primary-dark)' }}
      >
        {block.title}
      </span>
      {inline && (
        <span className="font-mono text-[9px] text-zinc-300" aria-hidden>
          /
        </span>
      )}
    </div>
    {inline ? (
      <ul className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        {block.items.map((item, i) => (
          <li key={item} className="flex items-center gap-2 text-[11px] leading-snug text-zinc-600">
            {i > 0 && (
              <span className="h-3 w-px bg-zinc-300" aria-hidden />
            )}
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <ul className="mt-1 flex flex-col gap-0.5">
        {block.items.map((item) => (
          <li key={item} className="text-[11px] leading-snug text-zinc-500">
            {item}
          </li>
        ))}
      </ul>
    )}
  </div>
);

const VerticalFlowArrow: React.FC<{ label: string }> = ({ label }) => (
  <div aria-hidden className="flex items-center justify-center gap-2 py-1.5">
    <svg width="12" height="24" viewBox="0 0 12 24" fill="none" className="shrink-0">
      <line
        x1="6"
        y1="0"
        x2="6"
        y2="16"
        stroke="rgba(120,211,248,0.7)"
        strokeWidth="1.5"
        className="flow-line"
      />
      <path d="M1 15l5 7 5-7z" fill="var(--color-primary-dark)" opacity="0.8" />
    </svg>
    <span className="font-mono text-[10px] text-zinc-400">{label}</span>
  </div>
);;

const Architecture: React.FC = () => (
  <Reveal className="mx-auto mt-20 max-w-[800px]">
    <div className="relative rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-8">
      {/* Layer 1 — AI Agents & Applications (primary) */}
      <div
        className="rounded-xl border px-6 py-3.5 text-center"
        style={{
          borderColor: 'color-mix(in srgb, var(--color-primary-dark) 45%, #e4e4e7)',
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 16%, white), white)',
        }}
      >
        <div className="text-[15px] font-semibold text-zinc-900">
          AI Agents &amp; Applications
        </div>
        <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-zinc-500">
          SDK · CLI · Agent Skill
        </div>
      </div>

      <VerticalFlowArrow label="structured execution requests" />

      {/* Layer 2 — AVA Runtime (Trusted Execution Boundary) */}
      <div
        className="rounded-xl border p-4"
        style={{
          borderColor: 'color-mix(in srgb, var(--color-primary-dark) 45%, #e4e4e7)',
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 8%, white), white)',
        }}
      >
        <div className="flex items-baseline justify-center gap-2">
          <span className="font-mono text-[12px] font-semibold uppercase tracking-wider text-[color:var(--color-primary-dark)]">
            AVA Runtime
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-zinc-400">
            · Trusted Execution Boundary
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {/* row 1 — Execution Contract */}
          <DiagramPillar block={RUNTIME_PILLARS[0]} accent inline />
          {/* row 2 — Execution Control | Observability */}
          <div className="flex gap-2">
            <DiagramPillar block={RUNTIME_PILLARS[1]} accent inline />
            <DiagramPillar block={RUNTIME_PILLARS[2]} accent inline />
          </div>
          {/* row 3 — Execution Orchestration */}
          <DiagramPillar block={RUNTIME_PILLARS[3]} accent inline />
        </div>
      </div>

      <VerticalFlowArrow label="source & engine adapters" />

      {/* Layer 3 — Source & Engine adapters */}
      <div className="rounded-xl border border-zinc-200/90 bg-[#fafafa] p-4">
        <div className="text-center font-mono text-[11px] uppercase tracking-wider text-zinc-400">
          Source &amp; Engine Adapters
        </div>
        <div className="mt-2.5 flex gap-2">
          {ADAPTERS.map((block) => (
            <DiagramPillar key={block.title} block={block} />
          ))}
        </div>
      </div>

      {/* Layer 4 — Execution platforms */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {PLATFORMS.map((p) => (
          <PlatformChip key={p} label={p} />
        ))}
      </div>
    </div>
  </Reveal>
);

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

const RealWorldData: React.FC<{ id?: string }> = ({ id = 'data' }) => (
  <section id={id} className="relative px-6 py-24 [&_.grid>*]:min-w-0 max-md:px-1 max-md:py-14" aria-label="Built for real-world data">
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
            AVA · Trusted Execution Architecture
          </h3>
        </Reveal>
        <div className="mt-5">
          <Architecture />
        </div>
      </div>
    </div>
  </section>
);

export default RealWorldData;
