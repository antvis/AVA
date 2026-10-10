'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Shared section header: eyebrow + heading + description,
 * matching the editorial voice of the hero.
 */
export const SectionHeading: React.FC<{
  eyebrow: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'center' | 'left';
}> = ({ eyebrow, title, description, align = 'center' }) => (
  <div className={`max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''}`}>
    <span className="inline-block font-mono text-[11.5px] uppercase tracking-[0.18em] text-[color:var(--color-primary-dark)]">
      {eyebrow}
    </span>
    <h2 className="mt-3 text-[clamp(26px,4vw,40px)] font-semibold leading-[1.15] tracking-[-0.02em] text-zinc-900">
      {title}
    </h2>
    {description ? (
      <p className="mt-4 text-[15px] leading-relaxed text-zinc-500">{description}</p>
    ) : null}
  </div>
);

/** Consistent eyebrow-style link used under sections. */
export const SectionLink: React.FC<{ href: string; children: React.ReactNode; external?: boolean }> = ({
  href,
  children,
  external,
}) => {
  const cls =
    'group inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[color:var(--color-primary-dark)] transition-colors hover:text-zinc-900';
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
        <Arrow />
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
      <Arrow />
    </Link>
  );
};

const Arrow: React.FC = () => (
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
);
