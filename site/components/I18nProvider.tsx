'use client';

import { IntlProvider } from 'use-intl';
import type { AbstractIntlMessages } from 'use-intl';
import type { Locale } from '../lib/i18n';

export default function I18nProvider({
  children,
  locale,
  messages,
}: {
  children: React.ReactNode;
  locale: Locale;
  messages: AbstractIntlMessages;
}) {
  return (
    <IntlProvider locale={locale} messages={messages} timeZone="UTC">
      {children}
    </IntlProvider>
  );
}
