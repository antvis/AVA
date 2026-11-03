import Link from '../LocaleLink';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Metadata } from 'next';
import { docs, docHref, type Doc, localizedDoc } from '../../lib/docs';
import { content } from '../../content/docs';
import DocsToc from './DocsToc';
import CopyCode from './CopyCode';
import { getTranslator, pageMetadata, type Locale } from '../../lib/i18n';

export function docMetadata(original: Doc, locale: Locale = 'en'): Metadata {
  const doc = localizedDoc(original, locale);
  const title = `${doc.title} — ${locale === 'zh' ? 'AVA 文档' : 'AVA Docs'}`;
  const url = `https://ava.antv.vision${docHref(doc.slug, locale)}`;
  return {
    title,
    description: doc.description,
    alternates: pageMetadata(locale, docHref(doc.slug)).alternates,
    openGraph: { title, description: doc.description, url, type: 'article' },
    twitter: { card: 'summary', title, description: doc.description },
  };
}

export default async function DocPage({ doc: original, locale }: { doc: Doc; locale: Locale }) {
  const doc = localizedDoc(original, locale);
  const t = getTranslator(locale, 'docs');
  const [{ default: Content }, source] = await Promise.all([
    content[locale][doc.slug](),
    readFile(join(process.cwd(), 'content/docs', locale, `${doc.slug}.mdx`), 'utf8'),
  ]);
  const markdown = `# ${doc.title}\n\n${doc.description}\n\n${source}`;
  const index = docs.findIndex((entry) => entry.slug === doc.slug);
  const previous = docs[index - 1] && localizedDoc(docs[index - 1], locale);
  const next = docs[index + 1] && localizedDoc(docs[index + 1], locale);
  return (
    <>
      <main className="docs-main" id="docs-content">
        <div className="docs-page-toolbar">
          <div className="docs-eyebrow">{doc.group}</div>
          <CopyCode key={doc.slug} label={t('copy')} text={markdown} />
        </div>
        <h1>{doc.title}</h1>
        <p className="docs-description">{doc.description}</p>
        <article className="docs-prose">
          <Content />
        </article>
        <div className="docs-page-meta">
          <a href={`https://github.com/antvis/AVA/blob/ai/site/content/docs/${locale}/${doc.slug}.mdx`}>
            {t('edit')} <span aria-hidden="true">↗</span>
          </a>
        </div>
        <nav className="docs-pagination" aria-label={t('chapters')}>
          {previous ? (
            <Link href={docHref(previous.slug)}>
              <span>{t('previous')}</span>
              <strong>{previous.title}</strong>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link href={docHref(next.slug)} className="docs-next">
              <span>{t('next')}</span>
              <strong>{next.title}</strong>
            </Link>
          ) : (
            <div />
          )}
        </nav>
        <footer className="docs-footer">
          <span>{t('footer')}</span>
          <a href="https://github.com/antvis/AVA">{t('github')}</a>
        </footer>
      </main>
      <DocsToc key={doc.slug} />
    </>
  );
}
