import Link from '../LocaleLink';
import { getTranslator, type Locale } from '../../lib/i18n';
import LanguageSwitch from '../LanguageSwitch';
import DocsNavigation from './DocsNavigation';
import '../../app/documentation/docs.css';

export default function DocumentationLayout({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  const t = getTranslator(locale, 'docs');
  return (
    <div className="docs-site">
      <a className="docs-skip" href="#docs-content">
        {t('skip')}
      </a>
      <header className="docs-header">
        <div className="docs-header-inner">
          <Link href="/" className="docs-brand" aria-label={t('home')}>
            <img
              src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*A-lcQbVTpjwAAAAAAAAAAAAADmJ7AQ/original"
              alt=""
              width="80"
              height="48"
            />
            <strong>AVA</strong>
            <span>{t('docs')}</span>
          </Link>
          <nav aria-label={t('navigation')} className="docs-header-links">
            <Link href="/" className="docs-website">
              {t('website')} <span aria-hidden="true">↗</span>
            </Link>
            <a href="https://github.com/antvis/AVA" className="docs-github">
              GitHub <span aria-hidden="true">↗</span>
            </a>
            <LanguageSwitch />
            <Link href="/ai/" className="docs-ai">
              {t('ai')} <span aria-hidden="true">→</span>
            </Link>
          </nav>
        </div>
      </header>
      <DocsNavigation mobile />
      <div className="docs-layout">
        <aside className="docs-sidebar">
          <Link href="/documentation/" className="docs-sidebar-label">
            <span className="docs-book-icon" aria-hidden="true">
              ▤
            </span>{' '}
            {t('docs')}
          </Link>
          <DocsNavigation />
          <div className="docs-sidebar-footer">
            <span className="docs-status-dot" /> {t('status')}
          </div>
        </aside>
        {children}
      </div>
    </div>
  );
}
