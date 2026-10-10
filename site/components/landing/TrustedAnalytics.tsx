'use client';

import React, { useState } from 'react';
import Reveal from './Reveal';
import { SectionHeading, SectionLink } from './Section';

// * Evaluation results published in the repository (README / evals).
interface BenchmarkStrategy {
  id: string;
  label: string;
  accuracy: number;
  latency: number;
  tokens: number;
  highlight?: boolean;
}

const BENCHMARK = {
  dataset: 'DataBench',
  questions: '1,789 questions',
  model: 'GLM 5.1',
  link: 'https://github.com/antvis/AVA/blob/main/evals/ACCURACY.md',
  strategies: [
    {
      id: 'default',
      label: 'AVA Workflow · default',
      accuracy: 84.46,
      latency: 18.44,
      tokens: 903,
    },
    {
      id: 'stats',
      label: 'AVA Workflow · dataset statistics',
      accuracy: 86.64,
      latency: 20.48,
      tokens: 2315,
    },
    {
      id: 'relevant',
      label: 'AVA Workflow · question-relevant statistics',
      accuracy: 86.7,
      latency: 25.42,
      tokens: 1173,
      highlight: true,
    },
  ] as BenchmarkStrategy[],
};

type Metric = 'accuracy' | 'latency' | 'tokens';

const METRICS: Record<Metric, { label: string; unit: string; fmt: (v: number) => string; best: 'max' | 'min' }> = {
  accuracy: { label: 'Accuracy', unit: '%', fmt: (v) => `${v.toFixed(2)}%`, best: 'max' },
  latency: { label: 'Avg. time / question', unit: 's', fmt: (v) => `${v.toFixed(2)} s`, best: 'min' },
  tokens: { label: 'Avg. tokens / question', unit: '', fmt: (v) => v.toLocaleString('en-US'), best: 'min' },
};

const MECHANISMS = [
  {
    title: 'Data-Aware Reasoning',
    desc: 'Schema and data profiling give agents the context they need before analysis.',
    detail: 'ava.profile() computes row counts, distributions, top values, and ranges — without a single LLM call.',
  },
  {
    title: 'Real Execution',
    desc: 'Queries run against actual data through dedicated execution engines.',
    detail: 'Generated SQL executes on DuckDB or your Python engine — errors are caught, corrected, and retried.',
  },
  {
    title: 'Measurable Quality',
    desc: 'Evaluate accuracy, latency, and token efficiency through reproducible benchmarks.',
    detail: 'Every result is scored on DataBench with published methodology, timing, and token usage.',
  },
];

const TrustedAnalytics: React.FC<{ id?: string }> = ({ id = 'benchmarks' }) => {
  const [metric, setMetric] = useState<Metric>('accuracy');
  const values = BENCHMARK.strategies.map((s) => s[metric]);
  const max = Math.max(...values);

  return (
    <section id={id} className="relative py-24 sm:py-28" aria-label="Trusted analytics">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 18% 0%, #a8d4ff 0%, transparent 58%), radial-gradient(ellipse at 90% 35%, #bddfff 0%, transparent 55%), linear-gradient(180deg, #d3eaff 0%, #eaf6ff 100%)',
        }}
      >
        <div className="absolute -left-32 top-16 h-96 w-96 -rotate-20 rounded-[80px] bg-white/20" />
        <div className="absolute -right-20 top-24 h-80 w-80 rounded-full bg-blue-300/15" />
      </div>
      <div className="relative mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionHeading
            eyebrow="Trusted Analytics"
            title="Trust the Analysis, Not Just the Answer."
            description="Ground AI reasoning in real data, reliable execution, and measurable results."
          />
        </Reveal>

        <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-[5fr_4fr]">
          {/* ── left: benchmark ── */}
          <Reveal className="h-full">
            <div className="flex h-full flex-col rounded-2xl bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400">
                    {BENCHMARK.dataset} · {BENCHMARK.questions}
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-[clamp(44px,6vw,64px)] font-semibold leading-none tracking-[-0.03em] text-zinc-900 tabular-nums">
                      86.70
                      <span className="text-[0.4em] font-medium text-zinc-400">%</span>
                    </span>
                  </div>
                  <div className="mt-2 text-[13px] text-zinc-500">
                    answer accuracy with question-relevant dataset statistics
                  </div>
                  <div className="mt-1 font-mono text-[11.5px] text-zinc-400">
                    model: {BENCHMARK.model}
                  </div>
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
                      className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all duration-200 ${
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
              <div className="mt-8 flex flex-1 flex-col justify-end gap-4">
                {BENCHMARK.strategies.map((s) => {
                  const m = METRICS[metric];
                  const value = s[metric];
                  const pct = metric === 'accuracy' ? value : (value / max) * 100;
                  const isBest =
                    s.highlight ||
                    (m.best === 'max' ? value === max : value === Math.min(...values));
                  return (
                    <div key={s.id}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-4">
                        <span
                          className={`text-[12.5px] ${
                            isBest ? 'font-medium text-zinc-800' : 'text-zinc-500'
                          }`}
                        >
                          {s.label}
                          {s.highlight && metric === 'accuracy' && (
                            <span className="ml-2 rounded-full bg-[color:var(--color-primary)]/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-[color:var(--color-primary-dark)]">
                              best
                            </span>
                          )}
                        </span>
                        <span
                          className={`shrink-0 font-mono text-[12.5px] tabular-nums ${
                            isBest ? 'text-[color:var(--color-primary-dark)]' : 'text-zinc-400'
                          }`}
                        >
                          {m.fmt(value)}
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

              <div className="mt-6 flex justify-end border-t border-zinc-100 pt-4">
                <SectionLink href={BENCHMARK.link} external>
                  Read the full evaluation
                </SectionLink>
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
                  <h3 className="text-[15.5px] font-semibold text-zinc-900">{mech.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-zinc-500">{mech.desc}</p>
                  <p
                    className="mt-3 border-l-2 pl-3 font-mono text-[11.5px] leading-relaxed text-zinc-400 transition-colors group-hover:text-zinc-500"
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
