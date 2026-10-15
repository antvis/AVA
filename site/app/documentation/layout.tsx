import Link from 'next/link';
import DocsNavigation from '../../components/docs/DocsNavigation';
import './docs.css';

export default function DocumentationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="docs-site">
      <a className="docs-skip" href="#docs-content">
        Skip to content
      </a>
      <header className="docs-header">
        <div className="docs-header-inner">
          <Link href="/" className="docs-brand" aria-label="AVA home">
            <img
              src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*A-lcQbVTpjwAAAAAAAAAAAAADmJ7AQ/original"
              alt=""
              width="80"
              height="48"
            />
            <strong>AVA</strong>
            <span>Documentation</span>
          </Link>
          <nav aria-label="Main navigation" className="docs-header-links">
            <Link href="/" className="docs-website">
              Website <span aria-hidden="true">↗</span>
            </Link>
            <a href="https://github.com/antvis/AVA" className="docs-github">
              GitHub <span aria-hidden="true">↗</span>
            </a>
            <Link href="/ai/" className="docs-ai">
              AI <span aria-hidden="true">→</span>
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
            Documentation
          </Link>
          <DocsNavigation />
          <div className="docs-sidebar-footer">
            <span className="docs-status-dot" /> TypeScript · Open source
          </div>
        </aside>
        {children}
      </div>
    </div>
  );
}
