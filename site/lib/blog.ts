import type { Locale } from './i18n';

export type BlogPost = {
  slug: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  category: Record<Locale, string>;
  cover: { src: string; width: number; height: number };
  date: string;
  author: { name: string; avatar: string };
};

// SVG covers use standard filter primitives: Huamei lowercases feDropShadow, hiding filtered artwork.
export const posts: readonly BlogPost[] = [
  {
    slug: 'mini-data-agent',
    title: {
      zh: '用 AVA 构建 Mini Data Agent',
      en: 'Build a Mini Data Agent with AVA',
    },
    description: {
      zh: '从一份销售数据开始，让 Agent 分析销售额变化、核对结果，并交付结论和图表。',
      en: 'Start with sales data, then build an agent that investigates changes, verifies its results, and delivers findings with charts.',
    },
    category: { zh: '实践教程', en: 'Tutorial' },
    cover: {
      src: 'https://mdn.alipayobjects.com/huamei_aphk1k/afts/img/A*cX7PSZA7tGsAAAAAQFAAAAgAegfkAQ/original',
      width: 1200,
      height: 600,
    },
    date: '2026-11-05',
    author: {
      name: 'yvonneyx',
      avatar: 'https://avatars.githubusercontent.com/u/55794321?s=64&v=4',
    },
  },
];

export function getLatestPost(entries: readonly BlogPost[] = posts): BlogPost | undefined {
  return entries.reduce<BlogPost | undefined>(
    (latest, post) => (post.date && (!latest || post.date > latest.date) ? post : latest),
    undefined,
  );
}

export function postHref(post: BlogPost, locale: 'en' | 'zh') {
  return `${locale === 'zh' ? '/zh' : ''}/blog/${post.slug}/`;
}
