'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Full footer. Navigation only points to pages that actually exist:
 * /playground, /documentation, and real GitHub / AntV ecosystem URLs —
 * no dead links to pages that have not been created yet.
 */

const GITHUB = 'https://github.com/antvis/AVA';

const NAV: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#analytics' },
      { label: 'Examples', href: '/#playground' },
      { label: 'Benchmarks', href: '/#benchmarks' },
      { label: 'Integration', href: '/#integrate' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'Documentation', href: '/documentation' },
      { label: 'AI Playground', href: '/ai-playground' },
      { label: 'SDK', href: `${GITHUB}#sdk` , external: true },
      { label: 'CLI', href: `${GITHUB}#cli`, external: true },
      { label: 'Agent Skill', href: `${GITHUB}/blob/main/skills/ava/SKILL.md`, external: true },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'GitHub', href: GITHUB, external: true },
      { label: 'Discussions', href: `${GITHUB}/discussions`, external: true },
      { label: 'Pull Requests', href: `${GITHUB}/pulls`, external: true },
      { label: 'Issues', href: `${GITHUB}/issues`, external: true },
    ],
  },
  {
    title: 'AntV Ecosystem',
    links: [
      { label: 'AntV', href: 'https://antv.antgroup.com/', external: true },
      { label: 'G2', href: 'https://g2.antv.vision/', external: true },
      { label: 'G6', href: 'https://g6.antv.vision/', external: true },
      { label: 'S2', href: 'https://s2.antv.vision/', external: true },
    ],
  },
];

const Footer: React.FC = () => (
  <footer className="border-t border-zinc-100 bg-[#f8fbfc]">
    <div className="mx-auto max-w-6xl px-6 py-14">
      <div className="grid gap-10 md:grid-cols-[1.2fr_repeat(4,minmax(120px,1fr))]">
        {/* brand */}
        <div className="max-w-xs">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img
              src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*A-lcQbVTpjwAAAAAAAAAAAAADmJ7AQ/original"
              alt="AVA logo"
              className="h-9 w-auto"
            />
            <span className="text-[17px] font-semibold text-zinc-900">AVA</span>
          </Link>
          <p className="mt-3 text-[12.5px] leading-relaxed text-zinc-500">
            An open-source, AI-native visual analytics framework — built for AI agents, from the
            AntV team.
          </p>
        </div>

        {NAV.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-zinc-400">
              {group.title}
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {group.links.map((l) => (
                <li key={l.label}>
                  {l.external ? (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] text-zinc-600 transition-colors hover:text-[color:var(--color-primary-dark)]"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      href={l.href}
                      className="text-[13px] text-zinc-600 transition-colors hover:text-[color:var(--color-primary-dark)]"
                    >
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-zinc-200/70 pt-6 sm:flex-row sm:items-center">
        <p className="text-[12px] text-zinc-400">
          © 2026 AntV · Released under the MIT License.
        </p>
        <a
          href={GITHUB}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[12.5px] text-zinc-500 transition-colors hover:text-zinc-800"
        >
          <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"
            />
          </svg>
          <span className="font-mono">antvis/AVA</span>
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;