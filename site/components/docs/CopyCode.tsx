'use client';

import { useRef, useState, useEffect } from 'react';

export default function CopyCode({ label, text, className = 'docs-copy' }: { label?: string; text?: string; className?: string }) {
  const button = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [status, setStatus] = useState('');
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    const code = button.current?.closest('.docs-code-block')?.querySelector('code');
    const value = text ?? code?.textContent;
    if (value == null) return;
    try {
      await navigator.clipboard.writeText(value);
      setStatus('Copied');
    } catch {
      setStatus(text === undefined ? 'Select code to copy' : 'Copy failed. Try again');
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus(''), 2500);
  }

  return (
    <button ref={button} type="button" className={className} onClick={copy} aria-label={label || 'Copy code'}>
      <span aria-live="polite">{status || label || 'Copy'}</span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <rect x="8" y="8" width="12" height="12" rx="2" />
        <path d="M16 8V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
      </svg>
    </button>
  );
}
