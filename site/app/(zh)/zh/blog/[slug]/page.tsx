import { notFound } from 'next/navigation';
import BlogArticle, { articleMetadata } from '../../../../../components/blog/BlogArticle';
import { posts } from '../../../../../lib/blog';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = posts.find((entry) => entry.slug === slug);
  if (!post) notFound();
  return articleMetadata(post, 'zh');
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const post = posts.find((entry) => entry.slug === slug);
  if (!post) notFound();
  return <BlogArticle post={post} locale="zh" />;
}
