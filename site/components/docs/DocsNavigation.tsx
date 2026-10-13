'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { docs, docHref } from '../../lib/docs';

export default function DocsNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const navigation = (
    <nav aria-label={mobile ? 'Mobile documentation' : 'Documentation chapters'}>
      {Array.from(new Set(docs.map((doc) => doc.group))).map((group) => (
        <div className="docs-nav-group" key={group}>
          <p>{group}</p>
          {docs
            .filter((doc) => doc.group === group)
            .map((doc) => (
              <Link
                key={doc.slug}
                href={docHref(doc.slug)}
                aria-current={pathname.replace(/\/$/, '') === docHref(doc.slug).replace(/\/$/, '') ? 'page' : undefined}
              >
                {doc.title}
              </Link>
            ))}
        </div>
      ))}
    </nav>
  );

  return mobile ? (
    <details className="docs-mobile-nav" key={pathname}>
      <summary>
        <span aria-hidden="true">☰</span> Browse documentation <span aria-hidden="true">⌄</span>
      </summary>
      {navigation}
    </details>
  ) : (
    navigation
  );
}
