import type { ReactNode } from 'react';
import Header from '../Header';
import Footer from '../Footer';
import PageShell from '../PageShell';
import { getTranslator, type Locale } from '../../lib/i18n';
import '../../app/documentation/docs.css';
import './blog.css';

export default function BlogLayout({ children, locale }: { children: ReactNode; locale: Locale }) {
  const t = getTranslator(locale, 'Blog');
  return (
    <PageShell>
      <div className="docs-site blog-site">
        <a href="#blog-content" className="docs-skip">
          {t('skip')}
        </a>
        <Header />
        {children}
        <Footer />
      </div>
    </PageShell>
  );
}
