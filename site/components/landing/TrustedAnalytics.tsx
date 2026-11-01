'use client';

import React, { useState } from 'react';
import Reveal from './Reveal';
import { SectionHeading, SectionLink } from './Section';

// * Evaluation results published in the repository (README / evals).
interface BenchmarkContext {
  id: string;
  label: string;
  accuracy: number;
  latency: number;
  tokens: number;
}

const BENCHMARK = {
  dataset: 'DataBench',
  questions: '1,789 questions',
  model: 'GLM-5.1 · DuckDB · Direct',
  link: '/documentation/reference/benchmarks/',
  contexts: [
    {
      id: 'raw',
      label: 'Raw data',
      accuracy: 83.51,
      latency: 1.35,
      tokens: 991,
    },
    {
      id: 'schema-profile',
      label: 'Schema + Profile',
      accuracy: 84.18,
      latency: 2.08,
      tokens: 1990,
    },
    {
      id: 'semantic',
      label: 'Semantic',
      accuracy: 93.01,
      latency: 1.66,
      tokens: 3288,
    },
  ] as BenchmarkContext[],
};

type Metric = 'accuracy' | 'latency' | 'tokens';

const METRICS: Record<Metric, { label: string; unit: string; fmt: (v: number) => string; best: 'max' | 'min' }> = {
  accuracy: { label: 'Accuracy', unit: '%', fmt: (v) => `${v.toFixed(2)}%`, best: 'max' },
  latency: { label: 'Avg. time / question', unit: 's', fmt: (v) => `${v.toFixed(2)} s`, best: 'min' },
  tokens: { label: 'Avg. tokens / question', unit: '', fmt: (v) => v.toLocaleString('en-US'), best: 'min' },
};

const MECHANISMS = [
  { title: 'Context before queries.', detail: 'Schema · Profile · Semantic' },
  { title: 'Queries that actually run.', detail: 'SQL · Python · Execution feedback' },
  { title: 'Results you can inspect.', detail: 'Queries · Data · Chart specs' },
];

const TrustedAnalytics: React.FC<{ id?: string }> = ({ id = 'benchmarks' }) => {
  const [metric, setMetric] = useState<Metric>('accuracy');
  const values = BENCHMARK.contexts.map((s) => s[metric]);
  const max = Math.max(...values);

  return (
    <section
      id={id}
      className="relative mx-6 overflow-hidden rounded-[24px] px-6 py-[88px] max-md:mx-2.5 max-md:px-1 max-md:py-14"
      aria-label="Trusted analytics"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at 18% 0%, #a8d4ff 0%, transparent 58%), radial-gradient(ellipse at 90% 35%, #bddfff 0%, transparent 55%), linear-gradient(180deg, #d3eaff 0%, #eaf6ff 100%)',
        }}
      >
        <div className="absolute -left-32 top-16 h-96 w-96 -rotate-20 rounded-[80px] bg-white/20" />
        <div className="absolute -right-20 top-24 h-80 w-80 rounded-full bg-blue-300/15" />
      </div>
      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionHeading
            title={
              <>
                Trust the Analysis,
                <br />
                Not Just the Answer.
              </>
            }
            description="Published results with model, dataset, and scoring details."
          />
        </Reveal>

        <div className="mt-7 grid items-stretch gap-5 lg:grid-cols-[5fr_4fr]">
          {/* ── left: benchmark ── */}
          <Reveal className="h-full">
            <div className="flex h-full flex-col rounded-2xl bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-[12px] uppercase tracking-[0.1em] text-zinc-400">
                    Context · {BENCHMARK.dataset} · {BENCHMARK.questions}
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-[clamp(44px,6vw,64px)] font-semibold leading-none tracking-[-0.03em] text-zinc-900 tabular-nums">
                      {Math.max(...BENCHMARK.contexts.map((s) => s.accuracy)).toFixed(2)}
                      <span className="text-[0.4em] font-medium text-zinc-400">%</span>
                    </span>
                  </div>
                  <div className="mt-2 text-[15px] text-zinc-500">in-sample accuracy with Semantic</div>
                  <div className="mt-1 font-mono text-[13px] text-zinc-400">model: {BENCHMARK.model}</div>
                  <details className="mt-3 max-w-sm text-[13px] leading-relaxed text-zinc-500">
                    <summary className="w-fit cursor-pointer underline decoration-zinc-300 underline-offset-4">
                      Evaluation conditions
                    </summary>
                    <p className="mt-2">
                      Reference-assisted semantic calibration on these questions. This is an in-sample result, not a
                      held-out accuracy estimate or a controlled measure of semantic-only gain.
                    </p>
                  </details>
                </div>
                {/* metric switch — real data exists for all three */}
                <div
                  role="tablist"
                  aria-label="Benchmark metric"
                  className="flex rounded-full border border-zinc-200 bg-[#f8fbfc] p-1"
                >
                  {(Object.keys(METRICS) as Metric[]).map((m) => (
                    <button
                      key={m}
                      role="tab"
                      aria-selected={metric === m}
                      onClick={() => setMetric(m)}
                      className={`rounded-full px-4 py-2 text-[14px] font-medium transition-all duration-200 ${
                        metric === m
                          ? 'bg-white text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                          : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                    >
                      {METRICS[m].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* comparison bars */}
              <div className="mt-6 flex flex-1 flex-col justify-end gap-4">
                {BENCHMARK.contexts.map((s) => {
                  const m = METRICS[metric];
                  const value = s[metric];
                  const pct = metric === 'accuracy' ? value : (value / max) * 100;
                  const isBest = m.best === 'max' ? value === max : value === Math.min(...values);
                  return (
                    <div key={s.id}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-4">
                        <span className={`text-[14px] ${isBest ? 'font-medium text-zinc-800' : 'text-zinc-500'}`}>
                          {s.label}
                          {isBest && metric === 'accuracy' && (
                            <span role="img" aria-label="Highest accuracy" className="ml-2 text-amber-700">
                              ★
                            </span>
                          )}
                        </span>
                        <span
                          className={`shrink-0 font-mono text-[14px] tabular-nums ${
                            isBest ? 'text-[color:var(--color-primary-dark)]' : 'text-zinc-400'
                          }`}
                        >
                          {m.fmt(value)}
                          {metric === 'accuracy' && s.id !== 'raw' && (
                            <span className="ml-1 text-red-700">
                              (+{(s.accuracy - BENCHMARK.contexts[0].accuracy).toFixed(2)} pp)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className="h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                          style={{
                            width: `${pct}%`,
                            background: isBest
                              ? 'linear-gradient(90deg, var(--color-primary), var(--color-primary-dark))'
                              : 'rgba(24,24,27,0.14)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex justify-end border-t border-zinc-100 pt-4">
                <SectionLink href={BENCHMARK.link}>Full evaluation</SectionLink>
              </div>
            </div>
          </Reveal>

          {/* ── right: three mechanisms ── */}
          <Reveal delay={120} className="h-full">
            <ul className="flex h-full flex-col gap-4">
              {MECHANISMS.map((mech) => (
                <li
                  key={mech.title}
                  className="group flex-1 rounded-2xl bg-white p-6 transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(120,211,248,0.12)]"
                >
                  <h3 className="text-[24px] font-semibold text-zinc-900">{mech.title}</h3>
                  <p
                    className="mt-3 border-l-2 pl-3 text-[15px] leading-relaxed text-zinc-500 transition-colors group-hover:text-zinc-600"
                    style={{ borderColor: 'color-mix(in srgb, var(--color-primary-dark) 40%, transparent)' }}
                  >
                    {mech.detail}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default TrustedAnalytics;
