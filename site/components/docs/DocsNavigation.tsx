'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { docs, docHref, legacyDocs } from '../../lib/docs';

export default function DocsNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (mobile || pathname.replace(/\/$/, '') !== '/documentation') return;
    // Preserve section links from the former single-page documentation.
    const followLegacyAnchor = () => {
      const destination = legacyDocs[window.location.hash.slice(1)];
      if (destination) router.replace(docHref(destination));
    };
    followLegacyAnchor();
    window.addEventListener('hashchange', followLegacyAnchor);
    return () => window.removeEventListener('hashchange', followLegacyAnchor);
  }, [mobile, pathname, router]);

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
