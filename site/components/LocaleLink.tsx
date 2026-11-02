'use client';

import Link from 'next/link';
import { useLocale } from 'use-intl';
import type { ComponentProps } from 'react';
import { localeHref, type Locale } from '../lib/i18n';

export default function LocaleLink({ href, ...props }: ComponentProps<typeof Link>) {
  const locale = useLocale() as Locale;
  return <Link href={typeof href === 'string' ? localeHref(href, locale) : href} {...props} />;
}
