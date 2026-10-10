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
      <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
        />
      </svg>
      <span className="tabular-nums">{label}</span>
    </a>
  );
};

/* ------------------------------------------------------------------ */
/* Headline — character-by-character reveal                            */
/* ------------------------------------------------------------------ */

const StaggerChars: React.FC<{ text: string; startMs: number; stepMs?: number }> = ({ text, startMs, stepMs = 34 }) => (
  <span aria-label={text} className="inline">
    {text.split('').map((ch, i) => (
      <span
        key={i}
        aria-hidden
        className="hero-char-anim inline-block"
        style={{
          animation: `hero-char 720ms cubic-bezier(0.22,1,0.36,1) ${startMs + i * stepMs}ms both`,
          whiteSpace: 'pre',
        }}
      >
        {ch}
      </span>
    ))}
  </span>
);

/* ------------------------------------------------------------------ */
/* Rotating verse in the headline                                       */
/* ------------------------------------------------------------------ */

const TITLE_VERSES = ['AI native', 'Automated', 'Augmented'];
const VERSE_MS = 2600;

/* AI-native gets a bespoke mark: a two-star sparkle instead of an emoji */
const Spark: React.FC = () => (
  <svg
    aria-hidden
    className="hero-spark-anim ml-[0.18em] inline-block translate-y-[0.02em]"
    width="0.5em"
    height="0.5em"
    viewBox="0 0 24 24"
    style={{ animation: 'hero-spark 3.4s ease-in-out infinite' }}
  >
    <path
      d="M11 3c.6 4.2 2.6 6.2 6.8 6.8-4.2.6-6.2 2.6-6.8 6.8-.6-4.2-2.6-6.2-6.8-6.8C8.4 9.2 10.4 7.2 11 3z"
      style={{ fill: 'var(--color-primary-dark)' }}
    />
    <path
      d="M17.5 13.5c.28 1.96 1.22 2.9 3.18 3.18-1.96.28-2.9 1.22-3.18 3.18-.28-1.96-1.22-2.9-3.18-3.18 1.96-.28 2.9-1.22 3.18-3.18z"
      style={{ fill: 'var(--color-primary-light)' }}
    />
  </svg>
);

const verseContent = (word: string) => (
  <>
    {word}
    {word === 'AI native' && <Spark />}
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
        className="hero-verse-anim inline-block whitespace-pre text-[color:var(--color-primary-dark)]"
        style={{ animation: `hero-verse ${VERSE_MS}ms cubic-bezier(0.22,1,0.36,1) both` }}
      >
        {verseContent(TITLE_VERSES[idx])}
      </span>
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Banner — hero of the Playground page                                 */
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
      <div className="flex flex-col items-center gap-5 pb-[38px] text-center max-md:gap-[17px] max-md:pb-7">
        {/* kicker — quiet monogram plus live GitHub stars */}
        <span
          className="inline-flex items-center gap-2.5 font-mono text-[12px] uppercase tracking-[0.18em] text-zinc-400"
          style={{ animation: 'hero-rise 700ms cubic-bezier(0.22,1,0.36,1) 0.1s both' }}
        >
          <span>AVA 4.0</span>
          <GitHubStars />
        </span>

        <h1 className="text-[length:clamp(30px,4.5vw,58px)] font-semibold leading-[1.14] tracking-[-0.045em] text-zinc-900 max-md:text-[length:clamp(27px,5vw,38px)]">
          <span className="whitespace-nowrap max-md:whitespace-normal">
            <RotatingVerse /> <StaggerChars text="Visual Analytics." startMs={430} />
          </span>
          <br />
          <StaggerChars text="Built for " startMs={900} />{' '}
          <span className="relative whitespace-nowrap text-[color:var(--color-primary-dark)]">
            <StaggerChars text="Agents." startMs={1000} />
            {/* a single crafted accent: hand-drawn underline */}
            <svg
              aria-hidden
              className="absolute -bottom-1 left-0 hidden w-full"
              viewBox="0 0 120 8"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M2 5.5C24 2.5 62 2 118 3.8"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.9"
                strokeDasharray="140"
                style={{
                  stroke: 'var(--color-primary-dark)',
                  animation: 'hero-draw 600ms cubic-bezier(0.22,1,0.36,1) 1.95s both',
                }}
              />
            </svg>
          </span>
        </h1>

        <p
          className="hero-rise max-w-[520px] text-[14px] leading-[1.7] text-zinc-500 max-md:text-[13px]"
          style={{ animation: 'hero-rise 800ms cubic-bezier(0.22,1,0.36,1) 0.55s both' }}
        >
          The open-source framework that gives AI agents the power to explore, analyze, and visualize data.
        </p>

        {/* actions */}
        <div
          className="hero-rise mt-3 flex flex-wrap items-center justify-center gap-3 max-md:gap-2"
          style={{ animation: 'hero-rise 800ms cubic-bezier(0.22,1,0.36,1) 0.8s both' }}
        >
          <Link
            href="/documentation"
            className="group inline-flex h-10 items-center gap-2 rounded-[9px] bg-[color:var(--color-primary-dark)] px-7 text-[13.5px] max-md:px-4 max-md:text-xs font-medium text-white shadow-[0_6px_16px_color-mix(in_srgb,var(--color-primary-dark)_28%,transparent)] transition-all duration-200 hover:shadow-[0_8px_20px_color-mix(in_srgb,var(--color-primary-dark)_38%,transparent)] hover:brightness-95 active:scale-[0.97]"
          >
            Get Started
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
            <span className="flex flex-col items-start gap-0.5">
              <span className="text-[13.5px] font-medium leading-none max-md:text-xs">Try Sive</span>
              <span className="text-[9px] leading-none text-zinc-400">Built with AVA</span>
            </span>
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
            href="/ai-playground"
            className="group inline-flex h-10 items-center gap-1.5 rounded-[9px] px-4 text-[13.5px] max-md:text-xs font-medium text-zinc-500 transition-colors duration-200 hover:text-[color:var(--color-primary-dark)] active:scale-[0.97]"
          >
            AI Playground
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
