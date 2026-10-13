import { notFound } from 'next/navigation';
import DocPage, { docMetadata } from '../../../components/docs/DocPage';
import { docs } from '../../../lib/docs';

type Props = { params: Promise<{ slug: string[] }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return docs.slice(1).map(({ slug }) => ({ slug: slug.split('/') }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const doc = docs.find((entry) => entry.slug === slug.join('/'));
  if (!doc) notFound();
  return docMetadata(doc);
}

export default async function ChapterPage({ params }: Props) {
  const { slug } = await params;
  const doc = docs.find((entry) => entry.slug === slug.join('/'));
  if (!doc) notFound();
  return <DocPage doc={doc} />;
}
