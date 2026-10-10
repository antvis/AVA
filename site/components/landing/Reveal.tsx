'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * Lightweight scroll-reveal wrapper.
 * - Fades in + translates 16px once, when the element enters the viewport.
 * - Respects `prefers-reduced-motion` (renders immediately, no animation).
 * - No dependencies; uses a single IntersectionObserver per instance.
 */
const Reveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number; // extra delay in ms
  as?: 'div' | 'section' | 'li' | 'span';
}> = ({ children, className = '', delay = 0, as = 'div' }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof window === 'undefined') {
      setVisible(true);
      return;
    }

    const reduced =
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    if (reduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const Tag = as as React.ElementType;

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'reveal-in' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
};

export default Reveal;