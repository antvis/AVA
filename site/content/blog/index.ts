import type { MDXContent } from 'mdx/types';
import type { Locale } from '../../lib/i18n';

type ContentLoader = () => Promise<{ default: MDXContent }>;

export const content: Record<Locale, Record<string, ContentLoader | undefined>> = {
  zh: {},
  en: {},
};
