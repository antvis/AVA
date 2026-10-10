'use client';

import React, { useEffect, useState } from 'react';
import Reveal from './Reveal';
import { SectionHeading, SectionLink } from './Section';

/* ------------------------------------------------------------------ */
/* Points                                                              */
/* ------------------------------------------------------------------ */

const POINTS = [
  {
    title: 'Open by Default',
    desc: 'Explore the source, inspect the implementation, and contribute to the project. MIT licensed, developed in the open.',
  },
  {
    title: 'Composable Architecture',
    desc: 'Extend data sources, engines, and analytics capabilities to match your needs — a pluggable registry, not a closed box.',
  },
  {
    title: 'Built with AntV',
    desc: 'Visualizations are powered by the GPT-Vis-compatible syntax from the AntV ecosystem — the same stack behind G2, G6, and more.',
  },
];

const REPO_URL = 'https://github.com/antvis/AVA';

/* ------------------------------------------------------------------ */
/* GitHub stats — fetched live with a conservative bundled fallback     */
/* ------------------------------------------------------------------ */

const SNAPSHOT = { stars: 1582, forks: 92 };

/* All URLs are real repository endpoints on GitHub. */
const COMMUNITY_LINKS = [
  { label: 'Issues', href: 'https://github.com/antvis/AVA/issues' },
  { label: 'Pull Requests', href: 'https://github.com/antvis/AVA/pulls' },
  { label: 'Discussions', href: 'https://github.com/antvis/AVA/discussions' },
];


const GitHubPanel: React.FC = () => {
  const [stars, setStars] = useState<number | null>(null);
  const [forks, setForks] = useState<number | null>(null);

  useEffect(() => {
    fetch('https://api.github.com/repos/antvis/AVA')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (typeof data?.stargazers_count === 'number') setStars(data.stargazers_count);
        if (typeof data?.forks_count === 'number') setForks(data.forks_count);
      })
      .catch(() => {});
  }, []);

  const fmt = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toLocaleString('en-US'));

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-colors duration-300 hover:border-[color:var(--color-primary)]/50">
      {/* repo row + public badge */}
      <div className="flex items-center justify-between gap-3">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex min-w-0 items-center gap-2.5 font-mono text-[14px] text-zinc-800 hover:text-zinc-950"
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
            />
          </svg>
          <span className="min-w-0 truncate">antvis/AVA</span>
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="shrink-0 text-zinc-300 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          >
            <path d="M7 17L17 7M9 7h8v8" />
          </svg>
        </a>
        <span className="shrink-0 rounded-full bg-[color:var(--color-primary)]/15 px-2.5 py-1 font-mono text-[10.5px] font-medium text-[color:var(--color-primary-dark)]">
          Public · MIT
        </span>
      </div>

      {/* live stats: stars + forks, plus the current release */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <a
          href={`${REPO_URL}/stargazers`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-zinc-100 bg-[#f8fbfc] px-3 py-2.5 text-center transition-colors hover:border-[color:var(--color-primary)]/40"
        >
          <div className="font-mono text-[16px] font-semibold text-zinc-800 tabular-nums">{fmt(stars ?? SNAPSHOT.stars)}</div>
          <div className="mt-0.5 text-[10.5px] uppercase tracking-wide text-zinc-400">stars</div>
        </a>
        <a
          href={`${REPO_URL}/forks`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-zinc-100 bg-[#f8fbfc] px-3 py-2.5 text-center transition-colors hover:border-[color:var(--color-primary)]/40"
        >
          <div className="font-mono text-[16px] font-semibold text-zinc-800 tabular-nums">{fmt(forks ?? SNAPSHOT.forks)}</div>
          <div className="mt-0.5 text-[10.5px] uppercase tracking-wide text-zinc-400">forks</div>
        </a>
        <a
          href={`${REPO_URL}/releases`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-zinc-100 bg-[#f8fbfc] px-3 py-2.5 text-center transition-colors hover:border-[color:var(--color-primary)]/40"
        >
          <div className="font-mono text-[16px] font-semibold text-zinc-800">4.0</div>
          <div className="mt-0.5 text-[10.5px] uppercase tracking-wide text-zinc-400">release</div>
        </a>
      </div>

      <p className="mt-4 text-[12.5px] leading-relaxed text-zinc-500">
        Every capability on this page ships in the open — profile, engines, and benchmarks all have
        reproducible code and evaluation suites in the repository.
      </p>

      {/* community quick links */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {COMMUNITY_LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[11.5px] text-zinc-500 transition-colors hover:text-[color:var(--color-primary-dark)]"
          >
            {l.label}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-zinc-300">
              <path d="M7 17L17 7M9 7h8v8" />
            </svg>
          </a>
        ))}
      </div>

      <div className="mt-auto flex flex-wrap gap-4 pt-5">
        <SectionLink href={REPO_URL} external>
          Star on GitHub
        </SectionLink>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Section                                                             */
/* ------------------------------------------------------------------ */

const OpenSource: React.FC<{ id?: string }> = ({ id = 'open-source' }) => (
  <section id={id} className="px-6 pb-[100px] pt-[88px] max-md:px-1 max-md:pb-14 max-md:pt-14" aria-label="Open source and extensibility">
    <div className="mx-auto max-w-6xl px-6">
      <Reveal>
        <SectionHeading
          align="left"
          eyebrow="Open Source"
          title="Open Source. Built to Extend."
          description="Composable building blocks for the next generation of AI-powered analytics."
        />
      </Reveal>

      <div className="mt-12 grid items-start gap-8 lg:grid-cols-[3fr_2fr]">
        <Reveal>
          <ul className="flex flex-col divide-y divide-zinc-100 border-y border-zinc-100">
            {POINTS.map((p) => (
              <li key={p.title} className="group py-5 first:pt-0 last:pb-0">
                <h3 className="text-[15.5px] font-semibold text-zinc-900 transition-colors group-hover:text-[color:var(--color-primary-dark)]">
                  {p.title}
                </h3>
                <p className="mt-1 max-w-xl text-[13.5px] leading-relaxed text-zinc-500">{p.desc}</p>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={120}>
          <GitHubPanel />
        </Reveal>
      </div>
    </div>
  </section>
);

export default OpenSource;