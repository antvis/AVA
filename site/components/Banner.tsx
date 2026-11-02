'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/* GitHub star badge                                                   */
/* ------------------------------------------------------------------ */

/* bundled snapshot (2026-10-10); refreshed from the API when reachable */
const SNAPSHOT_STARS = 1582;

const GitHubStars: React.FC = () => {
  const [stars, setStars] = useState<number>(SNAPSHOT_STARS);

  useEffect(() => {
    // shields.io aggregates server-side with caching; avoids GitHub API rate limits
    fetch('https://img.shields.io/github/stars/antvis/AVA.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const m = typeof data?.message === 'string' ? data.message.match(/[\d.,]+/) : null;
        if (m) {
          const n = parseFloat(m[0].replace(/,/g, ''));
          if (!Number.isNaN(n)) setStars(data.message.toLowerCase().includes('k') ? Math.round(n * 1000) : n);
        }
      })
      .catch(() => {});
  }, []);

  const label = stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars.toLocaleString();

  return (
    <a
      href="https://github.com/antvis/AVA"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`AVA on GitHub · ${label} stars (opens in a new tab)`}
      className="ml-1 inline-flex h-6 items-center gap-1.5 rounded-full border border-zinc-200 bg-white/80 px-2.5 font-mono text-[11.5px] tracking-[0.02em] text-zinc-500 backdrop-blur-sm transition-colors duration-150 hover:border-zinc-300 hover:text-zinc-700"
    >
      <svg
        width="15"
        height="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="m12 3 2.78 5.63 6.22.9-4.5 4.39 1.06 6.2L12 17.2l-5.56 2.92 1.06-6.2L3 9.53l6.22-.9L12 3Z" />
      </svg>
      <span className="tabular-nums">{label}</span>
    </a>
  );
};

/* ------------------------------------------------------------------ */
/* Rotating verse in the headline                                       */
/* ------------------------------------------------------------------ */

const TITLE_VERSES = ['AI Native', 'Automated', 'Augmented'];
const VERSE_MS = 2600;

/* AI-native gets a bespoke mark: a two-star sparkle instead of an emoji */
const Spark: React.FC = () => (
  <svg
    aria-hidden
    className="ml-[0.18em] inline-block translate-y-[0.02em]"
    width="0.5em"
    height="0.5em"
    viewBox="0 0 24 24"
  >
    <path
      d="M11 3c.6 4.2 2.6 6.2 6.8 6.8-4.2.6-6.2 2.6-6.8 6.8-.6-4.2-2.6-6.2-6.8-6.8C8.4 9.2 10.4 7.2 11 3z"
      fill="currentColor"
    />
    <path
      d="M17.5 13.5c.28 1.96 1.22 2.9 3.18 3.18-1.96.28-2.9 1.22-3.18 3.18-.28-1.96-1.22-2.9-3.18-3.18 1.96-.28 2.9-1.22 3.18-3.18z"
      fill="currentColor"
      opacity="0.55"
    />
  </svg>
);

const verseContent = (word: string) => (
  <>
    {word}
    {word === 'AI Native' && <Spark />}
  </>
);

const RotatingVerse: React.FC = () => {
  const [idx, setIdx] = useState(0);
  const [widths, setWidths] = useState<number[]>([]);
  const measureRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setIdx((i) => (i + 1) % TITLE_VERSES.length), VERSE_MS);
    return () => clearInterval(timer);
  }, []);

  /* measure every verse (incl. the sparkle) at real rendered size */
  useEffect(() => {
    const row = measureRef.current;
    if (!row) return;
    setWidths(Array.from(row.children).map((c) => (c as HTMLElement).offsetWidth));
  }, []);

  // the slot hugs the CURRENT word, so the headline re-centers every turn;
  // the width tween runs while the word is mid-swap, so it reads as motion
  const slot = widths.length ? widths[idx] : undefined;

  return (
    <span
      className="relative inline-block max-md:mb-1 max-md:block max-md:min-w-0!"
      style={{
        minWidth: slot,
        transition: 'min-width 640ms cubic-bezier(0.22,1,0.36,1)',
      }}
    >
      {/* invisible measuring row — measures each verse at real rendered size */}
      <span aria-hidden ref={measureRef} className="invisible absolute flex -translate-x-[220%]">
        {TITLE_VERSES.map((word) => (
          <span key={word} className="inline-block whitespace-pre">
            {verseContent(word)}
          </span>
        ))}
      </span>
      {/* the visible verse flows inline, so it baseline-aligns with the rest
          of the headline instead of floating on the line box's middle */}
      <span
        key={idx}
        aria-hidden
        className="hero-verse-anim inline-block whitespace-pre"
        style={{ animation: `hero-verse ${VERSE_MS}ms cubic-bezier(0.22,1,0.36,1) both` }}
      >
        {verseContent(TITLE_VERSES[idx])}
      </span>
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Banner — hero of the AI page                                 */
/* ------------------------------------------------------------------ */

const Banner: React.FC = () => (
  <section className="relative">
    {/* background — quiet editorial backdrop, styled like a chart plate */}
    <div aria-hidden className="hidden">
      {/* a barely-there wash behind the headline for depth */}
      <span
        className="absolute left-1/2 top-[150px] h-80 w-[52rem] max-w-[90vw] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, color-mix(in srgb, var(--color-primary) 22%, transparent), transparent)',
        }}
      />
    </div>

    <div className="relative">
      {/* ── hero content ── */}
      <div data-hero-content className="flex flex-col items-center gap-6 pb-11 text-center max-md:gap-5 max-md:pb-8">
        {/* kicker — quiet monogram plus live GitHub stars */}
        <span data-hero-badge className="inline-flex items-center gap-2.5 font-mono text-[12px] text-zinc-400">
          <span data-hero-new>NEW</span>
          <span data-hero-release>Introducing AVA 4.0</span>
          <GitHubStars />
        </span>

        <h1 className="text-[length:clamp(30px,4.5vw,58px)] font-semibold leading-[1.22] max-md:leading-[1.25] tracking-[-0.045em] text-zinc-900 max-md:text-[length:clamp(27px,5vw,38px)]">
          <span className="whitespace-nowrap max-md:whitespace-normal">
            <RotatingVerse /> Visual Analytics.
          </span>
          <br />
          Open Source, Built for <span className="whitespace-nowrap">Agents.</span>
        </h1>

        <p className="hero-rise max-w-[520px] text-[14px] leading-[1.85] text-zinc-500 max-md:text-[13px]">
          An open-source framework for AI agents to explore, analyze, and visualize data.
        </p>

        {/* actions */}
        <div data-hero-actions className="hero-rise mt-3 flex flex-wrap items-center justify-center gap-3 max-md:gap-2">
          <Link
            href="/ai/"
            className="group inline-flex h-10 items-center gap-2 rounded-[9px] bg-[color:var(--color-primary-dark)] px-7 text-[13.5px] max-md:px-4 max-md:text-xs font-medium text-white shadow-[0_6px_16px_color-mix(in_srgb,var(--color-primary-dark)_28%,transparent)] transition-all duration-200 hover:shadow-[0_8px_20px_color-mix(in_srgb,var(--color-primary-dark)_38%,transparent)] hover:brightness-95 active:scale-[0.97]"
          >
            Try AVA
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-200 group-hover:translate-x-[1px]"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <a
            href="https://sive.antv.antgroup.com/"
            title="Built with AVA"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex h-10 items-center gap-2.5 whitespace-nowrap rounded-[9px] border border-zinc-300 bg-white/80 px-5 text-zinc-700 transition-colors hover:border-cyan-400 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-600"
          >
            <img
              src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*nRBgR5pM57cAAAAAQCAAAAgAemJ7AQ/original"
              alt=""
              width={24}
              height={24}
              className="size-6 shrink-0 object-contain"
            />
            <span className="text-[13.5px] font-medium leading-none max-md:text-xs">Try Sive</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="ml-1 text-zinc-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            >
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
          <Link
            href="/documentation/quickstart/"
            className="group inline-flex h-10 items-center gap-1.5 rounded-[9px] px-4 text-[13.5px] max-md:text-xs font-medium text-zinc-500 transition-colors duration-200 hover:text-[color:var(--color-primary-dark)] active:scale-[0.97]"
          >
            Get Started
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="transition-transform duration-200 group-hover:translate-x-[2px]"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  </section>
);

export default Banner;
