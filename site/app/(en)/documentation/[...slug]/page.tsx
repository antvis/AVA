import { notFound } from 'next/navigation';
import DocPage, { docMetadata } from '../../../../components/docs/DocPage';
import { docStaticParams, findDoc } from '../../../../lib/docs';

type Props = { params: Promise<{ slug: string[] }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return docStaticParams();
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const doc = findDoc(slug.join('/'));
  if (!doc) notFound();
  return docMetadata(doc, 'en');
}

export default async function ChapterPage({ params }: Props) {
  const { slug } = await params;
  const doc = findDoc(slug.join('/'));
  if (!doc) notFound();
  return <DocPage locale="en" doc={doc} />;
}
