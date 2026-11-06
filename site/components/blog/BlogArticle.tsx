import type { Metadata } from 'next';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import Link from '../LocaleLink';
import NextLink from 'next/link';
import CopyCode from '../docs/CopyCode';
import DocsToc from '../docs/DocsToc';
import BlogAuthor from './BlogAuthor';
import { content } from '../../content/blog';
import { postHref, type BlogPost } from '../../lib/blog';
import { getTranslator, pageMetadata, type Locale } from '../../lib/i18n';

export function articleMetadata(post: BlogPost, locale: Locale): Metadata {
  const url = `https://ava.antv.vision${postHref(post, locale)}`;
  const title = `${post.title[locale]} — AVA Blog`;
  const description = post.description[locale];
  return {
    title,
    description,
    authors: [{ name: post.author.name }],
    alternates: pageMetadata(locale, postHref(post, 'en')).alternates,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: post.date ? `${post.date}T00:00:00+08:00` : undefined,
    },
    twitter: { card: 'summary', title, description },
  };
}

export default async function BlogArticle({ post, locale }: { post: BlogPost; locale: Locale }) {
  const t = getTranslator(locale, 'Blog');
  const loadContent = content[locale][post.slug];
  const article = loadContent
    ? await Promise.all([
        loadContent(),
        readFile(join(process.cwd(), 'content/blog', locale, `${post.slug}.mdx`), 'utf8'),
      ])
    : null;
  const Content = article?.[1].trim() ? article[0].default : null;
  return (
    <main className="blog-article" id="blog-content">
      <header className="blog-article-header">
        <Link href="/blog/" className="blog-back">
          <span aria-hidden="true">←</span> {t('back')}
        </Link>
        <h1>{post.title[locale]}</h1>
        {post.description[locale] && <p className="blog-article-description">{post.description[locale]}</p>}
        <div className="blog-article-meta">
          <div className="blog-meta">
            <BlogAuthor author={post.author} />
            <span>{post.category[locale]}</span>
            {post.date && <time dateTime={post.date}>{post.date.replaceAll('-', '.')}</time>}
          </div>
          {Content && <CopyCode label={t('copy')} text={`# ${post.title[locale]}\n\n${article?.[1]}`} />}
        </div>
      </header>
      {Content ? (
        <div className="blog-reading">
          <div className="blog-body">
            <article className="docs-prose">
              <Content />
            </article>
            <footer className="blog-article-footer">
              <Link href="/blog/">← {t('back')}</Link>
              <a href={`https://github.com/antvis/AVA/blob/ai/site/content/blog/${locale}/${post.slug}.mdx`}>
                {t('edit')} ↗
              </a>
            </footer>
          </div>
          <DocsToc key={post.slug} />
        </div>
      ) : (
        <div className="blog-placeholder">
          {locale === 'en' ? (
            <NextLink href={postHref(post, 'zh')}>{t('readChinese')} ↗</NextLink>
          ) : (
            <p>{t('pending')}</p>
          )}
        </div>
      )}
    </main>
  );
}
