'use client';

import { useLocale, useTranslations } from 'use-intl';
import type { Locale } from '../../lib/i18n';

import Link from '../LocaleLink';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { docs as chapters, docHref, localizedDoc } from '../../lib/docs';

function revealActiveChapter(navigation: HTMLElement | null) {
  const active = navigation?.querySelector<HTMLElement>('[aria-current="page"]');
  const container = navigation?.closest<HTMLElement>('.docs-sidebar') ?? navigation;
  if (!active || !container?.clientHeight) return;

  const item = active.getBoundingClientRect();
  const viewport = container.getBoundingClientRect();
  // Scroll only the menu so the article and its hash target stay in place.
  if (item.top < viewport.top + 16) container.scrollTop += item.top - viewport.top - 16;
  else if (item.bottom > viewport.bottom - 16) container.scrollTop += item.bottom - viewport.bottom + 16;
}

export default function DocsNavigation({ mobile = false }: { mobile?: boolean }) {
  const t = useTranslations('DocsNavigation');
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const docs = chapters.map((doc) => localizedDoc(doc, locale));
  const navigationRef = useRef<HTMLElement>(null);

  useEffect(() => {
    revealActiveChapter(navigationRef.current);
  }, [pathname]);

  const navigation = (
    <nav ref={navigationRef} aria-label={mobile ? t('mobileDocumentation') : t('documentationChapters')}>
      {Array.from(new Set(docs.map((doc) => doc.group))).map((group) => (
        <div className="docs-nav-group" key={group}>
          <p>{group}</p>
          {docs
            .filter((doc) => doc.group === group)
            .map((doc) => (
              <Link
                key={doc.slug}
                href={docHref(doc.slug, locale)}
                aria-current={
                  pathname.replace(/\/$/, '') === docHref(doc.slug, locale).replace(/\/$/, '') ? 'page' : undefined
                }
              >
                {doc.title}
              </Link>
            ))}
        </div>
      ))}
    </nav>
  );

  return mobile ? (
    <details
      className="docs-mobile-nav"
      key={pathname}
      onToggle={(event) => {
        if (event.currentTarget.open) revealActiveChapter(navigationRef.current);
      }}
    >
      <summary>
        <span aria-hidden="true">☰</span> {t('browseDocumentation')}
        <span aria-hidden="true">⌄</span>
      </summary>
      {navigation}
    </details>
  ) : (
    navigation
  );
}
