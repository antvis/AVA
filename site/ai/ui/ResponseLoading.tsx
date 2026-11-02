'use client';

import { useTranslations } from 'use-intl';

import { useEffect, useState } from 'react';

export default function ResponseLoading() {
  const t = useTranslations('ResponseLoading');
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const started = performance.now();
    const timer = window.setInterval(() => setElapsed((performance.now() - started) / 1000), 100);
    return () => window.clearInterval(timer);
  }, []);

  const duration =
    elapsed < 60 ? `${elapsed.toFixed(1)}s` : `${Math.floor(elapsed / 60)}m ${(elapsed % 60).toFixed(1)}s`;

  return (
    <div role="status" className="flex w-fit items-center gap-2 py-0.5">
      <span className="sr-only">{t('generatingResponse')}</span>
      <span aria-hidden="true" className="response-loading-label text-xs">
        {t('responding')}
      </span>
      <span aria-hidden="true" className="font-mono text-[11px] tabular-nums text-ink-3">
        {duration}
      </span>
    </div>
  );
}
