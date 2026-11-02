'use client';

import { usePathname } from 'next/navigation';
import { getLocale, localeHref } from '../lib/i18n';
import { LANGUAGE_STORAGE_KEY } from '../lib/language-preference';

export default function LanguageSwitch() {
  const pathname = usePathname();
  const nextLocale = getLocale(pathname) === 'zh' ? 'en' : 'zh';
  const label = nextLocale === 'zh' ? '切换到中文' : 'Switch to English';
  return (
    <a
      href={localeHref(`${pathname.replace(/\/$/, '')}/`, nextLocale)}
      onClick={() => {
        try {
          localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
        } catch {
          // Language switching still works when browser storage is unavailable.
        }
      }}
      lang={nextLocale === 'zh' ? 'zh-CN' : 'en'}
      hrefLang={nextLocale === 'zh' ? 'zh-CN' : 'en'}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
      aria-label={label}
      title={label}
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a17 17 0 0 1 0 18 17 17 0 0 1 0-18Z" />
      </svg>
    </a>
  );
}
