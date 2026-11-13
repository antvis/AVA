'use client';

import { useLocale, useTranslations } from 'use-intl';
import type { Locale } from '../../lib/i18n';

import Link from '../LocaleLink';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { docs as chapters, docHref, findDoc, localizedDoc } from '../../lib/docs';

function revealActiveChapter(navigation: HTMLElement | null) {
  if (!navigation?.clientHeight) return;
  const active = navigation.querySelector<HTMLElement>('[aria-current="page"]');
  if (!active || active.closest('[inert]')) return;

  const item = active.getBoundingClientRect();
  const viewport = navigation.getBoundingClientRect();
  // Scroll only the menu so the article and its hash target stay in place.
  if (item.top < viewport.top + 16) navigation.scrollTop += item.top - viewport.top - 16;
  else if (item.bottom > viewport.bottom - 16) navigation.scrollTop += item.bottom - viewport.bottom + 16;
}

function ChapterGroup({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="docs-nav-group">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle}>
        {title}
      </button>
      <div className="docs-nav-panel" id={id} inert={!open}>
        <div>
          <div className="docs-nav-children">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function DocsNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return <ChapterNavigation key={pathname} pathname={pathname} mobile={mobile} />;
}

function ChapterNavigation({ pathname, mobile }: { pathname: string; mobile: boolean }) {
  const t = useTranslations('DocsNavigation');
  const locale = useLocale() as Locale;
  const docs = chapters.map((doc) => localizedDoc(doc, locale));
  const slug = pathname.slice(docHref('introduction', locale).length).replace(/\/$/, '') || 'introduction';
  const active = findDoc(slug);
  const isOnlineService = (doc: (typeof docs)[number]) => doc.slug.startsWith('data/online-services/');
  const sourcesHref = docHref('data/sources', locale);
  const [openGroup, setOpenGroup] = useState(
    active && active.slug !== 'introduction' ? localizedDoc(active, locale).group : null
  );
  const [servicesOpen, setServicesOpen] = useState(active ? isOnlineService(active) : false);
  const [sourcesOpen, setSourcesOpen] = useState(active?.slug === 'data/sources' || servicesOpen);
  const navigationRef = useRef<HTMLElement>(null);
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    revealActiveChapter(navigationRef.current);
  }, []);

  function closeMobileMenu() {
    if (mobileMenuRef.current) mobileMenuRef.current.open = false;
  }

  function renderLink(doc: (typeof docs)[number], title = doc.title) {
    return (
      <Link
        key={doc.slug}
        href={docHref(doc.slug, locale)}
        aria-current={active?.slug === doc.slug ? 'page' : undefined}
        onNavigate={closeMobileMenu}
      >
        {title}
      </Link>
    );
  }

  const navigation = (
    <nav ref={navigationRef} aria-label={mobile ? t('mobileDocumentation') : t('documentationChapters')}>
      {Array.from(new Set(docs.map((doc) => doc.group))).map((group) => {
        const groupDocs = docs.filter((doc) => doc.group === group);
        const services = groupDocs.filter(isOnlineService);
        return (
          <ChapterGroup
            key={group}
            title={group}
            open={openGroup === group}
            onToggle={() => setOpenGroup(openGroup === group ? null : group)}
          >
            {groupDocs
              .filter((doc) => !isOnlineService(doc))
              .map((doc) =>
                doc.slug === 'data/sources' ? (
                  <ChapterGroup
                    key={doc.slug}
                    title={doc.title}
                    open={sourcesOpen}
                    onToggle={() => setSourcesOpen(!sourcesOpen)}
                  >
                    {renderLink(doc, t('sourceOverview'))}
                    <Link href={`${sourcesHref}#files`} onNavigate={closeMobileMenu}>
                      {t('files')}
                    </Link>
                    <Link href={`${sourcesHref}#databases`} onNavigate={closeMobileMenu}>
                      {t('databases')}
                    </Link>
                    <ChapterGroup
                      title={t('onlineServices')}
                      open={servicesOpen}
                      onToggle={() => setServicesOpen(!servicesOpen)}
                    >
                      {services.map((service) => renderLink(service))}
                    </ChapterGroup>
                  </ChapterGroup>
                ) : (
                  renderLink(doc)
                )
              )}
          </ChapterGroup>
        );
      })}
    </nav>
  );

  return mobile ? (
    <details
      ref={mobileMenuRef}
      className="docs-mobile-nav"
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
