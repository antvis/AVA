'use client';

import React from 'react';
import Link from 'next/link';
import Reveal from './Reveal';

const FinalCTA: React.FC<{ id?: string }> = ({ id = 'get-started' }) => (
  <section id={id} className="relative overflow-hidden pb-16 pt-[76px] max-md:pb-10 max-md:pt-14" aria-label="Get started">
    {/* quiet brand glow — barely-there, just enough to close the page */}
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <span
        className="absolute left-1/2 top-1/2 h-[24rem] w-[52rem] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-50"
        style={{
          background:
            'radial-gradient(closest-side, color-mix(in srgb, var(--color-primary) 30%, transparent), transparent)',
        }}
      />
    </div>

    <div className="relative mx-auto max-w-3xl px-6 text-center">
      <div aria-hidden className="mb-5 text-center text-[32px] leading-none text-[#4ec4ef]">
        ✦
      </div>
      <Reveal>
        <h2 className="mx-auto max-w-[580px] text-[length:clamp(30px,3.6vw,44px)] font-semibold leading-[1.12] tracking-[-0.025em] text-zinc-900">
          Give Your Agents the Power of Data.
        </h2>
      </Reveal>
      <Reveal delay={80}>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-500">
          Start building with AVA, the open-source visual analytics framework for AI agents.
        </p>
      </Reveal>
      <Reveal delay={140}>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/documentation"
            className="inline-flex h-11 items-center gap-2 rounded-lg px-8 text-[14px] font-medium text-white shadow-[0_6px_16px_color-mix(in_srgb,var(--color-primary-dark)_28%,transparent)] transition-all duration-200 hover:shadow-[0_8px_20px_color-mix(in_srgb,var(--color-primary-dark)_38%,transparent)] hover:brightness-95 active:scale-[0.97]"
            style={{ background: 'var(--color-primary-dark)' }}
          >
            Get Started
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          <a
            href="https://github.com/antvis/AVA"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-300 bg-white/80 px-8 text-[14px] font-medium text-zinc-700 backdrop-blur-sm transition-all duration-200 hover:border-[color:var(--color-primary-dark)]/60 hover:text-[color:var(--color-primary-dark)] active:scale-[0.97]"
          >
            <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
              />
            </svg>
            View on GitHub
          </a>
        </div>
      </Reveal>
    </div>
  </section>
);

export default FinalCTA;