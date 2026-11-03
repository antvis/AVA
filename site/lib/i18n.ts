import { createTranslator } from 'use-intl/core';
import type { Metadata } from 'next';
import en from '../messages/en.json';
import zh from '../messages/zh.json';

export type Locale = 'en' | 'zh';
export const messages = { en, zh };

export function localeHref(href: string, locale: Locale): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const bare = href.replace(/^\/zh(?=\/|[?#]|$)/, '');
  const path = bare.startsWith('/') ? bare : `/${bare}`;
  if (!/^\/(?:[?#]|$|(?:ai|documentation)(?:[/?#]|$))/.test(path)) return href;
  return locale === 'zh' ? `/zh${path}` : path;
}

export function getLocale(pathname: string): Locale {
  return /^\/zh(?:\/|$)/.test(pathname) ? 'zh' : 'en';
}

export function getTranslator(locale: Locale, namespace: keyof typeof en) {
  return createTranslator({ locale, messages: messages[locale][namespace] as Record<string, string> });
}

export function pageMetadata(locale: Locale, path: string): Metadata {
  const title = path === '/ai/' ? messages[locale].metadata.aiTitle : messages[locale].metadata.title;
  const description = path === '/ai/' ? messages[locale].metadata.aiDescription : messages[locale].metadata.description;
  const canonical = `https://ava.antv.vision${localeHref(path, locale)}`;
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `https://ava.antv.vision${localeHref(path, 'en')}`,
        'zh-CN': `https://ava.antv.vision${localeHref(path, 'zh')}`,
        'x-default': `https://ava.antv.vision${localeHref(path, 'en')}`,
      },
    },
    openGraph: { title, description, url: canonical, locale: locale === 'zh' ? 'zh_CN' : 'en_US' },
    twitter: { title, description },
  };
}
