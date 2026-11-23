'use client';

import { useEffect } from 'react';
import { docHref } from '../../lib/docs';
import type { Locale } from '../../lib/i18n';

const movedAnchors = {
  files: new Set([
    'files',
    'csv',
    'inline-csv',
    'csv-files',
    'csv-reader-options',
    'json',
    'inline-json',
    'json-files',
    'json-reader-options',
    'parquet',
    'excel',
    'source-options',
    'sheet-selection-and-reader-options',
    'engine-behavior',
    'text',
  ]),
  databases: new Set([
    'databases',
    'sqlite',
    'mysql',
    'postgresql',
    'ssh-options',
    'mongodb',
    'sql-server',
    'supabase',
    'clickhouse',
    'connection-fields',
    'forwarded-client-fields',
    'nested-client-options',
    'snowflake',
    'permissions',
    'connection-fields-1',
    'query-execution',
    'snowflake-permissions',
    'snowflake-connection-fields',
    'snowflake-query-execution',
  ]),
};

export default function SourceAnchorRedirect({ locale }: { locale: Locale }) {
  useEffect(() => {
    function redirectMovedAnchor() {
      const { hash, search } = window.location;
      const anchor = hash.slice(1);
      const entry = Object.entries(movedAnchors).find(([, anchors]) => anchors.has(anchor));
      if (entry) {
        const [page] = entry;
        window.location.replace(`${docHref(`data/${page}`, locale)}${search}${anchor === page ? '' : hash}`);
      }
    }

    redirectMovedAnchor();
    window.addEventListener('hashchange', redirectMovedAnchor);
    return () => window.removeEventListener('hashchange', redirectMovedAnchor);
  }, [locale]);

  return null;
}
