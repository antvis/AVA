import Link from 'next/link';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Metadata } from 'next';
import { docs, docHref, type Doc } from '../../lib/docs';
import { content } from '../../content/docs';
import DocsToc from './DocsToc';
import CopyCode from './CopyCode';

export function docMetadata(doc: Doc): Metadata {
  const title = `${doc.title} — AVA Docs`;
  const url = `https://ava.antv.vision${docHref(doc.slug)}`;
  return {
    title,
    description: doc.description,
    alternates: { canonical: url },
    openGraph: { title, description: doc.description, url, type: 'article' },
    twitter: { card: 'summary', title, description: doc.description },
  };
}

export default async function DocPage({ doc }: { doc: Doc }) {
  const [{ default: Content }, source] = await Promise.all([
    content[doc.slug](),
    readFile(join(process.cwd(), 'content/docs', `${doc.slug}.mdx`), 'utf8'),
  ]);
  const markdown = `# ${doc.title}\n\n${doc.description}\n\n${source}`;
  const index = docs.findIndex((entry) => entry.slug === doc.slug);
  const previous = docs[index - 1];
  const next = docs[index + 1];
  return (
    <>
      <main className="docs-main" id="docs-content">
        <div className="docs-page-toolbar">
          <div className="docs-eyebrow">{doc.group}</div>
          <CopyCode key={doc.slug} label="Copy Markdown" text={markdown} />
        </div>
        <h1>{doc.title}</h1>
        <p className="docs-description">{doc.description}</p>
        <article className="docs-prose">
          <Content />
        </article>
        <div className="docs-page-meta">
          <a href={`https://github.com/antvis/AVA/blob/ai/site/content/docs/${doc.slug}.mdx`}>
            Edit this page on GitHub <span aria-hidden="true">↗</span>
          </a>
        </div>
        <nav className="docs-pagination" aria-label="Chapter navigation">
          {previous ? (
            <Link href={docHref(previous.slug)}>
              <span>← Previous</span>
              <strong>{previous.title}</strong>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link href={docHref(next.slug)} className="docs-next">
              <span>Next →</span>
              <strong>{next.title}</strong>
            </Link>
          ) : (
            <div />
          )}
        </nav>
        <footer className="docs-footer">
          <span>AVA · An AntV project</span>
          <a href="https://github.com/antvis/AVA">Open source on GitHub ↗</a>
        </footer>
      </main>
      <DocsToc key={doc.slug} />
    </>
  );
}
