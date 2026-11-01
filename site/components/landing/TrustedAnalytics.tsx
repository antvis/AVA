'use client';

import React from 'react';
import Reveal from './Reveal';
import { SectionHeading, SectionLink } from './Section';

// Evaluation results published in the repository (README / evals).
const BENCHMARK = {
  dataset: 'DataBench',
  questions: '1,789 questions',
  link: '/documentation/reference/benchmarks/',
  contexts: [
    { id: 'raw', label: 'Raw data', accuracy: 83.51 },
    { id: 'schema-profile', label: 'Schema + Profile', accuracy: 84.18 },
    { id: 'semantic', label: 'Semantic', accuracy: 93.01 },
  ],
};

const MECHANISMS = [
  {
    title: 'Grounded in your data.',
    detail: 'Your schema and data context give the analysis a factual starting point.',
  },
  {
    title: 'Based on real computation.',
    detail: 'Answers are built from executed queries and returned results.',
  },
  {
    title: 'Open to inspection.',
    detail: 'Follow the queries and results behind the answer, and check them yourself.',
  },
];

const TrustedAnalytics: React.FC<{ id?: string }> = ({ id = 'benchmarks' }) => {
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
            description="Measured on public benchmarks. Built for answers you can verify."
          />
        </Reveal>

        <div className="mt-7 grid items-stretch gap-5 lg:grid-cols-[5fr_4fr]">
          {/* ── left: benchmark ── */}
          <Reveal className="h-full">
            <div className="flex h-full flex-col rounded-2xl bg-white p-6">
              <div>
                <h3 className="text-[24px] font-semibold tracking-[-0.025em] text-zinc-900">
                  Accuracy on {BENCHMARK.dataset}.
                </h3>
                <p className="mt-2 text-[14px] text-zinc-500">{BENCHMARK.questions} · Public benchmark</p>
              </div>

              <div
                className="my-8 flex flex-1 flex-col justify-center gap-6"
                aria-label="Benchmark accuracy by context"
              >
                {BENCHMARK.contexts.map((context) => (
                  <div key={context.id}>
                    <div className="mb-2 flex items-baseline justify-between gap-4">
                      <span className="text-[14px] text-zinc-600">{context.label}</span>
                      <span className="font-mono text-[18px] tabular-nums text-zinc-800">
                        {context.accuracy.toFixed(2)}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${context.accuracy}%`,
                          background:
                            context.id === 'semantic'
                              ? 'linear-gradient(90deg, var(--color-primary), var(--color-primary-dark))'
                              : 'rgba(24,24,27,0.14)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-100 pt-4">
                <p className="text-[12px] leading-relaxed text-zinc-500">
                  Semantic uses reference-assisted calibration on the same questions (in-sample).
                </p>
                <div className="mt-3">
                  <SectionLink href={BENCHMARK.link}>Explore the evaluation</SectionLink>
                </div>
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
