'use client';

import { useTranslations } from 'use-intl';

import React, { useState } from 'react';
import Reveal from './Reveal';
import { SectionHeading, SectionLink } from './Section';

// Evaluation results published in the repository (README / evals).
interface BenchmarkContext {
  id: string;
  label: string;
  accuracy: number;
  latency: number;
  tokens: number;
}

const BENCHMARK = {
  dataset: 'DataBench',
  questions: '1789Questions',
  model: 'GLM-5.1 · DuckDB · Direct',
  link: '/documentation/reference/benchmarks/',
  contexts: [
    {
      id: 'raw',
      label: 'rawData',
      accuracy: 83.51,
      latency: 1.35,
      tokens: 991,
    },
    {
      id: 'schema-profile',
      label: 'schemaProfile',
      accuracy: 84.18,
      latency: 2.08,
      tokens: 1990,
    },
    {
      id: 'semantic',
      label: 'semantic',
      accuracy: 93.01,
      latency: 1.66,
      tokens: 3288,
    },
  ] as BenchmarkContext[],
};

type Metric = 'accuracy' | 'latency' | 'tokens';

const METRICS: Record<Metric, { label: string; fmt: (v: number) => string; best: 'max' | 'min' }> = {
  accuracy: { label: 'accuracy', fmt: (v) => `${v.toFixed(2)}%`, best: 'max' },
  latency: { label: 'avgTimeQuestion', fmt: (v) => `${v.toFixed(2)} s`, best: 'min' },
  tokens: { label: 'avgTokensQuestion', fmt: (v) => v.toLocaleString('en-US'), best: 'min' },
};

const MECHANISMS = [
  {
    icon: (
      <>
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
      </>
    ),
    title: 'groundedInYourData',
    detail: 'yourSchemaAndDataContextGiveTheAnalysisAFactualStartingPoint',
  },
  {
    icon: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="m7 9 3 3-3 3m7 0h3" />
      </>
    ),
    title: 'basedOnRealComputation',
    detail: 'answersAreBuiltFromExecutedQueriesAndReturnedResults',
  },
  {
    icon: (
      <>
        <path d="M10 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9l4 4v3M14 3v5h5M8 8h2m-2 4h2" />
        <circle cx="16" cy="16" r="4" />
        <path d="m19 19 3 3" />
      </>
    ),
    title: 'openToInspection',
    detail: 'followTheQueriesAndResultsBehindTheAnswerAndCheckThemYourself',
  },
];

const TrustedAnalytics: React.FC<{ id?: string }> = ({ id = 'benchmarks' }) => {
  const t = useTranslations('TrustedAnalytics');
  const [metric, setMetric] = useState<Metric>('accuracy');
  const values = BENCHMARK.contexts.map((context) => context[metric]);
  const max = Math.max(...values);

  return (
    <section
      id={id}
      className="relative overflow-hidden px-6 py-24 max-md:px-0 max-md:py-16"
      aria-label={t('trustedAnalytics')}
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
                {t('trustTheAnalysis')}
                <br />
                {t('notJustTheAnswer')}
              </>
            }
            description={t('measuredOnPublicBenchmarksBuiltForAnswers')}
          />
        </Reveal>

        <div className="mt-7 grid items-stretch gap-5 lg:grid-cols-[5fr_4fr]">
          {/* ── left: benchmark ── */}
          <Reveal className="h-full">
            <div className="flex h-full flex-col rounded-2xl bg-white p-5">
              <div className="flex flex-col gap-5">
                <div>
                  <div className="font-mono text-[11px] tracking-[0.03em] text-zinc-500">
                    {t('context')}
                    {BENCHMARK.dataset} · {t(BENCHMARK.questions)}
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-[clamp(40px,5vw,56px)] font-semibold leading-none tracking-[-0.03em] text-zinc-900 tabular-nums">
                      {Math.max(...BENCHMARK.contexts.map((s) => s.accuracy)).toFixed(2)}
                      <span className="text-[0.4em] font-medium text-zinc-400">%</span>
                    </span>
                  </div>
                  <div className="mt-2 text-[12px] text-zinc-500">{t('answerAccuracyWithSemantic')}</div>
                  <div className="mt-1 font-mono text-[11.5px] text-zinc-400">
                    {t('model')}
                    {BENCHMARK.model}
                  </div>
                </div>
                {/* metric switch — real data exists for all three */}
                <div
                  role="tablist"
                  aria-label={t('benchmarkMetric')}
                  className="grid w-full grid-cols-3 rounded-xl border border-zinc-200 bg-[#f8fbfc] p-1"
                >
                  {(Object.keys(METRICS) as Metric[]).map((m) => (
                    <button
                      key={m}
                      role="tab"
                      id={`${id}-${m}-tab`}
                      aria-controls={`${id}-metric-panel`}
                      aria-selected={metric === m}
                      tabIndex={metric === m ? 0 : -1}
                      data-metric={m}
                      onKeyDown={(event) => {
                        const keys = Object.keys(METRICS) as Metric[];
                        const index = keys.indexOf(m);
                        let next: Metric;
                        if (event.key === 'ArrowRight') next = keys[(index + 1) % keys.length];
                        else if (event.key === 'ArrowLeft') next = keys[(index + keys.length - 1) % keys.length];
                        else if (event.key === 'Home') next = keys[0];
                        else if (event.key === 'End') next = keys[keys.length - 1];
                        else return;
                        event.preventDefault();
                        setMetric(next);
                        event.currentTarget.parentElement
                          ?.querySelector<HTMLButtonElement>(`[data-metric="${next}"]`)
                          ?.focus();
                      }}
                      onClick={() => setMetric(m)}
                      className={`rounded-lg px-2 py-2 text-[11px] leading-4 text-balance font-medium transition-all duration-200 ${
                        metric === m
                          ? 'bg-white text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                          : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                    >
                      {t(METRICS[m].label)}
                    </button>
                  ))}
                </div>
              </div>

              {/* comparison bars */}
              <div
                id={`${id}-metric-panel`}
                role="tabpanel"
                aria-labelledby={`${id}-${metric}-tab`}
                tabIndex={0}
                className="mt-10 flex flex-1 flex-col justify-end gap-4"
              >
                {BENCHMARK.contexts.map((s) => {
                  const m = METRICS[metric];
                  const value = s[metric];
                  const pct = metric === 'accuracy' ? value : (value / max) * 100;
                  const isBest = m.best === 'max' ? value === max : value === Math.min(...values);
                  return (
                    <div key={s.id}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-4">
                        <span className={`text-[12px] ${isBest ? 'font-medium text-zinc-800' : 'text-zinc-500'}`}>
                          {t(s.label)}
                          {isBest && metric === 'accuracy' && (
                            <span role="img" aria-label={t('highestAccuracy')} className="ml-2 text-amber-700">
                              ★
                            </span>
                          )}
                        </span>
                        <span
                          className={`shrink-0 font-mono text-[12px] tabular-nums ${
                            isBest ? 'text-[#22799b]' : 'text-zinc-400'
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
                <SectionLink href={BENCHMARK.link}>{t('readTheFullEvaluation')}</SectionLink>
              </div>
            </div>
          </Reveal>

          {/* ── right: three mechanisms ── */}
          <Reveal delay={120} className="h-full">
            <ul className="flex h-full flex-col gap-4">
              {MECHANISMS.map((mech) => (
                <li
                  key={t(mech.title)}
                  className="group flex flex-1 items-start gap-3.5 rounded-2xl bg-white p-5 transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(120,211,248,0.12)]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf7fa] text-[#568c9e]">
                    <svg
                      width="21"
                      height="21"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      {mech.icon}
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[20px] font-semibold text-zinc-900">{t(mech.title)}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">{t(mech.detail)}</p>
                  </div>
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
