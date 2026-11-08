import type { Metadata } from 'next';
import Script from 'next/script';
import '../app/globals.css';
import I18nProvider from './I18nProvider';
import { messages, type Locale } from '../lib/i18n';
import { languageRedirectScript } from '../lib/language-preference';

const metadata: Metadata = {
  title: 'AVA - AI-Native Visual Analytics | AntV',
  description:
    'AVA is a technology framework designed for more convenient visual analytics. AI-native, automated visual analytics with natural language queries, LLM-powered analysis, and smart data handling.',
  keywords:
    'AVA, visual analytics, AI-native, LLM, data visualization, natural language, data analysis, AntV, chart generation',
  authors: [{ name: 'AntV' }],
  openGraph: {
    type: 'website',
    url: 'https://ava.antv.vision/',
    title: 'AVA - AI-Native Visual Analytics | AntV',
    description:
      'AVA is a technology framework designed for more convenient visual analytics. AI-native, automated visual analytics with natural language queries, LLM-powered analysis, and smart data handling.',
    images: [
      {
        url: 'https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*yOHIQ48aRwgAAAAAAAAAAAAADmJ7AQ/original',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AVA - AI-Native Visual Analytics | AntV',
    description:
      'AVA is a technology framework designed for more convenient visual analytics. AI-native, automated visual analytics with natural language queries, LLM-powered analysis, and smart data handling.',
    images: ['https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*yOHIQ48aRwgAAAAAAAAAAAAADmJ7AQ/original'],
  },
  icons: {
    icon: 'https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*FBLnQIAzx6cAAAAAQDAAAAgAemJ7AQ/original',
  },
};

export function siteMetadata(locale: Locale): Metadata {
  const t = messages[locale].metadata;
  return {
    ...metadata,
    title: t.title,
    description: t.description,
    openGraph: {
      ...metadata.openGraph,
      title: t.title,
      description: t.description,
      locale: locale === 'zh' ? 'zh_CN' : 'en_US',
      url: `https://ava.antv.vision${locale === 'zh' ? '/zh/' : '/'}`,
    },
    twitter: { ...metadata.twitter, title: t.title, description: t.description },
  };
}

export default function RootDocument({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  return (
    <html lang={locale === 'zh' ? 'zh-CN' : 'en'}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: languageRedirectScript }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
            // Buffer polyfill for browser compatibility with csv-parse
            window.Buffer = window.Buffer || {
              isBuffer: function() { return false; },
              from: function(str) { return new TextEncoder().encode(str); },
              alloc: function(size) { return new Uint8Array(size); },
            };
          `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#f8fbfc]">
        <I18nProvider locale={locale} messages={messages[locale]}>
          {children}
        </I18nProvider>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-1EBYP5XTTH" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-1EBYP5XTTH');
          `}
        </Script>
      </body>
    </html>
  );
}
