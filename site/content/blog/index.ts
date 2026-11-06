import type { MDXContent } from 'mdx/types';
import type { Locale } from '../../lib/i18n';

type ContentLoader = () => Promise<{ default: MDXContent }>;

export const content: Record<Locale, Record<string, ContentLoader | undefined>> = {
  zh: {
    'mini-data-agent': () => import('./zh/mini-data-agent.mdx'),
    'ava-4-release': () => import('./zh/ava-4-release.mdx'),
  },
  en: {
    'mini-data-agent': () => import('./en/mini-data-agent.mdx'),
    'ava-4-release': () => import('./en/ava-4-release.mdx'),
  },
};
