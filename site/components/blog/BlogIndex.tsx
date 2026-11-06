import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import BlogAuthor from './BlogAuthor';
import { posts, postHref } from '../../lib/blog';
import { getTranslator, localeHref, pageMetadata, type Locale } from '../../lib/i18n';

export function blogMetadata(locale: Locale): Metadata {
  const title = 'Blog — AVA';
  const description = getTranslator(locale, 'Blog')('description');
  return {
    title,
    description,
    alternates: pageMetadata(locale, '/blog/').alternates,
    openGraph: { title, description, url: `https://ava.antv.vision${localeHref('/blog/', locale)}`, type: 'website' },
    twitter: { card: 'summary', title, description },
  };
}

export default function BlogIndex({ locale }: { locale: Locale }) {
  const t = getTranslator(locale, 'Blog');
  return (
    <main className="blog-index" id="blog-content">
      <header className="blog-intro">
        <h1>
          Blog<span aria-hidden="true">.</span>
        </h1>
        <p>{t('description')}</p>
      </header>
      <section className="blog-posts" aria-label={t('latest')}>
        {posts.map((post) => (
          <article className="blog-post" key={post.slug}>
            <Link className="blog-post-link" href={postHref(post, locale)}>
              <Image className="blog-post-cover" {...post.cover} alt="" />
              <div className="blog-post-copy">
                <h2>{post.title[locale]}</h2>
                {post.description[locale] && <p className="blog-post-description">{post.description[locale]}</p>}
                <div className="blog-post-meta">
                  <BlogAuthor author={post.author} />
                  {post.date && <time dateTime={post.date}>{post.date.replaceAll('-', '.')}</time>}
                </div>
              </div>
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
