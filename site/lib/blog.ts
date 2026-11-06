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
export const posts: readonly BlogPost[] = [];

export function getLatestPost(entries: readonly BlogPost[] = posts): BlogPost | undefined {
  return entries.reduce<BlogPost | undefined>(
    (latest, post) => (post.date && (!latest || post.date > latest.date) ? post : latest),
    undefined,
  );
}

export function postHref(post: BlogPost, locale: 'en' | 'zh') {
  return `${locale === 'zh' ? '/zh' : ''}/blog/${post.slug}/`;
}
